/**
 * Converts a wallet name into a URL-safe slug: lowercase, accents stripped,
 * non-alphanumeric runs -> single dash, dashes trimmed. Falls back to "wallet"
 * when the result is empty.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "wallet";
}

/** Canonical wallet slug: `name-<last5uuid>`. */
export function walletSlug(wallet: { id: string; name: string }): string {
  return `${slugify(wallet.name)}-${wallet.id.slice(-5)}`;
}
