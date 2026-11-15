import type { Transaction } from "../../types/domain";

const BANK_NOTE = "Bank: ";

/** Mirrors the backend BankMatchRule: the saved text is trimmed, a regex is a `find`. */
export function ruleMatches(
  rule: { matchText: string; regex: boolean; ignoreCase: boolean },
  bankName: string,
): boolean {
  const text = rule.matchText.trim();
  if (!text) return false;
  if (!rule.regex) {
    return rule.ignoreCase
      ? bankName.toLowerCase().includes(text.toLowerCase())
      : bankName.includes(text);
  }
  try {
    return new RegExp(text, rule.ignoreCase ? "i" : "").test(bankName);
  } catch {
    return false;
  }
}

/** The bank's own name: a renamed import keeps it in its "Bank: <name>" note. */
export function bankNameOf(tx: Transaction): string {
  const notes = tx.notes ?? "";
  if (!notes.startsWith(BANK_NOTE)) return tx.name;
  const rest = notes.slice(BANK_NOTE.length);
  const end = rest.indexOf("; ");
  return end < 0 ? rest : rest.slice(0, end);
}

/** The longest letters-only word (3+ chars) of the bank name, else the whole trimmed name. */
export function suggestMatchText(bankName: string): string {
  let best = "";
  for (const word of bankName.split(/[^\p{L}]+/u)) {
    if (word.length >= 3 && word.length > best.length) best = word;
  }
  return best || bankName.trim();
}

/** The suggested match text in Title Case, e.g. "UNIPOLMOVE" -> "Unipolmove". */
export function suggestRuleName(bankName: string): string {
  return suggestMatchText(bankName)
    .toLowerCase()
    .replace(
      /(^|[^\p{L}])(\p{L})/gu,
      (_, sep: string, ch: string) => sep + ch.toUpperCase(),
    );
}
