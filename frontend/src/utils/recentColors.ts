/**
 * Recently-used colours for the icon/colour picker, persisted client-side in
 * localStorage (same lightweight pattern as `tagOrder.ts`). Global across the
 * app so a colour picked on one tag/wallet is offered again on the next.
 */

const STORAGE_KEY = "recent_tag_colors";
const MAX_RECENT = 6;

/** Read the recent colours (most-recent first), capped at {@link MAX_RECENT}. */
export function getRecentColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c): c is string => typeof c === "string")
      .slice(0, MAX_RECENT);
  } catch (e) {
    console.error("Error parsing recent colors from localStorage", e);
    return [];
  }
}

/**
 * Push a colour to the front of the recent list (deduplicated, case-insensitive)
 * and persist it. Returns the updated list. No-op for empty/whitespace input.
 */
export function pushRecentColor(color: string): string[] {
  const value = (color || "").trim();
  if (!value) return getRecentColors();

  const key = value.toLowerCase();
  const next = [
    value,
    ...getRecentColors().filter((c) => c.toLowerCase() !== key),
  ].slice(0, MAX_RECENT);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error("Error writing recent colors to localStorage", e);
  }
  return next;
}
