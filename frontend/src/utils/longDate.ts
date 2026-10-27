/**
 * Long, browser-locale display of a value starting with `YYYY-MM-DD`
 * (e.g. "July 2, 2026"), built from the local calendar day so there is no UTC
 * shift (unlike `new Date("2026-07-02")`). Other strings are returned unchanged.
 */
export function formatLongLocalDate(raw: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" },
  );
}
