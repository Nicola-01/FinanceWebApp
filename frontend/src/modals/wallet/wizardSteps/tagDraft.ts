import type { TagRequest } from "../../../dashboard/settings/csvImport";
import { findRecommendedTagWithParent } from "./recommendedTags";

export const DEFAULT_TAG_ICON = "tag";
export const DEFAULT_TAG_COLOR = "#8b5cf6";

const tagKey = (s: string) => s.trim().toLowerCase();

/**
 * Return `tags` with a tag named `name` appended, recreating its Recommended
 * parent category when the name is a known curated leaf (e.g. "Netflix" →
 * "Subscriptions"): the parent is added first if not already staged, then the
 * child under it, reusing the curated icon/colour. Unknown/custom names get the
 * generic icon and the wallet accent colour.
 *
 * Pure and idempotent: if a tag with that name already exists (case-insensitive)
 * the original array is returned *by reference*, so callers can cheaply skip a
 * redundant state update with `next !== tags`. Shared by the Subscriptions and
 * Transactions wizard steps so "create the missing tag" behaves identically.
 */
export const addTagToDraft = (
  name: string,
  tags: TagRequest[],
  accentColor?: string,
): TagRequest[] => {
  const trimmed = name.trim();
  if (!trimmed) return tags;
  if (tags.some((t) => tagKey(t.name) === tagKey(trimmed))) return tags;

  const recommended = findRecommendedTagWithParent(trimmed);
  const next = [...tags];

  let parentName: string | undefined;
  if (recommended) {
    parentName = recommended.parent.name;
    if (!next.some((t) => tagKey(t.name) === tagKey(parentName!))) {
      next.push({
        name: recommended.parent.name,
        icon: recommended.parent.icon,
        colorHex: recommended.parent.colorHex,
      });
    }
  }

  next.push({
    name: recommended ? recommended.child.name : trimmed,
    icon: recommended ? recommended.child.icon : DEFAULT_TAG_ICON,
    colorHex: recommended
      ? recommended.child.colorHex
      : (accentColor ?? DEFAULT_TAG_COLOR),
    ...(parentName ? { parentName } : {}),
  });

  return next;
};
