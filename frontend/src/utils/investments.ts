import type { Tag, Transaction } from "../types/domain";

/** Investment money flows: expenses on investment tags are "bought", income on them "cashed out". */
export interface Flows {
  income: number;
  spent: number;
  bought: number;
  cashedOut: number;
  investedNet: number;
  net: number;
  liquidityLeft: number;
}

/**
 * Names of the tags that are investments: a flagged tag, or any tag whose parent
 * chain reaches a flagged one. The walk stops on a repeated name so corrupt
 * (cyclic) parent chains terminate.
 */
export function investmentTagNames(tags: Tag[]): Set<string> {
  const byName = new Map(tags.map((t) => [t.name, t]));
  const names = new Set<string>();
  for (const tag of tags) {
    const seen = new Set<string>();
    let cur: Tag | undefined = tag;
    while (cur && !seen.has(cur.name)) {
      if (cur.investment) {
        names.add(tag.name);
        break;
      }
      seen.add(cur.name);
      cur = cur.parentName ? byName.get(cur.parentName) : undefined;
    }
  }
  return names;
}

/** Whether a transaction is filed under an investment tag (untagged ones never are). */
export const isInvestmentTx = (tx: Transaction, invest: Set<string>): boolean =>
  invest.has(tx.tag?.name ?? "");

/** Sums the income/spent and bought/cashed-out flows of `txs`, with the derived nets. */
export function sumFlows(txs: Transaction[], invest: Set<string>): Flows {
  const flows = { income: 0, spent: 0, bought: 0, cashedOut: 0 };
  for (const tx of txs) {
    const isInvest = isInvestmentTx(tx, invest);
    if (tx.type === "INCOME") {
      if (isInvest) flows.cashedOut += tx.amount;
      else flows.income += tx.amount;
    } else if (isInvest) {
      flows.bought += tx.amount;
    } else {
      flows.spent += tx.amount;
    }
  }
  const investedNet = flows.bought - flows.cashedOut;
  const net = flows.income - flows.spent;
  return { ...flows, investedNet, net, liquidityLeft: net - investedNet };
}

/** Investment coverage of one tag, derived from the parentName links. */
export interface InvestmentCoverage {
  /** Nearest flagged ancestor: it covers the whole subtree and cannot be opted out of. */
  inheritedFrom?: string;
  /** At least one descendant is flagged. */
  partial: boolean;
}

/** How a category's investment toggle should look: own flag, covered by an ancestor, some descendants flagged, or none. */
export type InvestmentState = "own" | "inherited" | "partial" | "off";

/** Coverage per tag name. Walks parent chains with a cycle guard, like `investmentTagNames`. */
export function investmentCoverage(
  tags: Tag[],
): Map<string, InvestmentCoverage> {
  const byName = new Map(tags.map((t) => [t.name, t]));
  const inheritedFrom = new Map<string, string>();
  const partial = new Set<string>();
  for (const tag of tags) {
    const ancestors: Tag[] = [];
    const seen = new Set<string>([tag.name]);
    let cur = tag.parentName ? byName.get(tag.parentName) : undefined;
    while (cur && !seen.has(cur.name)) {
      ancestors.push(cur);
      seen.add(cur.name);
      cur = cur.parentName ? byName.get(cur.parentName) : undefined;
    }
    const cover = ancestors.find((a) => a.investment);
    if (cover) inheritedFrom.set(tag.name, cover.name);
    if (tag.investment) ancestors.forEach((a) => partial.add(a.name));
  }
  return new Map(
    tags.map((t) => [
      t.name,
      {
        inheritedFrom: inheritedFrom.get(t.name),
        partial: partial.has(t.name),
      },
    ]),
  );
}

/** Toggle state for one category: an ancestor's flag wins, then its own flag, then descendants. */
export function investmentState(
  own: boolean,
  coverage?: InvestmentCoverage,
): InvestmentState {
  if (coverage?.inheritedFrom) return "inherited";
  if (own) return "own";
  if (coverage?.partial) return "partial";
  return "off";
}
