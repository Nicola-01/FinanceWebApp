import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Budget } from "../../utils/types";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useBudgets } from "./useBudgets";
import { BudgetCard } from "./BudgetCard";
import { BudgetFormOverlay } from "./BudgetFormOverlay";
import Button from "../../components/ui/Button";
import { useDeleteModal } from "../../modals/common/DeleteModalContext.tsx";

export const BudgetTab: React.FC = () => {
  const { wallet, tags } = useWalletContext();
  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } =
    useBudgets(wallet.id);
  const canEdit = wallet.userRole !== "VIEWER";
  const deleteModalRef = useDeleteModal();

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-app-text">Budgets</h2>
        {canEdit && (
          <Button
            accentColor={wallet.color}
            ripple
            onClick={() => setCreating(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            New budget
          </Button>
        )}
      </div>

      {!isLoading && budgets.length === 0 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>

      <BudgetFormOverlay
        open={creating || editing !== null}
        initial={editing}
        tags={tags}
        accentColor={wallet.color}
        onClose={closeForm}
        onSubmit={editing ? (p) => updateBudget(editing.id, p) : createBudget}
      />
    </div>
  );
};
