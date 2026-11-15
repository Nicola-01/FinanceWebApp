import type { BankRule, Tag } from "../../../types/domain";

/** Above this many rules (and with no search) the list groups by category. */
export const GROUP_THRESHOLD = 15;

export const shouldGroup = (total: number, query: string) =>
  total > GROUP_THRESHOLD && query.trim() === "";

/** Case-insensitive match on rule name, bank text and category name. */
export function filterRules(rules: BankRule[], query: string): BankRule[] {
  const q = query.trim().toLowerCase();
  if (!q) return rules;
  return rules.filter((r) =>
    [r.name, r.matchText, r.tag?.name ?? ""].some((s) =>
      s.toLowerCase().includes(q),
    ),
  );
}

/** Groups by category name; rules without a category form a last group (tag null). */
export function groupRules(
  rules: BankRule[],
): { tag: Tag | null; rules: BankRule[] }[] {
  const byName = new Map<string, { tag: Tag; rules: BankRule[] }>();
  const uncategorised: BankRule[] = [];
  for (const r of rules) {
    if (!r.tag) {
      uncategorised.push(r);
      continue;
    }
    const group = byName.get(r.tag.name) ?? { tag: r.tag, rules: [] };
    group.rules.push(r);
    byName.set(r.tag.name, group);
  }
  const groups: { tag: Tag | null; rules: BankRule[] }[] = [
    ...byName.values(),
  ].sort((a, b) => a.tag.name.localeCompare(b.tag.name));
  if (uncategorised.length) groups.push({ tag: null, rules: uncategorised });
  return groups;
}
