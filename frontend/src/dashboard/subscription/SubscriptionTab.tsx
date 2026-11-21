import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faList } from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import {
  SubscriptionModal,
  type SubscriptionModalHandle,
} from "../../modals/subscription/SubscriptionModal.tsx";
import {
  SubscriptionDetailsModal,
  type SubscriptionDetailsModalHandle,
} from "../../modals/subscription/SubscriptionDetailsModal.tsx";
import type { CurrencyCode } from "../../utils/currencies/index.ts";
import { SubscriptionCalendar } from "./SubscriptionCalendar.tsx";
import { SubscriptionList } from "./SubscriptionList.tsx";
import { SubscriptionSummaryV2 } from "./SubscriptionSummaryV2.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton.tsx";
import {
  TransactionDetailsModal,
  type TransactionDetailsModalHandle,
} from "../../modals/transaction/TransactionDetailsModal.tsx";
import {
  TransactionModal,
  type TransactionModalHandle,
} from "../../modals/transaction/TransactionModal.tsx";
import * as walletOps from "../../api/walletOps.ts";
import { Selector } from "../../components/ui/Selector.tsx";

type ViewMode = "list" | "calendar";

export const SubscriptionTab = () => {
  const { subscriptions, transactions, fetchData, isLoading } =
    useWalletContext();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [ui] = useUiVersion(); // ui-v2-switch

  const { wallet, tags } = useWalletContext();
  const invest = useInvestmentTags();

  const modalRef = useRef<SubscriptionModalHandle>(null);
  const detailsModalRef = useRef<SubscriptionDetailsModalHandle>(null);
  const txDetailsModalRef = useRef<TransactionDetailsModalHandle>(null);
  const txModalRef = useRef<TransactionModalHandle>(null);

  // v1 keeps the wallet-coloured active labels and the large size; v2's
  // SegmentedControl already colours the active segment itself.
  const activeStyle = (mode: ViewMode) =>
    ui !== "v2" && viewMode === mode ? { color: wallet.color } : undefined;

  const viewToggle = (
    <Selector
      value={viewMode}
      onChange={(val) => setViewMode(val as ViewMode)}
      size={ui === "v2" ? undefined : "lg"}
      // Equal segments: List and Calendar get the same width.
      fullWidth
      className={ui === "v2" ? "sm:w-72" : "w-full sm:w-72"}
      options={[
        {
          value: "list",
          label: "List",
          icon: <FontAwesomeIcon icon={faList} />,
          style: activeStyle("list"),
        },
        {
          value: "calendar",
          label: "Calendar",
          icon: <FontAwesomeIcon icon={faCalendarDays} />,
          style: activeStyle("calendar"),
        },
      ]}
    />
  );

  return (
    <div
      className={`flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out] ${ui === "v2" ? "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8" : ""}`} // ui-v2-switch: main's pb-28 already clears the dock; this only lifts the last row above the FAB (top at 136px phone, 80px lg)
    >
      {/* Header: v1 keeps the view toggle here; v2 only holds the title */}
      <div
        className={`flex items-center gap-4 mb-6 ${ui === "v2" ? "flex-wrap justify-between" : "justify-end"}`} // ui-v2-switch
      >
        {ui === "v2" && (
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
            Subscriptions
          </h2>
        )}
        {ui !== "v2" && viewToggle}
      </div>

      {/* v2 summary box: recurring totals + cost split */}
      {ui === "v2" && subscriptions.length > 0 && (
        <div className="mb-6 w-full">
          <SubscriptionSummaryV2
            subscriptions={subscriptions}
            currency={wallet.currency}
            invest={invest}
          />
        </div>
      )}

      {/* v2 view toggle: below the summary, block-level so it can span the width on mobile */}
      {ui === "v2" && <div className="mb-6">{viewToggle}</div>}

      {/* Active view */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-app-input rounded-2xl animate-pulse"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-app-surface shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-24 bg-app-surface rounded-md" />
                      <div className="h-3 w-16 bg-app-surface/60 rounded-full" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 pl-3">
                    <div className="h-5 w-20 bg-app-surface rounded-md" />
                    <div className="h-3 w-14 bg-app-surface/40 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === "list" ? (
          <SubscriptionList
            subscriptions={subscriptions}
            onEditSubscription={(sub) =>
              detailsModalRef.current?.openModal(sub)
            }
            onTransactionClick={(tx) =>
              txDetailsModalRef.current?.openModal(tx)
            }
          />
        ) : (
          <SubscriptionCalendar
            subscriptions={subscriptions}
            onEditSubscription={(sub, date) =>
              detailsModalRef.current?.openModal(sub, date)
            }
            onAddSubscription={(date) =>
              modalRef.current?.openModal(undefined, date)
            }
            onTransactionClick={(tx) =>
              txDetailsModalRef.current?.openModal(tx)
            }
          />
        )}
      </div>

      <SubscriptionModal
        ref={modalRef}
        wallet={wallet}
        tags={tags}
        baseCurrency={wallet.currency as CurrencyCode}
        onSuccess={fetchData}
      />

      <SubscriptionDetailsModal
        ref={detailsModalRef}
        wallet={wallet}
        onDeleteSuccess={() => fetchData()}
        onEditRequest={(sub) => modalRef.current?.openModal(sub)}
      />

      <TransactionDetailsModal
        ref={txDetailsModalRef}
        wallet={wallet}
        handleDeleteSuccess={async (id) => {
          const row = transactions.find((t) => t.id === id);
          await walletOps.deleteTransaction(
            wallet.id,
            id,
            row?.updatedAt ?? null,
          );
          fetchData();
        }}
        onEditRequest={(tx) => txModalRef.current?.openModal(tx)}
      />

      <TransactionModal
        ref={txModalRef}
        wallet={wallet}
        tags={tags}
        baseCurrency={wallet.currency as CurrencyCode}
        onSuccess={fetchData}
      />

      {viewMode === "list" && (
        <FloatingActionButton
          wallet={wallet}
          onClick={() => modalRef.current?.openModal()}
          label="New Subscription"
        />
      )}
    </div>
  );
};
