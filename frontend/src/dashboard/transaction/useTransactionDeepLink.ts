import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Transaction } from "../../types/domain";

/**
 * Opens the transaction named by `?tx=<id>` (a notification's deep link) once it
 * is among the loaded transactions, then drops the param so it opens only once.
 * Until the row shows up (e.g. stale cache before a refetch) the param is kept.
 */
export function useTransactionDeepLink(
  transactions: Transaction[],
  open: (tx: Transaction) => void,
): void {
  const [params, setParams] = useSearchParams();
  const txId = params.get("tx");

  useEffect(() => {
    if (!txId) return;
    const tx = transactions.find((t) => String(t.id) === txId);
    if (!tx) return;
    open(tx);
    setParams(
      (p) => {
        p.delete("tx");
        return p;
      },
      { replace: true },
    );
  }, [txId, transactions, open, setParams]);
}
