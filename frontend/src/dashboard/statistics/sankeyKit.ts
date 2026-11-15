import type { SankeyData } from "@/components/ui/charts";
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

type Graph = { nodes: NodeDef[]; links: LinkDef[] };
type Side = "expense" | "income";

const OTHER_COLOR = "#8a857c";
const isSub = (id: string) =>
  id.startsWith("IN-SUB-") || id.startsWith("OUT-SUB-");
const byValueDesc = (a: LinkDef, b: LinkDef) => b.value - a.value;
const sumOf = (links: LinkDef[]) => links.reduce((sum, l) => sum + l.value, 0);
const lastIndexOf = <T>(items: T[], pred: (item: T) => boolean) => {
  let at = -1;
  items.forEach((item, i) => {
    if (pred(item)) at = i;
  });
  return at;
};

/**
 * How one side of the central Income node is laid out. `tagOf` returns the tag
 * end of a top-level link (Income->OUT-x or IN-x->Income); `subOf` returns the
 * sub-tag end of a parent's sub link (OUT-x->OUT-SUB-y or IN-SUB-y->IN-x).
 */
const SIDES: Record<
  Side,
  {
    prefix: string;
    subPrefix: string;
    tagOf: (l: LinkDef) => string | null;
    subOf: (l: LinkDef, parent: string) => string | null;
  }
> = {
  expense: {
    prefix: "OUT-",
    subPrefix: "OUT-SUB-",
    tagOf: (l) =>
      l.source === "Income" && l.target.startsWith("OUT-") ? l.target : null,
    subOf: (l, parent) =>
      l.source === parent && l.target.startsWith("OUT-SUB-") ? l.target : null,
  },
  income: {
    prefix: "IN-",
    subPrefix: "IN-SUB-",
    tagOf: (l) =>
      l.target === "Income" && l.source.startsWith("IN-") && !isSub(l.source)
        ? l.source
        : null,
    subOf: (l, parent) =>
      l.target === parent && l.source.startsWith("IN-SUB-") ? l.source : null,
  },
};

/** A link in chart direction: expense flows away from Income, income flows into it. */
const linkBetween = (
  side: Side,
  near: string,
  far: string,
  value: number,
): LinkDef =>
  side === "expense"
    ? { source: near, target: far, value, color: "target" }
    : { source: far, target: near, value, color: "source" };

/** Removes nodes by id and every link touching one of them. */
function dropIds(graph: Graph, ids: Set<string>): Graph {
  return {
    nodes: graph.nodes.filter((n) => !ids.has(n.id)),
    links: graph.links.filter((l) => !ids.has(l.source) && !ids.has(l.target)),
  };
}

/**
 * Keeps the `keep` largest top-level tags on one side and folds the rest into a
 * single "Others" node (their sub-tags go with them). A surplus of one tag is
 * kept as-is, since folding it would not shrink the chart.
 */
function foldTags(graph: Graph, side: Side, keep: number): Graph {
  const { prefix, subPrefix, tagOf } = SIDES[side];
  const tagLinks = graph.links
    .filter((l) => tagOf(l) !== null)
    .sort(byValueDesc);
  if (tagLinks.length <= keep + 1) return graph;

  const folded = tagLinks.slice(keep);
  const foldedTags = new Set(folded.map((l) => tagOf(l)!));
  const dropped = new Set(foldedTags);
  for (const n of graph.nodes) {
    if (n.parentId && foldedTags.has(n.parentId)) dropped.add(n.id);
  }
  const kept = dropIds(graph, dropped);

  const otherId = `${prefix}__other`;
  const nodes = [...kept.nodes];
  const nodeAt = lastIndexOf(
    nodes,
    (n) => n.id.startsWith(prefix) && !n.id.startsWith(subPrefix),
  );
  nodes.splice(nodeAt + 1, 0, {
    id: otherId,
    label: "Others",
    color: OTHER_COLOR,
  });

  const links = [...kept.links];
  const linkAt = lastIndexOf(links, (l) => tagOf(l) !== null);
  links.splice(
    linkAt + 1,
    0,
    linkBetween(side, "Income", otherId, sumOf(folded)),
  );
  return { nodes, links };
}

/**
 * For each kept parent on one side with more than `maxSubs + 1` sub-tags, keeps
 * the `maxSubs` largest and folds the rest into "Others" placed right after the
 * parent's last kept sub-node and sub-link.
 */
function foldSubTags(graph: Graph, side: Side, maxSubs: number): Graph {
  const { prefix, subPrefix, tagOf, subOf } = SIDES[side];
  const parents = graph.nodes
    .filter(
      (n) =>
        n.id.startsWith(prefix) &&
        !n.id.startsWith(subPrefix) &&
        n.id !== `${prefix}__other`,
    )
    .map((n) => n.id);

  return parents.reduce((g, parent) => {
    const subLinks = g.links
      .filter((l) => subOf(l, parent) !== null)
      .sort(byValueDesc);
    if (subLinks.length <= maxSubs + 1) return g;

    const folded = subLinks.slice(maxSubs);
    const kept = dropIds(g, new Set(folded.map((l) => subOf(l, parent)!)));
    const otherId = `${subPrefix}__other-${parent}`;

    const nodes = [...kept.nodes];
    const parentNode = nodes.find((n) => n.id === parent)!;
    const nodeAt = lastIndexOf(nodes, (n) => n.parentId === parent);
    const anchor = nodeAt === -1 ? nodes.indexOf(parentNode) : nodeAt;
    nodes.splice(anchor + 1, 0, {
      id: otherId,
      label: "Others",
      color: parentNode.color,
      parentId: parent,
    });

    const links = [...kept.links];
    const linkAt = lastIndexOf(links, (l) => subOf(l, parent) !== null);
    const topAt = links.findIndex((l) => tagOf(l) === parent);
    links.splice(
      (linkAt === -1 ? topAt : linkAt) + 1,
      0,
      linkBetween(side, parent, otherId, sumOf(folded)),
    );
    return { nodes, links };
  }, graph);
}

/**
 * Phone version of the graph: drops the sub-tag nodes (three columns: sources,
 * Income, expenses) and folds all but the `maxExpenses` largest expense tags
 * into one "Others" node.
 */
export function compactSankeyGraph(
  graph: { nodes: NodeDef[]; links: LinkDef[] },
  maxExpenses = 5,
): { nodes: NodeDef[]; links: LinkDef[] } {
  return foldTags(
    {
      nodes: graph.nodes.filter((n) => !isSub(n.id)),
      links: graph.links.filter((l) => !isSub(l.source) && !isSub(l.target)),
    },
    "expense",
    maxExpenses,
  );
}

/**
 * Desktop version of the graph: on both sides of Income, folds the tags past the
 * `maxExpenses` largest into "Others", and within each kept tag folds the
 * sub-tags past the `maxSubsPerParent` largest. Column totals are unchanged.
 */
export function limitSankeyGraph(
  graph: { nodes: NodeDef[]; links: LinkDef[] },
  {
    maxExpenses = 8,
    maxSubsPerParent = 4,
  }: {
    maxExpenses?: number;
    maxSubsPerParent?: number;
  } = {},
): { nodes: NodeDef[]; links: LinkDef[] } {
  const tagged = foldTags(
    foldTags(graph, "expense", maxExpenses),
    "income",
    maxExpenses,
  );
  return foldSubTags(
    foldSubTags(tagged, "expense", maxSubsPerParent),
    "income",
    maxSubsPerParent,
  );
}
