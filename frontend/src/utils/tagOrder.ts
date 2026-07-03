import type { Tag } from "./types";

/**
 * Client-side ordering for the category tree, mirroring the `wallet_order`
 * pattern used by the wallets sidebar. The backend does not model tag order,
 * so the manager persists it locally, per wallet, keyed by tag **name**
 * (Tag.id is optional; names are unique per wallet and what the API keys on).
 *
 * Nothing here talks to the backend. Reparenting (moving a child under a
 * different parent) is a separate concern handled via the existing
 * `updateTag` API by the caller; this module only records order.
 */

export interface TagOrderStore {
  /** Root (parent) tag names, in display order. */
  roots: string[];
  /** Child tag names, in display order, keyed by their parent's name. */
  children: Record<string, string[]>;
}

/** A parent category with its (ordered) children — the shape the tree renders. */
export interface TagTreeNode {
  parent: Tag;
  children: Tag[];
}

const keyFor = (walletId: string) => `tag_order_${walletId}`;

function readStore(walletId: string): TagOrderStore {
  try {
    const raw = localStorage.getItem(keyFor(walletId));
    if (!raw) return { roots: [], children: {} };
    const parsed = JSON.parse(raw) as Partial<TagOrderStore>;
    return {
      roots: Array.isArray(parsed.roots) ? parsed.roots : [],
      children:
        parsed.children && typeof parsed.children === "object"
          ? (parsed.children as Record<string, string[]>)
          : {},
    };
  } catch (e) {
    console.error("Error parsing tag order from localStorage", e);
    return { roots: [], children: {} };
  }
}

/** Stable sort of named items by a saved order array; unknown names go last. */
function orderByNames<T extends { name: string }>(
  items: T[],
  order: string[],
): T[] {
  return [...items].sort((a, b) => {
    const ia = order.indexOf(a.name);
    const ib = order.indexOf(b.name);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Split a flat tag list into roots + children-by-parent, keeping orphans visible. */
function groupTags(tags: Tag[]): {
  roots: Tag[];
  childrenByParent: Record<string, Tag[]>;
} {
  const rootNames = new Set(
    tags.filter((t) => !t.parentName).map((t) => t.name),
  );
  const roots: Tag[] = [];
  const childrenByParent: Record<string, Tag[]> = {};

  tags.forEach((t) => {
    // A tag whose parent no longer exists is promoted to a root so it never
    // disappears from the manager.
    if (!t.parentName || !rootNames.has(t.parentName)) {
      roots.push(t);
    } else {
      (childrenByParent[t.parentName] ??= []).push(t);
    }
  });

  return { roots, childrenByParent };
}

/**
 * Build the ordered category tree from a flat tag list + the saved order.
 * Pure: it never writes. Call `persistTree` to self-heal / save.
 */
export function applyTagOrder(walletId: string, tags: Tag[]): TagTreeNode[] {
  const store = readStore(walletId);
  const { roots, childrenByParent } = groupTags(tags);

  const orderedRoots = orderByNames(roots, store.roots);
  return orderedRoots.map((parent) => ({
    parent,
    children: orderByNames(
      childrenByParent[parent.name] ?? [],
      store.children[parent.name] ?? [],
    ),
  }));
}

/**
 * Persist the current tree's order to localStorage. Writing straight from the
 * rendered tree naturally self-heals the store: deleted tags drop out, new
 * ones are appended in their current position.
 */
export function persistTree(walletId: string, nodes: TagTreeNode[]): void {
  const store: TagOrderStore = {
    roots: nodes.map((n) => n.parent.name),
    children: {},
  };
  nodes.forEach((n) => {
    store.children[n.parent.name] = n.children.map((c) => c.name);
  });
  try {
    localStorage.setItem(keyFor(walletId), JSON.stringify(store));
  } catch (e) {
    console.error("Error writing tag order to localStorage", e);
  }
}

/* ------------------------------------------------------------------ *
 *  Sort mode: how the category tree is ordered.
 *  - custom : the user's manual drag order (persisted per wallet above)
 *  - usage  : by transaction frequency (parents by their subtree total)
 *  - name   : alphabetical
 *  The chosen mode is persisted per wallet and shared with the TagPicker.
 * ------------------------------------------------------------------ */

export type TagSortMode = "custom" | "usage" | "name";

const sortKeyFor = (walletId: string) => `tag_sort_${walletId}`;

export function readSortMode(walletId: string): TagSortMode {
  try {
    const raw = localStorage.getItem(sortKeyFor(walletId));
    return raw === "usage" || raw === "name" ? raw : "custom";
  } catch {
    return "custom";
  }
}

export function writeSortMode(walletId: string, mode: TagSortMode): void {
  try {
    localStorage.setItem(sortKeyFor(walletId), mode);
  } catch (e) {
    console.error("Error writing tag sort mode to localStorage", e);
  }
}

/** Count how many transactions reference each tag, keyed by tag name. */
export function countTagUsage(
  transactions: { tag?: Tag | null }[] | null | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of transactions ?? []) {
    const name = t?.tag?.name;
    if (name) counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

const byNameAsc = (a: Tag, b: Tag) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/**
 * Reorder an existing tree by the chosen mode. `custom` returns it untouched
 * (drag order wins). `name` is alphabetical; `usage` is by frequency — parents
 * by the sum of their own + children's occurrences, children by their own,
 * ties broken alphabetically.
 */
export function sortTree(
  nodes: TagTreeNode[],
  mode: TagSortMode,
  counts: Record<string, number> = {},
): TagTreeNode[] {
  if (mode === "custom") return nodes;

  if (mode === "name") {
    return [...nodes]
      .sort((a, b) => byNameAsc(a.parent, b.parent))
      .map((n) => ({ ...n, children: [...n.children].sort(byNameAsc) }));
  }

  // usage
  const freq = (name: string) => counts[name] ?? 0;
  const subtotal = (n: TagTreeNode) =>
    freq(n.parent.name) + n.children.reduce((s, c) => s + freq(c.name), 0);

  return [...nodes]
    .map((n) => ({
      ...n,
      children: [...n.children].sort(
        (a, b) => freq(b.name) - freq(a.name) || byNameAsc(a, b),
      ),
    }))
    .sort((a, b) => subtotal(b) - subtotal(a) || byNameAsc(a.parent, b.parent));
}

/** Flatten a tree into an ordered flat list: `[parent, ...children]` per group. */
export function flattenTree(nodes: TagTreeNode[]): Tag[] {
  const out: Tag[] = [];
  for (const n of nodes) {
    out.push(n.parent, ...n.children);
  }
  return out;
}

/**
 * Ordered flat tag list for a wallet under the given mode — the single source
 * of truth for display order shared by the manager drawer and the TagPicker.
 */
export function orderTags(
  walletId: string,
  tags: Tag[],
  mode: TagSortMode,
  counts: Record<string, number> = {},
): Tag[] {
  return flattenTree(sortTree(applyTagOrder(walletId, tags), mode, counts));
}
