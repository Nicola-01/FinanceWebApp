import type { BankConnection } from "../../../api/bankApi";

export function relativeTime(iso?: string) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

/** Most recent sync across every linked account, or undefined when none has synced. */
export function latestSync(connections: BankConnection[]): string | undefined {
  let latest: string | undefined;
  for (const c of connections)
    for (const a of c.accounts)
      if (
        a.lastSyncedAt &&
        (!latest ||
          new Date(a.lastSyncedAt).getTime() > new Date(latest).getTime())
      )
        latest = a.lastSyncedAt;
  return latest;
}
