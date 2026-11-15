import { useCallback, useEffect, useState } from "react";
import {
  getWalletBank,
  listBankRules,
  type BankConnection,
} from "../../../api/bankApi";
import type { BankRule } from "../../../types/domain";

/** Open Banking state and linked accounts for a wallet. */
export function useWalletBank(walletId: string) {
  // null until the first load answers, so nothing flashes before we know.
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = useCallback(
    () =>
      getWalletBank(walletId)
        .then((r) => {
          setLoadFailed(false);
          setEnabled(r.enabled);
          setConnections(r.connections);
        })
        .catch(() => setLoadFailed(true)),
    [walletId],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { enabled, connections, loadFailed, reload };
}

/** The wallet's bank rules; fetched only once Open Banking is known to be enabled. */
export function useBankRules(walletId: string, enabled: boolean | null) {
  // null until loaded, so a count never flashes as zero.
  const [rules, setRules] = useState<BankRule[] | null>(null);

  const reload = useCallback(
    () =>
      listBankRules(walletId)
        .then(setRules)
        .catch(() => setRules([])),
    [walletId],
  );

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  return { rules, reload };
}
