// Pure derivations behind TagsStep: category index, tag provenance and the
// staged-tree display nodes.

import {
  faFileCsv,
  faPlus,
  faWallet,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import {
  RECOMMENDED_TAG_GROUPS,
  type RecommendedTagGroup,
} from "./recommendedTags";
import type { SourceWallet } from "./sourceWallets";
import type { StagedTagNode } from "./StagedTagTree";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

export const keyOf = (name: string) => name.trim().toLowerCase();

/** Index categories by parent name; the first occurrence of a name wins. */
export const indexGroupsByParent = (
  groups: RecommendedTagGroup[],
): Map<string, RecommendedTagGroup> => {
  const groupByParentKey = new Map<string, RecommendedTagGroup>();
  groups.forEach((g) => {
    const k = keyOf(g.parent.name);
    if (!groupByParentKey.has(k)) groupByParentKey.set(k, g);
  });
  return groupByParentKey;
};

// Where a staged tag came from — a preset (Recommended), one of the user's
// wallets (its name), a CSV upload, or manual create.
export const originOf = (
  name: string,
  sourceWallets: SourceWallet[],
  originOverrides: Record<string, "csv" | "create">,
): StagedTagNode["origin"] => {
  const k = keyOf(name);
  const matches = (g: RecommendedTagGroup) =>
    keyOf(g.parent.name) === k || g.children.some((c) => keyOf(c.name) === k);
  if (RECOMMENDED_TAG_GROUPS.some(matches))
    return { label: "Recommended", icon: faWandMagicSparkles };
  const w = sourceWallets.find((sw) => sw.groups.some(matches));
  if (w) return { label: w.name, icon: faWallet };
  if (originOverrides[k] === "csv") return { label: "CSV", icon: faFileCsv };
  return { label: "Custom", icon: faPlus };
};

// Staged tree data = active tags plus the struck-out (excluded) children of
// any still-staged category. Children of a known category are emitted in their
// canonical (definition) order so striking one doesn't shuffle it to the end.
// Derived, so `value` stays backend-clean.
export const buildDisplayNodes = (
  value: TagRequest[],
  groupByParentKey: Map<string, RecommendedTagGroup>,
): StagedTagNode[] => {
  const activeByName = new Map(value.map((t) => [keyOf(t.name), t]));
  const displayNodes: StagedTagNode[] = [];
  const emitted = new Set<string>();
  value.forEach((t) => {
    const k = keyOf(t.name);
    if (emitted.has(k)) return;
    const group = groupByParentKey.get(k);
    if (group && keyOf(group.parent.name) === k) {
      displayNodes.push(t);
      emitted.add(k);
      group.children.forEach((c) => {
        const ck = keyOf(c.name);
        displayNodes.push(
          activeByName.get(ck) ?? {
            name: c.name,
            icon: c.icon,
            colorHex: c.colorHex,
            parentName: group.parent.name,
            excluded: true,
          },
        );
        emitted.add(ck);
      });
      return;
    }
    displayNodes.push(t);
    emitted.add(k);
  });
  return displayNodes;
};
