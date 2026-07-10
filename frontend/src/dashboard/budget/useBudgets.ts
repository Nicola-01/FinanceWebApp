import { useCallback, useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorTitle } from "../../utils/apiError";
import type { Budget, BudgetPayload } from "../../utils/types";

/**
 * Budget list + CRUD for one wallet. Colocated with the Budget tab (the only
 * consumer): the tab remounts on every visit, so each visit re-fetches the
 * server-computed status.
 */
export function useBudgets(walletId: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Budget[]>(`/budgets/${walletId}`);
      setBudgets(res.data);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error loading budgets"), false);
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createBudget = async (payload: BudgetPayload): Promise<boolean> => {
    try {
      await api.post(`/budgets/${walletId}`, payload);
      triggerToast("Budget created!", true);
      await refresh();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error creating budget"), false);
      return false;
    }
  };

  const updateBudget = async (
    budgetId: string,
    payload: BudgetPayload,
  ): Promise<boolean> => {
    try {
      await api.put(`/budgets/${walletId}/${budgetId}`, payload);
      triggerToast("Budget updated!", true);
      await refresh();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating budget"), false);
      return false;
    }
  };

  const deleteBudget = async (budgetId: string): Promise<boolean> => {
    try {
      await api.delete(`/budgets/${walletId}/${budgetId}`);
      triggerToast("Budget deleted!", true);
      await refresh();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting budget"), false);
      return false;
    }
  };

  return {
    budgets,
    isLoading,
    refresh,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
