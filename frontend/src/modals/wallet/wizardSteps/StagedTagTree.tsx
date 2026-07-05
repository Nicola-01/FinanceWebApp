import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTurnUp,
  faChevronRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../../../components/icon/Icon";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

const keyOf = (s: string) => s.trim().toLowerCase();

interface TreeGroup {
  parent: TagRequest;
  children: TagRequest[];
}

/**
 * Group a flat staged list into parent → children, mirroring the wallet's tag
 * tree. Top-level tags (no `parentName`) become category rows; children attach
 * to their parent by name. A child whose parent isn't staged (e.g. an orphan
 * CSV row) falls back to its own top-level row so nothing is hidden.
 */
const buildTree = (value: TagRequest[]): TreeGroup[] => {
  const parents = value.filter((t) => !t.parentName?.trim());
  const parentKeys = new Set(parents.map((p) => keyOf(p.name)));
  const childrenByParent = new Map<string, TagRequest[]>();
  const orphans: TagRequest[] = [];

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
    ...orphans.map((o) => ({ parent: o, children: [] as TagRequest[] })),
  ];
};

export interface StagedTagTreeProps {
  /** Staged tags (flat). Rendered grouped into a read-only category tree. */
  value: TagRequest[];
  /** Remove a whole category (its parent row and every child) from the draft. */
  onRemoveCategory: (parentName: string) => void;
}

/**
 * Read-only echo of {@link CategoryManagerDrawer}'s category tree: expandable
 * parent rows with a coloured icon, a child-count badge and nested sub-rows.
 * Deliberately **not** draggable or reorderable — it only reflects what the
 * user staged, with a per-category remove control.
 */
export function StagedTagTree({ value, onRemoveCategory }: StagedTagTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const groups = buildTree(value);

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [keyOf(name)]: !prev[keyOf(name)] }));

  return (
    <div className="flex flex-col gap-1">
      {groups.map((g) => {
        const hasChildren = g.children.length > 0;
        const isOpen = !!expanded[keyOf(g.parent.name)];
        return (
          <div key={keyOf(g.parent.name)} className="rounded-xl">
            <div className="group/parent flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-app-input">
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={
                    isOpen
                      ? `Collapse ${g.parent.name}`
                      : `Expand ${g.parent.name}`
                  }
                  aria-expanded={isOpen}
                  onClick={() => toggle(g.parent.name)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-surface"
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className={`text-xs transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>
              ) : (
                <span className="h-6 w-6 shrink-0" aria-hidden />
              )}

              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-surface text-lg shadow-sm"
                style={{ color: g.parent.colorHex }}
              >
                <Icon icon={g.parent.icon} color={g.parent.colorHex} />
              </span>

              <span className="min-w-0 flex-1 truncate text-base font-bold text-app-text">
                {g.parent.name}
              </span>

              {hasChildren && (
                <span
                  title={`${g.children.length} sub-categor${g.children.length === 1 ? "y" : "ies"}`}
                  className="shrink-0 rounded-full bg-app-input px-2 py-0.5 font-app-mono text-[11px] font-bold tabular-nums text-app-muted"
                >
                  {g.children.length}
                </span>
              )}

              <button
                type="button"
                aria-label={`Remove ${g.parent.name}`}
                onClick={() => onRemoveCategory(g.parent.name)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover/parent:opacity-100"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </div>

            {isOpen && hasChildren && (
              <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-app-border pb-1 pl-2">
                {g.children.map((c) => (
                  <div
                    key={keyOf(c.name)}
                    className="flex items-center gap-2 rounded-lg p-2 pl-1"
                  >
                    <FontAwesomeIcon
                      icon={faArrowTurnUp}
                      className="shrink-0 rotate-90 text-xs text-app-muted/30"
                    />
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-app-surface text-xs shadow-sm"
                      style={{ color: c.colorHex }}
                    >
                      <Icon icon={c.icon} color={c.colorHex} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-text">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StagedTagTree;
