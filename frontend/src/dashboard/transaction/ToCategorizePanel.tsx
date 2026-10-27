import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Tag, Transaction, Wallet } from "../../types/domain.ts";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import * as walletOps from "../../api/walletOps.ts";
import Button from "../../components/ui/Button.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import { TagPicker } from "../../modals/transaction/TagPicker.tsx";
import { useDeleteModal } from "../../modals/common/DeleteModalContext";

const COLLAPSED_COUNT = 5;

interface ToCategorizePanelProps {
  wallet: Wallet;
  tags: Tag[];
  transactions: Transaction[];
  onRefresh: () => void;
  onOpenDetails: (tx: Transaction) => void;
  /** Opens the edit form directly. */
  onEdit: (tx: Transaction) => void;
}

/** Pinned list of imported bank transactions that still need a category. */
export const ToCategorizePanel: React.FC<ToCategorizePanelProps> = ({
  wallet,
  tags,
  transactions,
  onRefresh,
  onOpenDetails,
  onEdit,
}) => {
  const [expanded, setExpanded] = useState(false);
  const deleteModalRef = useDeleteModal();
  const canEdit = wallet.userRole !== "VIEWER";

  if (transactions.length === 0) return null;
  const visible = expanded
    ? transactions
    : transactions.slice(0, COLLAPSED_COUNT);

  const changeTag = async (tx: Transaction, tagName: string) => {
    if (tagName === tx.tag.name) return;
    try {
      await walletOps.updateTransaction(
        wallet.id,
        tx.id,
        {
          name: tx.name,
          amount: tx.amount,
          originalAmount: tx.originalAmount ?? tx.amount,
          type: tx.type,
          transactionDate: tx.transactionDate,
          originalCurrency: tx.originalCurrency ?? wallet.currency,
          exchangeValue: tx.exchangeValue ?? 1,
          tag: tagName,
          notes: tx.notes ?? "",
        },
        tx.updatedAt ?? null,
      );
      onRefresh();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating category"), false);
    }
  };

  const remove = (tx: Transaction) =>
    deleteModalRef.current?.deleteObject(
      tx,
      "transaction",
      async () => {
        try {
          await walletOps.deleteTransaction(
            wallet.id,
            tx.id,
            tx.updatedAt ?? null,
          );
          onRefresh();
        } catch (err: unknown) {
          triggerToast(
            getApiErrorTitle(err, "Error deleting transaction"),
            false,
          );
        }
      },
      0,
    );

  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="mb-1 flex items-center gap-2">
        <FontAwesomeIcon
          icon={faBuildingColumns}
          className="text-xs"
          style={{ color: wallet.color }}
        />
        <h4 className="text-xs font-black uppercase tracking-widest text-app-muted">
          To categorize ({transactions.length})
        </h4>
      </div>
      {visible.map((tx) => {
        const date = new Date(tx.transactionDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const symbol =
          CURRENCY_META[tx.originalCurrency as CurrencyCode]?.symbol ?? "";
        return (
          <div
            key={tx.id}
            onClick={() => onOpenDetails(tx)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-input p-4 transition-all hover:bg-app-surface"
          >
            <div className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="truncate text-base font-bold text-app-text">
                {tx.name}
              </span>
              <span className="text-xs font-medium text-app-muted">{date}</span>
            </div>
            <div
              className="flex shrink-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={`font-app-mono text-sm font-bold ${tx.type === "INCOME" ? "text-app-green" : "text-app-red"}`}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                {tx.amount.toFixed(2)} {symbol}
              </span>
              {canEdit && (
                <>
                  <div className="w-44">
                    <TagPicker
                      tags={tags}
                      showLabel={false}
                      selectedTagName={tx.tag.name}
                      onSelectTag={(name) => changeTag(tx, name)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onEdit(tx)}
                    aria-label={`Edit ${tx.name}`}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => remove(tx)}
                    aria-label={`Delete ${tx.name}`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
      {transactions.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="self-start text-xs font-bold text-app-muted hover:text-app-text"
        >
          {expanded ? "Show less" : `Show all (${transactions.length})`}
        </button>
      )}
    </div>
  );
};
