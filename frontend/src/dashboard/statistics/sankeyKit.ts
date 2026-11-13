import type { SankeyData } from "@/components/ui/charts";
import type { Transaction } from "../../types/domain";
import type { LinkDef, NodeDef } from "./sankeyData.ts";

const INCOME_TOKEN = "var(--color-app-income)";
const DEFICIT_TOKEN = "var(--color-app-expense-mark)";

/**
 * Converts the id-keyed graph from `buildSankeyData` into the kit's index-keyed
 * `SankeyData`, plus one colour per node (same order as `data.nodes`). Income
 * sources, the central Income node and Savings use the income token; a Deficit
 * node uses the expense mark; category nodes keep their tag colour.
 */
export function toKitSankey(graph: { nodes: NodeDef[]; links: LinkDef[] }): {
  data: SankeyData;
  colors: string[];
} {
  const index = new Map(graph.nodes.map((n, i) => [n.id, i]));
  const colorOf = (n: NodeDef): string => {
    if (n.id === "Deficit") return DEFICIT_TOKEN;
    if (n.id === "Savings" || n.id === "Income" || n.id.startsWith("IN-"))
      return INCOME_TOKEN;
    return n.color;
  };
  const links = graph.links.flatMap((l) => {
    const source = index.get(l.source);
    const target = index.get(l.target);
    if (source === undefined || target === undefined) return [];
    return [{ source, target, value: l.value }];
  });
  return {
    data: { nodes: graph.nodes.map((n) => ({ name: n.label })), links },
    colors: graph.nodes.map(colorOf),
  };
}

/** Total positive income and expenses, counted the way `buildSankeyData` counts them. */
export function cashFlowTotals(transactions: Transaction[]): {
  income: number;
  expenses: number;
} {
  let income = 0;
  let expenses = 0;
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    if (tx.type === "INCOME") income += tx.amount;
    if (tx.type === "EXPENSE") expenses += tx.amount;
  }
  return { income, expenses };
}

/**
 * One-line summary under the chart. `money` formats an amount with its currency.
 * Returns null when there is no income and no overspend to report.
 */
export function cashFlowFooter(
  totals: { income: number; expenses: number },
  money: (value: number) => string,
): string | null {
  const savings = totals.income - totals.expenses;
  if (savings < 0) return `Spent ${money(-savings)} more than earned`;
  if (totals.income <= 0) return null;
  return `Saved ${Math.round((savings / totals.income) * 100)}% of income`;
}
