/** User-chosen wallet order (wallet ids), persisted in localStorage. */
const WALLET_ORDER_KEY = "wallet_order";

/** The saved order, or `null` when absent or unreadable (parse errors are logged). */
export const readWalletOrder = (): string[] | null => {
  const raw = localStorage.getItem(WALLET_ORDER_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed))
      throw new TypeError("wallet_order is not an array");
    return parsed as string[];
  } catch (e) {
    console.error("Error parsing wallet_order from localStorage", e);
    return null;
  }
};

export const writeWalletOrder = (ids: string[]): void => {
  localStorage.setItem(WALLET_ORDER_KEY, JSON.stringify(ids));
};

/** Wallets in saved order; ids missing from `order` keep their relative order at the end. */
export const sortWalletsBySavedOrder = <T extends { id: string }>(
  wallets: T[],
  order: string[],
): T[] =>
  [...wallets].sort((a, b) => {
    const indexA = order.indexOf(a.id);
    const indexB = order.indexOf(b.id);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
