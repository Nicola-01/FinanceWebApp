import type { Transaction } from "../../utils/types.ts";

/** Neutral grey used for the bucketed "Other" remainder across the category charts. */
export const OTHER_COLOR = "#9ca3af";

/** The MAIN (parent) category name for a transaction, or the tag itself if it has no parent. */
export function mainCategoryName(tx: Transaction): string {
  return tx.tag.parentName || tx.tag.name;
}

export interface CategoryMeta {
  color: string;
  icon: string;
}

/**
 * Builds a representative colour + icon per MAIN category from the given transactions. Prefers the
 * parent's own values (`tag.parent`, or a transaction whose tag IS the main category); falls back
 * to the first child seen. Shared by the ranking / trend / heatmap category charts.
 */
export function buildMainCategoryMeta(
  txs: Transaction[],
): Map<string, CategoryMeta> {
  type Agg = CategoryMeta & { definitive: boolean };
  const map = new Map<string, Agg>();

  txs.forEach((tx) => {
    const main = mainCategoryName(tx);
    const isChild = !!tx.tag.parentName;
    const color = isChild
      ? (tx.tag.parent?.colorHex ?? tx.tag.colorHex)
      : tx.tag.colorHex;
    const icon = isChild ? (tx.tag.parent?.icon ?? tx.tag.icon) : tx.tag.icon;
    // "definitive" = these are the parent's own values (or the tag IS the main category).
    const definitive = !isChild || !!tx.tag.parent;

    const cur = map.get(main);
    if (!cur) {
      map.set(main, { color, icon, definitive });
    } else if (!cur.definitive && definitive) {
      cur.color = color;
      cur.icon = icon;
      cur.definitive = true;
    }
  });

  return map;
}
