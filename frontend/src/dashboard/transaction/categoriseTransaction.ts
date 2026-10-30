import type { Transaction, Wallet } from "../../types/domain.ts";
import * as walletOps from "../../api/walletOps.ts";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

/**
 * Files a transaction under `tagName`, keeping every other field. The backend clears
 * the review flag on a tag change. Resolves false (after a toast) on failure.
 */
export async function categoriseTransaction(
  wallet: Wallet,
  tx: Transaction,
  tagName: string,
): Promise<boolean> {
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
    return true;
  } catch (err: unknown) {
    triggerToast(getApiErrorTitle(err, "Error updating category"), false);
    return false;
  }
}
