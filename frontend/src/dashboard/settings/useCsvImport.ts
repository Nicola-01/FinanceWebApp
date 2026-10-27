import React, { useRef, useState } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorDetail } from "../../utils/apiError.ts";
import type { ImportRecap } from "../../modals/common/ImportReviewModal.tsx";
import api from "../../api/axiosConfig";
import {
  parseTransactionsCsv,
  parseTagsCsv,
  parseSubscriptionsCsv,
  type TransactionRequest,
  type TagRequest,
  type SubscriptionRequest,
} from "./csvImport.ts";
import {
  detectTransactionOverwrites,
  detectTagOverwrites,
  detectSubscriptionOverwrites,
  type DedupOverwrite,
} from "./csvDedup.ts";
import {
  validateTransactions,
  validateTags,
  validateSubscriptions,
  type RowError,
} from "./csvValidation.ts";

/** Which resource an export/import action targets. */
type Resource = "transactions" | "tags" | "subscriptions";

/** Request DTOs the bulk endpoints accept, keyed by resource. */
type ImportDtos = TransactionRequest[] | TagRequest[] | SubscriptionRequest[];

/** A prepared import: everything needed to POST and to render the review modal. */
interface ImportJob {
  resource: Resource;
  endpoint: string;
  dtos: ImportDtos;
  newCount: number;
  overwrites: DedupOverwrite[];
  /** Client-side validation problems; a non-empty list blocks the import. */
  rowErrors: RowError[];
}

/** Live state of the review modal (null = closed). */
interface ImportModalState extends ImportJob {
  phase: "confirm" | "recap";
  recap?: ImportRecap;
  submitting: boolean;
}

/** Shape of the structured bulk-import response bodies. */
interface BulkResponse {
  created?: unknown[];
  updated?: unknown[];
  autoCreatedTags?: { name: string }[];
}

/** Reduces a bulk response to the recap counts the modal displays. */
export const toRecap = (data: BulkResponse): ImportRecap => ({
  created: data.created?.length ?? 0,
  updated: data.updated?.length ?? 0,
  autoCreatedTags: (data.autoCreatedTags ?? []).map((t) => t.name),
});

/**
 * CSV import flow for the Data-management tab: file picking, parse +
 * validation + dedup detection, the overwrite confirm gate, and the atomic
 * bulk POST that ends in the recap phase.
 */
export const useCsvImport = () => {
  const { wallet, tags, transactions, subscriptions, fetchData } =
    useWalletContext();
  // Review modal state (null = closed). Confirm phase gates overwrites; recap
  // phase reports the backend's structured result after a successful import.
  const [review, setReview] = useState<ImportModalState | null>(null);

  // One hidden <input> shared by all three import buttons; the button that was
  // clicked stores its resource here so the change handler knows the target.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTargetRef = useRef<Resource | null>(null);

  // Open the file picker for a given resource.
  const requestImport = (resource: Resource) => {
    importTargetRef.current = resource;
    fileInputRef.current?.click();
  };

  // Parse the CSV into request DTOs and run dedup detection against the wallet
  // data, so the caller knows both the payload and whether overwrites loom.
  const buildJob = (target: Resource, text: string): ImportJob => {
    if (target === "transactions") {
      const dtos = parseTransactionsCsv(text);
      const rowErrors = validateTransactions(dtos);
      const { overwrites, newCount } = detectTransactionOverwrites(
        dtos,
        transactions,
      );
      return {
        resource: target,
        endpoint: `/transactions/${wallet.id}/bulk`,
        dtos,
        overwrites,
        newCount,
        rowErrors,
      };
    }
    if (target === "tags") {
      const dtos = parseTagsCsv(text);
      // Existing wallet tags count as resolvable parents for the batch.
      const rowErrors = validateTags(
        dtos,
        tags.map((t) => t.name),
      );
      const { overwrites, newCount } = detectTagOverwrites(dtos, tags);
      return {
        resource: target,
        endpoint: `/tags/${wallet.id}/bulk`,
        dtos,
        overwrites,
        newCount,
        rowErrors,
      };
    }
    const dtos = parseSubscriptionsCsv(text);
    const rowErrors = validateSubscriptions(dtos);
    const { overwrites, newCount } = detectSubscriptionOverwrites(
      dtos,
      subscriptions,
    );
    return {
      resource: target,
      endpoint: `/subscription/${wallet.id}/bulk`,
      dtos,
      overwrites,
      newCount,
      rowErrors,
    };
  };

  // POST the whole file to the matching bulk endpoint in a single atomic
  // request, then swap the modal to the recap phase and refresh wallet data.
  const submitJob = async (job: ImportJob) => {
    setReview((prev) => (prev ? { ...prev, submitting: true } : prev));
    try {
      const { data } = await api.post(job.endpoint, job.dtos);
      setReview({
        ...job,
        phase: "recap",
        recap: toRecap(data as BulkResponse),
        submitting: false,
      });
      await fetchData();
    } catch (err: unknown) {
      // The bulk endpoints report the offending line as `Row N: <reason>`.
      triggerToast(getApiErrorDetail(err, "Import failed"), false);
      setReview(null);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    const target = importTargetRef.current;
    // Reset immediately so re-selecting the same file fires `change` again.
    input.value = "";
    importTargetRef.current = null;

    if (!file || !target) return;

    let job: ImportJob;
    try {
      job = buildJob(target, await file.text());
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Import failed"), false);
      return;
    }

    // Client-side validation gate: never POST a file the backend would 409 on.
    if (job.rowErrors.length > 0) {
      const first = job.rowErrors[0];
      const more =
        job.rowErrors.length > 1 ? ` (+${job.rowErrors.length - 1} more)` : "";
      triggerToast(`Row ${first.row}: ${first.message}${more}`, false);
      return;
    }

    // Overwrites → gate behind the confirm phase; the user commits explicitly.
    if (job.overwrites.length > 0) {
      setReview({ ...job, phase: "confirm", submitting: false });
      return;
    }

    // Nothing to overwrite → import straight away and show the recap.
    await submitJob(job);
  };

  return {
    review,
    closeReview: () => setReview(null),
    submitJob,
    fileInputRef,
    requestImport,
    handleFileSelected,
  };
};
