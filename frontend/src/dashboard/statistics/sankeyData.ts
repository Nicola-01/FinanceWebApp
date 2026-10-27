import type { Transaction } from "../../types/domain";

const SAVINGS_COLOR = "url(#savingsPattern)";
const DEFICIT_COLOR = "url(#deficitPattern)";

export type NodeDef = {
  id: string;
  label: string;
  color: string;
  parentId?: string;
};
export type LinkDef = {
  source: string;
  target: string;
  value: number;
  color?: string;
};

/**
 * Builds the cash-flow Sankey graph: income sub-tags -> income tags -> the
 * central "Income" node -> expense tags -> expense sub-tags, plus a Savings
 * (or Deficit) node balancing the two sides. Nodes are sorted largest-first
 * and links ordered to avoid crossings. Returns null when no transaction has
 * a positive INCOME/EXPENSE amount.
 */
export function buildSankeyData(
  transactions: Transaction[],
  incomeColor: string,
): { nodes: NodeDef[]; links: LinkDef[] } | null {
  const incomeSubNodes = new Map<string, NodeDef>();
  const incomeNodes = new Map<string, NodeDef>();
  const expenseNodes = new Map<string, NodeDef>();
  const expenseSubNodes = new Map<string, NodeDef>();
  const linksMap = new Map<string, LinkDef>();
  const nodeTotals = new Map<string, number>();

  let totalIncome = 0;
  let totalExpenses = 0;
  let hasData = false;

  const addToNodeTotal = (id: string, amount: number) => {
    nodeTotals.set(id, (nodeTotals.get(id) || 0) + amount);
  };

  transactions.forEach((tx) => {
    if (tx.amount <= 0) return;
    const isIncome = tx.type === "INCOME";
    const isExpense = tx.type === "EXPENSE";
    if (!isIncome && !isExpense) return;
    hasData = true;

    if (isIncome) totalIncome += tx.amount;
    if (isExpense) totalExpenses += tx.amount;

    const mainName = tx.tag.parentName || tx.tag.name;
    const subName = tx.tag.parentName ? tx.tag.name : null;
    const nodeColor = tx.tag.colorHex || "#595b63";

    const mainId = isIncome ? `IN-${mainName}` : `OUT-${mainName}`;
    const subId = subName
      ? isIncome
        ? `IN-SUB-${subName}`
        : `OUT-SUB-${subName}`
      : null;

    if (isIncome) {
      if (!incomeNodes.has(mainId))
        incomeNodes.set(mainId, {
          id: mainId,
          label: mainName,
          color: nodeColor,
        });
      if (subName && subId && !incomeSubNodes.has(subId))
        incomeSubNodes.set(subId, {
          id: subId,
          label: subName,
          color: nodeColor,
          parentId: mainId,
        });
    } else {
      if (!expenseNodes.has(mainId))
        expenseNodes.set(mainId, {
          id: mainId,
          label: mainName,
          color: nodeColor,
        });
      if (subName && subId && !expenseSubNodes.has(subId))
        expenseSubNodes.set(subId, {
          id: subId,
          label: subName,
          color: nodeColor,
          parentId: mainId,
        });
    }

    addToNodeTotal(mainId, tx.amount);
    if (subId) addToNodeTotal(subId, tx.amount);

    const addLink = (source: string, target: string, amount: number) => {
      const key = `${source}->${target}`;
      const ex = linksMap.get(key);
      linksMap.set(key, { source, target, value: (ex?.value ?? 0) + amount });
    };

    if (isIncome) {
      if (subName && subId) addLink(subId, mainId, tx.amount);
      addLink(mainId, "Income", tx.amount);
    } else {
      addLink("Income", mainId, tx.amount);
      if (subName && subId) addLink(mainId, subId, tx.amount);
    }
  });

  if (!hasData) return null;

  const savings = totalIncome - totalExpenses;
  if (savings > 0) addToNodeTotal("Savings", savings);

  // --- Sort nodes largest to smallest ---
  const sortByTotalDesc = (a: NodeDef, b: NodeDef) =>
    (nodeTotals.get(b.id) || 0) - (nodeTotals.get(a.id) || 0);

  const sortSubNodes = (a: NodeDef, b: NodeDef) => {
    const parentTotalA = a.parentId ? nodeTotals.get(a.parentId) || 0 : 0;
    const parentTotalB = b.parentId ? nodeTotals.get(b.parentId) || 0 : 0;
    if (parentTotalA !== parentTotalB) return parentTotalB - parentTotalA;
    return (nodeTotals.get(b.id) || 0) - (nodeTotals.get(a.id) || 0);
  };

  const nodesArray: NodeDef[] = [
    ...Array.from(incomeSubNodes.values()).sort(sortSubNodes),
    ...Array.from(incomeNodes.values()).sort(sortByTotalDesc),
    {
      id: "Income",
      label: "Income",
      color: incomeColor,
    },
    ...Array.from(expenseNodes.values()).sort(sortByTotalDesc),
    ...Array.from(expenseSubNodes.values()).sort(sortSubNodes),
    ...(savings > 0
      ? [{ id: "Savings", label: "Savings", color: SAVINGS_COLOR }]
      : [
          {
            id: "Deficit",
            label: "Deficit",
            color: DEFICIT_COLOR,
          },
        ]),
  ];

  const nodeIndexMap = new Map(nodesArray.map((n, i) => [n.id, i]));

  if (savings > 0) {
    linksMap.set("Income->Savings", {
      source: "Income",
      target: "Savings",
      value: savings,
    });
  } else {
    linksMap.set("Deficit->Income", {
      source: "Deficit",
      target: "Income",
      value: -savings,
    });
  }

  // --- Sort links to avoid crossings ---
  const linksArray: LinkDef[] = Array.from(linksMap.values())
    .map((link) => {
      const rightSide =
        link.source === "Income" || link.source.startsWith("OUT-");
      return { ...link, color: rightSide ? "target" : "source" };
    })
    .sort((a, b) => {
      const sourceA = nodeIndexMap.get(a.source) ?? 0;
      const sourceB = nodeIndexMap.get(b.source) ?? 0;
      const targetA = nodeIndexMap.get(a.target) ?? 0;
      const targetB = nodeIndexMap.get(b.target) ?? 0;

      if (a.source === b.source) return targetA - targetB;
      if (a.target === b.target) return sourceA - sourceB;
      return sourceA - sourceB || targetA - targetB;
    });

  return { nodes: nodesArray, links: linksArray };
}
