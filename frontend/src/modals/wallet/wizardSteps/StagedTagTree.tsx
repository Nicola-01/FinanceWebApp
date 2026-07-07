import { useState, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowTurnUp,
  faChevronRight,
  faMinus,
  faRotateLeft,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../../../components/icon/Icon";
import { Badge } from "../../../components/ui/Badge";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

const keyOf = (s: string) => s.trim().toLowerCase();

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

/** Small provenance pill shown on a category row. */
const OriginBadge = ({ origin }: { origin: TagOrigin }) => (
  <Badge variant="subtle" icon={origin.icon} className="shrink-0">
    {origin.label}
  </Badge>
);

interface TreeGroup {
  parent: StagedTagNode;
  children: StagedTagNode[];
}

/**
 * Group a flat staged list into parent → children, mirroring the wallet's tag
 * tree. Top-level tags (no `parentName`) become category rows; children attach
 * to their parent by name. A child whose parent isn't staged (e.g. an orphan
 * CSV row) falls back to its own top-level row so nothing is hidden.
 */
const buildTree = (value: StagedTagNode[]): TreeGroup[] => {
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

export interface StagedTagTreeProps {
  /** Staged tags (flat); `excluded` nodes render struck-through, kept for undo. */
  value: StagedTagNode[];
  /** Remove a whole category (its parent row and every child) from the draft. */
  onRemoveCategory: (parentName: string) => void;
  /** Strike a single active child (drop it from the active list). */
  onRemoveChild: (child: StagedTagNode) => void;
  /** Restore a struck-out child back into the active list. */
  onRestoreChild: (child: StagedTagNode) => void;
}

/**
 * Read-only echo of {@link CategoryManagerDrawer}'s category tree: expandable
 * parent rows with a coloured icon, a child-count badge and nested sub-rows.
 * Deliberately **not** draggable or reorderable — it only reflects what the
 * user staged. A row expands on click anywhere (not just the chevron); each
 * child can be struck out (× → line-through) and later restored.
 */
export function StagedTagTree({
  value,
  onRemoveCategory,
  onRemoveChild,
  onRestoreChild,
}: StagedTagTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const groups = buildTree(value);

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [keyOf(name)]: !prev[keyOf(name)] }));

  const onRowKeyDown = (name: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(name);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {groups.map((g) => {
        const hasChildren = g.children.length > 0;
        const activeChildren = g.children.filter((c) => !c.excluded).length;
        const isOpen = !!expanded[keyOf(g.parent.name)];
        return (
          <div key={keyOf(g.parent.name)} className="rounded-xl">
            <div className="group/parent flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-app-input">
              {hasChildren ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={
                    isOpen
                      ? `Collapse ${g.parent.name}`
                      : `Expand ${g.parent.name}`
                  }
                  onClick={() => toggle(g.parent.name)}
                  onKeyDown={onRowKeyDown(g.parent.name)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-app-border"
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className={`h-3 w-3 shrink-0 text-app-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-surface text-lg shadow-sm"
                    style={{ color: g.parent.colorHex }}
                  >
                    <Icon icon={g.parent.icon} color={g.parent.colorHex} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-base font-bold text-app-text">
                    {g.parent.name}
                  </span>
                  {g.parent.origin && <OriginBadge origin={g.parent.origin} />}
                  <Badge
                    variant="subtle"
                    mono
                    title={`${activeChildren} sub-categor${activeChildren === 1 ? "y" : "ies"}`}
                    className="shrink-0"
                  >
                    {activeChildren}
                  </Badge>
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2 p-2">
                  <FontAwesomeIcon
                    icon={faMinus}
                    aria-hidden
                    className="h-3 w-3 shrink-0 text-app-muted/40"
                  />
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-surface text-lg shadow-sm"
                    style={{ color: g.parent.colorHex }}
                  >
                    <Icon icon={g.parent.icon} color={g.parent.colorHex} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-base font-bold text-app-text">
                    {g.parent.name}
                  </span>
                  {g.parent.origin && <OriginBadge origin={g.parent.origin} />}
                </div>
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
                    className="group/child flex items-center gap-2 rounded-lg p-2 pl-1 transition-colors hover:bg-app-input"
                  >
                    <FontAwesomeIcon
                      icon={faArrowTurnUp}
                      className="shrink-0 rotate-90 text-xs text-app-muted/30"
                    />
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-app-surface text-xs shadow-sm ${c.excluded ? "opacity-50" : ""}`}
                      style={{ color: c.colorHex }}
                    >
                      <Icon icon={c.icon} color={c.colorHex} />
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm font-medium ${c.excluded ? "text-app-muted line-through" : "text-app-text"}`}
                    >
                      {c.name}
                    </span>
                    {c.excluded ? (
                      <button
                        type="button"
                        aria-label={`Restore ${c.name}`}
                        onClick={() => onRestoreChild(c)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-app-muted opacity-60 transition-all hover:bg-app-input hover:text-app-text group-hover/child:opacity-100"
                      >
                        <FontAwesomeIcon
                          icon={faRotateLeft}
                          className="text-[10px]"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Remove ${c.name}`}
                        onClick={() => onRemoveChild(c)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover/child:opacity-100"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                      </button>
                    )}
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
