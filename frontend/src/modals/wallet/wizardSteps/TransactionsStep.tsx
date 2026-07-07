import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faReceipt } from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { WizardStepHeader } from "./WizardStepHeader";
import { MissingTransactionTags } from "./MissingTransactionTags";
import {
  groupMissingTransactionTags,
  reassignTransactionTag,
  removeTransactionsWithTag,
} from "./transactionTags";
import { addTagToDraft } from "./tagDraft";
import type {
  TagRequest,
  TransactionRequest,
} from "../../../dashboard/settings/csvImport";

export interface TransactionsStepProps {
  /** Transactions staged so far (owned by the wizard). */
  value: TransactionRequest[];
  /** Emit the next staged list (append on a good upload, or `[]` on clear). */
  onChange: (next: TransactionRequest[]) => void;
  /** Wallet currency code (e.g. "EUR") used to annotate staged amounts. */
  currency: string;
  /** Wallet colour (hex) applied to the upload CTA. */
  accentColor?: string;
  /** Tags staged in the previous (Tags) step — resolves each transaction's tag. */
  tags?: TagRequest[];
  /** Add a tag to the draft (for "Create «X»" when a transaction's tag is missing). */
  onTagsChange?: (next: TagRequest[]) => void;
}

/** How many staged rows to preview before collapsing into a "+N more" note. */
const PREVIEW_LIMIT = 5;

/**
 * Wizard step (body only) that stages transactions for a new wallet from a CSV
 * upload — the only entry point. Optional: the wizard lets the user continue
 * without any. The shared {@link CsvUploadField} handles parse/validate/errors;
 * this step just appends clean rows and previews the staged list.
 *
 * Like the Subscriptions step, a staged transaction pointing at a tag that isn't
 * in the wallet blocks Continue. Because transactions arrive in bulk, conflicts
 * are grouped **per missing tag** in {@link MissingTransactionTags}, where each
 * one can be created, reassigned to an existing tag, or removed wholesale.
 */
export function TransactionsStep({
  value,
  onChange,
  currency,
  accentColor,
  tags = [],
  onTagsChange,
}: TransactionsStepProps): React.JSX.Element {
  const preview = value.slice(0, PREVIEW_LIMIT);
  const overflow = value.length - preview.length;
  const missingGroups = groupMissingTransactionTags(value, tags);

  const createMissingTag = (name: string) => {
    if (!onTagsChange) return;
    const next = addTagToDraft(name, tags, accentColor);
    if (next !== tags) onTagsChange(next);
  };

  const reassign = (key: string, toName: string) =>
    onChange(reassignTransactionTag(value, key, toName));

  const removeTagged = (key: string) =>
    onChange(removeTransactionsWithTag(value, key));

  return (
    <div className="flex flex-col gap-5">
      <WizardStepHeader
        icon={faReceipt}
        title="Add transactions"
        subtitle="Optional — continue without transactions, or import them from a CSV."
        note="You can edit or delete any transaction anytime from the wallet."
      />

      <CsvUploadField<TransactionRequest>
        resource="transactions"
        title="Import transactions from a CSV"
        subtitle="You can continue without adding any."
        columnsHint="Date, Name, Tag, Amount, Type, …"
        noun="transaction"
        accentColor={accentColor}
        onDtos={(dtos) => onChange([...value, ...dtos])}
      />

      <MissingTransactionTags
        groups={missingGroups}
        tags={tags}
        accentColor={accentColor}
        onCreate={createMissingTag}
        onReassign={reassign}
        onRemove={removeTagged}
      />

      {value.length > 0 && (
        <div className="rounded-[var(--r-input)] border border-app-border bg-app-input">
          <div className="flex items-center justify-between border-b border-app-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
              {value.length} staged
            </span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => onChange([])}
            >
              <FontAwesomeIcon icon={faTrashCan} />
              Clear
            </Button>
          </div>
          <ul className="custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto">
            {preview.map((tx, i) => (
              <li
                key={`${tx.name}-${tx.transactionDate}-${i}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-app-text">
                  {tx.name || <span className="text-app-muted">(unnamed)</span>}
                </span>
                <span className="shrink-0 font-app-mono text-xs tabular-nums text-app-muted">
                  <span
                    className={
                      tx.type === "INCOME" ? "text-app-green" : "text-app-red"
                    }
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {tx.amount} {currency}
                  </span>
                  {" · "}
                  {tx.transactionDate}
                </span>
              </li>
            ))}
          </ul>
          {overflow > 0 && (
            <p className="border-t border-app-border px-3 py-2 text-xs text-app-muted">
              +{overflow} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TransactionsStep;
