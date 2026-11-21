import { useState, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  faArrowTurnUp,
  faChevronRight,
  faMinus,
  faRotateLeft,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../../../components/icon/Icon";
import { Badge } from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { useUiVersion } from "../../../hooks/useUiVersion";
import { keyOf } from "./tagsStepModel";
import {
  buildTree,
  type StagedTagNode,
  type TagOrigin,
} from "./stagedTagTreeModel";

export type { StagedTagNode, TagOrigin } from "./stagedTagTreeModel";

/** Small provenance pill shown on a category row. */
const OriginBadge = ({ origin }: { origin: TagOrigin }) => (
  <Badge variant="subtle" icon={origin.icon} className="shrink-0">
    {origin.label}
  </Badge>
);

/** Icon-only remove/restore control: the v1 hand-rolled button, or the shared `Button` in v2. */
const IconAction = ({
  v2,
  label,
  icon,
  iconClassName,
  v1ClassName,
  v2ClassName,
  onClick,
}: {
  v2: boolean;
  label: string;
  icon: IconDefinition;
  iconClassName: string;
  v1ClassName: string;
  v2ClassName: string;
  onClick: () => void;
}) =>
  v2 ? ( // ui-v2-switch
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={v2ClassName}
    >
      <FontAwesomeIcon icon={icon} className={iconClassName} />
    </Button>
  ) : (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={v1ClassName}
    >
      <FontAwesomeIcon icon={icon} className={iconClassName} />
    </button>
  );

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
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [keyOf(name)]: !prev[keyOf(name)] }));

  const onRowKeyDown = (name: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(name);
    }
  };

  return (
    <div
      className={
        v2
          ? "divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]"
          : "flex flex-col gap-1"
      }
    >
      {groups.map((g) => {
        const hasChildren = g.children.length > 0;
        const activeChildren = g.children.filter((c) => !c.excluded).length;
        const isOpen = !!expanded[keyOf(g.parent.name)];
        return (
          <div key={keyOf(g.parent.name)} className={v2 ? "" : "rounded-xl"}>
            <div
              className={
                v2
                  ? "group/parent flex items-center gap-1 pr-3 transition-colors hover:bg-app-raised"
                  : "group/parent flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-app-input"
              }
            >
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
                  className={
                    v2
                      ? "flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2.5 pl-4 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-app-border"
                      : "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-app-border"
                  }
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className={`h-3 w-3 shrink-0 text-app-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                  <span
                    className={
                      v2
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-lg"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-surface text-lg shadow-sm"
                    }
                    style={{
                      color: g.parent.colorHex,
                      backgroundColor: v2
                        ? `color-mix(in srgb, ${g.parent.colorHex} 18%, transparent)`
                        : undefined,
                    }}
                  >
                    <Icon icon={g.parent.icon} color={g.parent.colorHex} />
                  </span>
                  <span
                    className={
                      v2
                        ? "min-w-0 flex-1 truncate text-[15px] text-app-text"
                        : "min-w-0 flex-1 truncate text-base font-bold text-app-text"
                    }
                  >
                    {g.parent.name}
                  </span>
                  {g.parent.origin && <OriginBadge origin={g.parent.origin} />}
                  <Badge
                    variant="subtle"
                    mono={!v2}
                    title={`${activeChildren} sub-categor${activeChildren === 1 ? "y" : "ies"}`}
                    className={v2 ? "shrink-0 tabular-nums" : "shrink-0"}
                  >
                    {activeChildren}
                  </Badge>
                </div>
              ) : (
                <div
                  className={
                    v2
                      ? "flex min-w-0 flex-1 items-center gap-2 py-2.5 pl-4 pr-1"
                      : "flex min-w-0 flex-1 items-center gap-2 p-2"
                  }
                >
                  <FontAwesomeIcon
                    icon={faMinus}
                    aria-hidden
                    className="h-3 w-3 shrink-0 text-app-muted/40"
                  />
                  <span
                    className={
                      v2
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-lg"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-surface text-lg shadow-sm"
                    }
                    style={{
                      color: g.parent.colorHex,
                      backgroundColor: v2
                        ? `color-mix(in srgb, ${g.parent.colorHex} 18%, transparent)`
                        : undefined,
                    }}
                  >
                    <Icon icon={g.parent.icon} color={g.parent.colorHex} />
                  </span>
                  <span
                    className={
                      v2
                        ? "min-w-0 flex-1 truncate text-[15px] text-app-text"
                        : "min-w-0 flex-1 truncate text-base font-bold text-app-text"
                    }
                  >
                    {g.parent.name}
                  </span>
                  {g.parent.origin && <OriginBadge origin={g.parent.origin} />}
                </div>
              )}

              <IconAction
                v2={v2}
                label={`Remove ${g.parent.name}`}
                icon={faXmark}
                iconClassName="text-xs"
                v1ClassName="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover/parent:opacity-100"
                v2ClassName="shrink-0 text-app-muted opacity-40 transition-all hover:text-app-danger group-hover/parent:opacity-100"
                onClick={() => onRemoveCategory(g.parent.name)}
              />
            </div>

            {isOpen && hasChildren && (
              <div
                className={
                  v2
                    ? "flex flex-col pb-1"
                    : "ml-5 mt-1 flex flex-col gap-1 border-l border-app-border pb-1 pl-2"
                }
              >
                {g.children.map((c) => (
                  <div
                    key={keyOf(c.name)}
                    className={
                      v2
                        ? "group/child flex items-center gap-2.5 py-2 pl-14 pr-4 transition-colors hover:bg-app-raised"
                        : "group/child flex items-center gap-2 rounded-lg p-2 pl-1 transition-colors hover:bg-app-input"
                    }
                  >
                    {!v2 && (
                      <FontAwesomeIcon
                        icon={faArrowTurnUp}
                        className="shrink-0 rotate-90 text-xs text-app-muted/30"
                      />
                    )}
                    <span
                      className={
                        v2
                          ? `flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-app-raised text-xs text-app-muted ${c.excluded ? "opacity-50" : ""}`
                          : `flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-app-surface text-xs shadow-sm ${c.excluded ? "opacity-50" : ""}`
                      }
                      style={v2 ? undefined : { color: c.colorHex }}
                    >
                      <Icon icon={c.icon} color={v2 ? undefined : c.colorHex} />
                    </span>
                    <span
                      className={
                        v2
                          ? `min-w-0 flex-1 truncate text-[15px] ${c.excluded ? "text-app-muted line-through" : "text-app-text"}`
                          : `min-w-0 flex-1 truncate text-sm font-medium ${c.excluded ? "text-app-muted line-through" : "text-app-text"}`
                      }
                    >
                      {c.name}
                    </span>
                    {c.excluded ? (
                      <IconAction
                        v2={v2}
                        label={`Restore ${c.name}`}
                        icon={faRotateLeft}
                        iconClassName="text-[10px]"
                        v1ClassName="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-app-muted opacity-60 transition-all hover:bg-app-input hover:text-app-text group-hover/child:opacity-100"
                        v2ClassName="shrink-0 text-app-muted opacity-60 transition-all hover:text-app-text group-hover/child:opacity-100"
                        onClick={() => onRestoreChild(c)}
                      />
                    ) : (
                      <IconAction
                        v2={v2}
                        label={`Remove ${c.name}`}
                        icon={faXmark}
                        iconClassName="text-xs"
                        v1ClassName="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover/child:opacity-100"
                        v2ClassName="shrink-0 text-app-muted opacity-40 transition-all hover:text-app-danger group-hover/child:opacity-100"
                        onClick={() => onRemoveChild(c)}
                      />
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
