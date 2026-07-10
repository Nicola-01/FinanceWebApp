import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Budget } from "../../utils/types";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useBudgets } from "./useBudgets";
import { BudgetCard } from "./BudgetCard";
import Button from "../../components/ui/Button";

export const BudgetTab: React.FC = () => {
  const { wallet } = useWalletContext();
  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } =
    useBudgets(wallet.id);
  const canEdit = wallet.userRole !== "VIEWER";

  // Wired to BudgetFormOverlay + DeleteModal in the next task.
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  void editing;
  void creating;
  void deleting;
  void createBudget;
  void updateBudget;
  void deleteBudget;

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
            onDelete={setDeleting}
          />
        ))}
      </div>
    </div>
  );
};
