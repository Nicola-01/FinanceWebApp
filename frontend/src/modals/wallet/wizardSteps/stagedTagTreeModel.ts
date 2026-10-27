// Pure grouping behind StagedTagTree: flat staged tags -> parent/children rows.

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { TagRequest } from "../../../dashboard/settings/csvImport";
import { keyOf } from "./tagsStepModel";

/** Where a staged tag came from (this screen only) — shown as a small badge. */
export interface TagOrigin {
  label: string;
  icon: IconDefinition;
}

/** A staged tag, optionally marked `excluded` (struck out, kept only for display). */
export interface StagedTagNode extends TagRequest {
  excluded?: boolean;
  /** Provenance badge (Recommended / a wallet name / CSV / Custom). */
  origin?: TagOrigin;
}

export interface TreeGroup {
  parent: StagedTagNode;
  children: StagedTagNode[];
}

/**
 * Group a flat staged list into parent → children, mirroring the wallet's tag
 * tree. Top-level tags (no `parentName`) become category rows; children attach
 * to their parent by name. A child whose parent isn't staged (e.g. an orphan
 * CSV row) falls back to its own top-level row so nothing is hidden.
 */
export const buildTree = (value: StagedTagNode[]): TreeGroup[] => {
  const parents = value.filter((t) => !t.parentName?.trim());
  const parentKeys = new Set(parents.map((p) => keyOf(p.name)));
  const childrenByParent = new Map<string, StagedTagNode[]>();
  const orphans: StagedTagNode[] = [];

  value.forEach((t) => {
    const pn = t.parentName?.trim();
    if (!pn) return;
    if (parentKeys.has(keyOf(pn))) {
      const k = keyOf(pn);
      childrenByParent.set(k, [...(childrenByParent.get(k) ?? []), t]);
    } else {
      orphans.push(t);
    }
  });

  return [
    ...parents.map((p) => ({
      parent: p,
      children: childrenByParent.get(keyOf(p.name)) ?? [],
    })),
    ...orphans.map((o) => ({ parent: o, children: [] as StagedTagNode[] })),
  ];
};
