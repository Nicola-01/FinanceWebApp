/**
 * Converte un nome wallet in uno slug URL-safe:
 * minuscolo, accenti rimossi, sequenze non-alfanumeriche -> singolo trattino,
 * trim dei trattini. Fallback "wallet" se il risultato è vuoto.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove i diacritici
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "wallet";
}

/** Slug canonico di un wallet: `nome-<ultimi5uuid>`. */
export function walletSlug(wallet: { id: string; name: string }): string {
  return `${slugify(wallet.name)}-${wallet.id.slice(-5)}`;
}
