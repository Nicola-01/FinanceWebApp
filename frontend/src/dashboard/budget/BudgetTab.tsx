import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Budget } from "../../types/domain";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useBudgets } from "./useBudgets";
import { BudgetCard } from "./BudgetCard";
import { BudgetFormOverlay } from "./BudgetFormOverlay";
import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useDeleteModal } from "../../modals/common/DeleteModalContext.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
import { monthAside } from "./budgetLogic";

export const BudgetTab: React.FC = () => {
  const { wallet, tags } = useWalletContext();
  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } =
    useBudgets(wallet.id);
  const canEdit = wallet.userRole !== "VIEWER";
  const deleteModalRef = useDeleteModal();
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch

  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const requestDelete = (budget: Budget) => {
    deleteModalRef.current?.deleteObject(
      budget,
      "budget",
      async () => {
        await deleteBudget(budget.id);
      },
      1,
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
      {/* ui-v2-switch */}
      <div className="flex items-center justify-between gap-3">
        {isV2 ? (
          <div className="flex min-w-0 items-baseline gap-3">
            <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-app-text">
              Budgets
            </h2>
            {budgets.length > 0 && (
              <span className="truncate text-[13px] text-app-muted">
                {monthAside(new Date())}
              </span>
            )}
          </div>
        ) : (
          <h2 className="text-lg font-bold text-app-text">Budgets</h2>
        )}
        {canEdit &&
          (isV2 ? (
            <Button variant="primary" ripple onClick={() => setCreating(true)}>
              <FontAwesomeIcon icon={faPlus} />
              New budget
            </Button>
          ) : (
            <Button
              accentColor={wallet.color}
              ripple
              onClick={() => setCreating(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              New budget
            </Button>
          ))}
      </div>

      {!isLoading && budgets.length === 0 && isV2 && (
        <EmptyState
          title="No budgets yet"
          description="Set a monthly limit for a category or the whole wallet."
          action={
            canEdit ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                <FontAwesomeIcon icon={faPlus} />
                New budget
              </Button>
            ) : undefined
          }
        />
      )}
      {!isLoading && budgets.length === 0 && !isV2 && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-app-input mb-4 text-app-muted">
            <FontAwesomeIcon icon={faBullseye} className="text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-app-text mb-1">
            No budgets yet
          </h3>
          <p className="text-sm text-app-muted max-w-sm">
            Set a spending limit on a category or on the whole wallet to start
            tracking.
          </p>
        </div>
      )}

      <div
        className={
          isV2
            ? "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3" // ui-v2-switch
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        }
      >
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            currency={wallet.currency}
            canEdit={canEdit}
            onEdit={setEditing}
            onDelete={requestDelete}
          />
        ))}
        {isV2 && canEdit && budgets.length > 0 && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[var(--r-card)] border-[1.5px] border-dashed border-app-border text-[13px] font-semibold text-app-muted transition-colors hover:text-app-text"
          >
            <FontAwesomeIcon icon={faPlus} />
            New budget
          </button>
        )}
      </div>

      <BudgetFormOverlay
        open={creating || editing !== null}
        initial={editing}
        tags={tags}
        accentColor={wallet.color}
        currency={wallet.currency}
        onClose={closeForm}
        onSubmit={editing ? (p) => updateBudget(editing.id, p) : createBudget}
      />
    </div>
  );
};
