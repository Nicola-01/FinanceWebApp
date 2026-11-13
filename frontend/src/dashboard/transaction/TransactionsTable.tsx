import {
  TransactionDetailsModal,
  type TransactionDetailsModalHandle,
} from "../../modals/transaction/TransactionDetailsModal.tsx";
import {
  TransactionModal,
  type TransactionModalHandle,
} from "../../modals/transaction/TransactionModal.tsx";
import React, { useCallback, useRef, useState } from "react";
import type { Tag, Transaction, Wallet } from "../../types/domain.ts";
import TransactionRow from "./TransactionRow.tsx";
import { TransactionRowV2 } from "./TransactionRowV2.tsx"; // ui-v2-switch
import { PendingTransactionsPanel } from "./PendingTransactionsPanel.tsx";
import * as walletOps from "../../api/walletOps.ts";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faReceipt } from "@fortawesome/free-solid-svg-icons";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import { EmptyState } from "../../components/ui/EmptyState.tsx"; // ui-v2-switch
import Button from "../../components/ui/Button.tsx"; // ui-v2-switch
import { useUiVersion } from "../../hooks/useUiVersion.ts"; // ui-v2-switch
import { sumByType } from "../../utils/period.ts"; // ui-v2-switch
import { formatAmount } from "../../utils/format.ts"; // ui-v2-switch
import { FloatingActionButton } from "../../components/ui/FloatingActionButton.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import {
  formatDateHeader,
  groupTransactionsByDate,
} from "./groupTransactionsByDate.ts";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useTransactionDeepLink } from "./useTransactionDeepLink.ts";

interface TransactionsTableProps {
  wallet: Wallet;
  tags: Tag[];
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  onRefresh: () => void;
  isLoading: boolean;
}

const SkeletonDateHeader = () => (
  <div className="mb-4 mt-2 flex items-center gap-4 animate-pulse">
    <div className="h-px w-8 bg-app-border rounded-full"></div>
    <div className="h-3 w-24 bg-app-border rounded-full"></div>
    <div className="h-px flex-1 bg-app-border rounded-full"></div>
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-app-input mb-2 animate-pulse border border-app-border">
    <div className="h-10 w-10 shrink-0 rounded-full bg-app-surface"></div>
    <div className="flex-1 flex flex-col gap-2.5">
      <div className="h-3.5 w-1/3 rounded-md bg-app-surface"></div>
      <div className="h-2.5 w-1/4 rounded-md bg-app-input"></div>
    </div>
    <div className="h-4 w-16 rounded-md bg-app-surface"></div>
  </div>
);

// ui-v2-switch: one surface box, three rows shaped like TransactionRowV2
const SkeletonGroupV2 = () => (
  <div className="animate-pulse rounded-[var(--r-card)] bg-app-card p-2 shadow-[var(--box-ring)]">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5"
      >
        <div className="h-10 w-10 rounded-[11px] bg-app-raised"></div>
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-1/3 rounded-md bg-app-raised"></div>
          <div className="h-2.5 w-1/4 rounded-md bg-app-raised"></div>
        </div>
        <div className="h-4 w-16 rounded-md bg-app-raised"></div>
      </div>
    ))}
  </div>
);

// ui-v2-switch: each day is a surface box with the net total on its header line
const DayGroupV2 = ({
  date,
  currency,
  rows,
  onOpen,
}: {
  date: string;
  currency: CurrencyCode;
  rows: Transaction[];
  onOpen: (tx: Transaction) => void;
}) => {
  const { income, expense } = sumByType(rows);
  const symbol = CURRENCY_META[currency]?.symbol;
  return (
    <div className="mb-3.5 rounded-[var(--r-card)] bg-app-card p-2 shadow-[var(--box-ring)]">
      <div className="flex justify-between px-3 pb-2 pt-1 text-[13px] text-app-muted">
        <span>{formatDateHeader(date)}</span>
        <span className="tabular-nums">
          {formatAmount(income - expense, { signed: true })}
          {symbol && ` ${symbol}`}
        </span>
      </div>
      <div className="flex flex-col">
        {rows.map((tx, index, array) => (
          <TransactionRowV2
            key={tx.id}
            transaction={tx}
            onClick={onOpen}
            isFirst={index === 0}
            isLast={index === array.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  wallet,
  tags,
  transactions,
  pendingTransactions,
  isLoading,
  onRefresh,
}) => {
  const detailsModalRef = useRef<TransactionDetailsModalHandle>(null);
  const transactionModalRef = useRef<TransactionModalHandle>(null);
  const [ui] = useUiVersion(); // ui-v2-switch

  // Search every wallet transaction, not just this filtered list: a notified row may sit
  // outside the selected period.
  const { transactions: allTransactions } = useWalletContext();
  // A reminder awaiting its amount lands on its pinned input, not the read-only details.
  const [focusPendingId, setFocusPendingId] = useState<string | null>(null);
  useTransactionDeepLink(
    allTransactions,
    useCallback((tx: Transaction) => {
      if (tx.amountPending) setFocusPendingId(String(tx.id));
      else detailsModalRef.current?.openModal(tx);
    }, []),
  );

  const { groups: groupedTransactions, sortedDates } =
    groupTransactionsByDate(transactions);

  const onSuccessDelete = async (id: string) => {
    try {
      const row = transactions.find((t) => t.id === id);
      await walletOps.deleteTransaction(wallet.id, id, row?.updatedAt ?? null);
      onRefresh(); // Safer to let the parent refetch than to mutate the array locally
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting transaction"), false);
      return false;
    }
  };

  return (
    <div className="flex flex-col flex-1 relative min-h-0">
      <div className="flex-1 overflow-auto pb-10 custom-scrollbar">
        {!isLoading && (
          <PendingTransactionsPanel
            wallet={wallet}
            pendingTransactions={pendingTransactions}
            focusId={focusPendingId}
            onFilled={onRefresh}
            onOpenDetails={(tx) => detailsModalRef.current?.openModal(tx)}
          />
        )}
        {/* 1. Loading state */}
        {isLoading ? (
          ui === "v2" ? ( // ui-v2-switch
            <SkeletonGroupV2 />
          ) : (
            <>
              <div className="mb-6">
                <SkeletonDateHeader />
                <div>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              </div>
            </>
          )
        ) : /* 2. Empty state (no transactions) */
        transactions.length === 0 && pendingTransactions.length === 0 ? (
          ui === "v2" ? ( // ui-v2-switch
            <EmptyState
              title="No transactions in this period"
              description="Add a transaction, or link a bank account to import them."
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => transactionModalRef.current?.openModal()}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  New transaction
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-app-muted">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-input">
                <FontAwesomeIcon
                  icon={faReceipt}
                  className="text-2xl opacity-50"
                />
              </div>
              <p className="text-sm font-bold">
                No transactions found for this period.
              </p>
              <p className="mt-1 text-xs font-medium opacity-60">
                Click "New Transaction" to add your first one.
              </p>
            </div>
          )
        ) : (
          /* 3. Data state */
          sortedDates.map((date) =>
            ui === "v2" ? ( // ui-v2-switch
              <DayGroupV2
                key={date}
                date={date}
                currency={wallet.currency as CurrencyCode}
                rows={groupedTransactions[date]}
                onOpen={(tx) => detailsModalRef.current?.openModal(tx)}
              />
            ) : (
              <div key={date} className="mb-6">
                <div className="mb-4 mt-2 flex items-center gap-4">
                  <div className="h-px w-8 bg-app-border rounded-full"></div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-app-muted whitespace-nowrap">
                    {formatDateHeader(date)}
                  </h4>
                  <div className="h-px flex-1 bg-app-border rounded-full"></div>
                </div>

                {/* No gap: rows sit flush against each other */}
                <div className="flex flex-col">
                  {groupedTransactions[date].map((tx, index, array) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      onClick={(tx) => detailsModalRef.current?.openModal(tx)}
                      isFirst={index === 0}
                      isLast={index === array.length - 1}
                    />
                  ))}
                </div>
              </div>
            ),
          )
        )}

        {/* MODALS */}
        <TransactionDetailsModal
          ref={detailsModalRef}
          wallet={wallet}
          handleDeleteSuccess={onSuccessDelete}
          onEditRequest={(tx) => {
            transactionModalRef.current?.openModal(tx);
          }}
        />

        <TransactionModal
          ref={transactionModalRef}
          wallet={wallet}
          tags={tags}
          baseCurrency={wallet.currency as CurrencyCode}
          onSuccess={onRefresh}
        />
      </div>

      {/* FLOATING ACTION BUTTON */}
      {!isLoading && wallet.userRole !== "VIEWER" && (
        <FloatingActionButton
          wallet={wallet}
          onClick={() => transactionModalRef.current?.openModal()}
        />
      )}
    </div>
  );
};
