// Calendar-day <-> Date conversion for the backend's `LocalDate` fields
// (`YYYY-MM-DD`). Both directions use the user's local calendar day: no UTC
// shift (unlike `toISOString` / `new Date("YYYY-MM-DD")`) and no dependency on
// the browser locale (unlike `toLocaleDateString`).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Local calendar day of `d` as zero-padded `YYYY-MM-DD`. */
export const toLocalIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Parse `YYYY-MM-DD` to local midnight of that day (other formats fall back to `new Date`). */
export const parseLocalIsoDate = (s: string): Date => {
  const m = ISO_DATE.exec(s);
  return m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(s);
};
