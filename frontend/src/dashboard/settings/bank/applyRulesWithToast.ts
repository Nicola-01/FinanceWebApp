import { applyBankRules } from "../../../api/bankApi";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../../utils/apiError.ts";

/**
 * Runs the wallet's rules over the imports still to categorise and toasts the outcome.
 * Resolves to how many imports were updated (0 on failure).
 */
export async function applyRulesWithToast(walletId: string): Promise<number> {
  try {
    const { updated, collisions } = await applyBankRules(walletId);
    const done =
      updated === 0
        ? "No imports to categorise matched a rule"
        : `Updated ${updated} import${updated === 1 ? "" : "s"}`;
    triggerToast(
      collisions > 0
        ? `${done}. ${collisions} skipped: more than one rule matched.`
        : done,
      true,
    );
    return updated;
  } catch (err) {
    triggerToast(getApiErrorTitle(err, "Could not apply rules"), false);
    return 0;
  }
}
