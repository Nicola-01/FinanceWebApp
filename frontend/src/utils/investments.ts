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
