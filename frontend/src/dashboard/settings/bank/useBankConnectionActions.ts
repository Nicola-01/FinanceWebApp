import {
  deleteConnection,
  renewConnection,
  syncConnection,
  type BankConnection,
} from "../../../api/bankApi";
import { useWalletContext } from "../../wallet/WalletContext.tsx";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../../utils/apiError.ts";

const run = async (action: () => Promise<unknown>, fallback: string) => {
  try {
    await action();
  } catch (e) {
    triggerToast(getApiErrorTitle(e, fallback), false);
  }
};

/** Sync, renew and unlink for one bank connection; `reload` refreshes the account list. */
export function useBankConnectionActions(reload: () => Promise<void>) {
  const { fetchData } = useWalletContext();

  const sync = (c: BankConnection) =>
    run(async () => {
      const r = await syncConnection(c.id);
      if (r.status !== "ACTIVE")
        triggerToast(`Sync stopped: connection is ${r.status}`, false);
      else if (r.imported > 0)
        triggerToast(
          `Imported ${r.imported} transaction${r.imported === 1 ? "" : "s"}`,
          true,
        );
      else triggerToast("Nothing new", true);
      await reload();
      fetchData();
    }, "Sync failed");

  const renew = (c: BankConnection) =>
    run(async () => {
      const { url } = await renewConnection(c.id);
      window.location.assign(url);
    }, "Could not renew consent");

  const unlink = (c: BankConnection) =>
    run(async () => {
      await deleteConnection(c.id);
      await reload();
    }, "Could not unlink bank");

  return { sync, renew, unlink };
}
