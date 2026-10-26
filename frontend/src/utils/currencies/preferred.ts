// --- Preferred ("starred") foreign currency, per wallet ---
//
// The currency to preselect when the user turns on "different currency" for a
// transaction/subscription. One per wallet; when unset the default is simply the
// wallet's own currency. Stored client-side (localStorage), like the fx cache.

const preferredKey = (walletId?: string): string =>
  `fx_default_currency_${walletId ?? "global"}`;

/** The wallet's starred default foreign currency, or `null` when none is set. */
export const getPreferredForeignCurrency = (
  walletId?: string,
): string | null => {
  try {
    return localStorage.getItem(preferredKey(walletId));
  } catch {
    return null;
  }
};

/** Star (`code`) or un-star (`null`) the wallet's default foreign currency. */
export const setPreferredForeignCurrency = (
  walletId: string | undefined,
  code: string | null,
): void => {
  try {
    if (code) localStorage.setItem(preferredKey(walletId), code);
    else localStorage.removeItem(preferredKey(walletId));
  } catch {
    /* storage unavailable — the preference just won't persist */
  }
};
