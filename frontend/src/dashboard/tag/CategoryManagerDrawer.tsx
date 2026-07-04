import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownAZ,
  faFire,
  faGripVertical,
  faLayerGroup,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Tag } from "../../utils/types.ts";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { Selector } from "../../components/ui/Selector.tsx";
import { Icon } from "../../components/icon/Icon.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useDeleteModal } from "../../modals/common/DeleteModalContext.tsx";
import { TagSelectorAddForm } from "../../components/TagSelector/TagSelectorAddForm.tsx";
import { CategoryParentRow } from "./CategoryParentRow.tsx";
import { CategoryChildRow } from "./CategoryChildRow.tsx";
import {
  applyTagOrder,
  countTagUsage,
  persistTree,
  readSortMode,
  sortTree,
  writeSortMode,
  type TagSortMode,
  type TagTreeNode,
} from "../../utils/tagOrder.ts";

const CONTAINER_PREFIX = "container:";

interface CategoryManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  /**
   * When the drawer opens, pre-expand this main category's row (e.g. the
   * TagPicker deep-links here with the category the user was drilled into).
   */
  initialExpandedParent?: string | null;
}

/**
 * Prefer the most specific droppable under the pointer. Our parent blocks are big
 * droppables that fully contain their child rows and drop zones; plain
 * `closestCenter` over all droppables would let a tall block win over the small
 * row the pointer is actually on. So: restrict `closestCenter` to the droppables
 * the pointer is within, falling back to the global result when it's outside all.
 */
const nestedCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    const hitIds = new Set(pointerHits.map((h) => h.id));
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        hitIds.has(c.id),
      ),
    });
  }
  return closestCenter(args);
};

/** A drop target for reparenting a child into an empty (childless) parent. */
const ChildDropZone: React.FC<{ parentName: string; color: string }> = ({
  parentName,
  color,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${CONTAINER_PREFIX}${parentName}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed px-3 py-2 text-xs italic transition-colors ${
        isOver ? "" : "border-app-border text-app-muted/60"
      }`}
      style={
        isOver
          ? { borderColor: color, backgroundColor: `${color}14`, color }
          : undefined
      }
    >
      Drop a sub-category here
    </div>
  );
};

/**
 * Dashed "add" affordance whose hover accent is the wallet's colour. The colour
 * is dynamic (per wallet), so the hover state is tracked in JS and applied via
 * inline styles rather than static Tailwind hover classes.
 */
const AddCategoryButton: React.FC<{
  accentColor: string;
  label: string;
  onClick: () => void;
  variant?: "main" | "sub";
}> = ({ accentColor, label, onClick, variant = "main" }) => {
  const [hover, setHover] = useState(false);

  if (variant === "sub") {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="flex items-center gap-2 self-start rounded-lg border border-dashed border-app-border/60 px-2.5 py-1.5 text-xs font-semibold text-app-muted transition-colors"
        style={
          hover
            ? {
                borderColor: accentColor,
                backgroundColor: `${accentColor}14`,
                color: accentColor,
              }
            : undefined
        }
      >
        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-app-border/70 bg-transparent px-3 py-2.5 text-app-muted transition-colors"
      style={
        hover
          ? {
              borderColor: accentColor,
              backgroundColor: `${accentColor}14`,
              color: "var(--color-app-text)",
            }
          : undefined
      }
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-input text-app-muted transition-colors"
        style={
          hover
            ? { backgroundColor: `${accentColor}26`, color: accentColor }
            : undefined
        }
      >
        <FontAwesomeIcon icon={faPlus} className="text-sm" />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};

/**
 * Slide-over manager for the wallet's category tree (2 levels): create, rename,
 * recolor, delete, and drag to reorder / reparent. Order is persisted
 * client-side (see utils/tagOrder); reparenting uses the existing updateTag API.
 * The charts on the Categories tab are untouched.
 */
export const CategoryManagerDrawer: React.FC<CategoryManagerDrawerProps> = ({
  open,
  onClose,
  initialExpandedParent = null,
}) => {
  const { wallet, tags, transactions, handleUpdateTag, handleDeleteTag } =
    useWalletContext();
  const deleteModalRef = useDeleteModal();
  const readOnly = wallet.userRole === "VIEWER";

  const [tree, setTree] = useState<TagTreeNode[]>(() =>
    applyTagOrder(wallet.id, tags),
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Sort mode drives the display order in both this drawer and the TagPicker.
  // `tree` always holds the *custom* (drag) order; other modes are derived from
  // it for display, and reordering by drag is only offered in custom mode.
  const [sortMode, setSortMode] = useState<TagSortMode>(() =>
    readSortMode(wallet.id),
  );
  const [modeWallet, setModeWallet] = useState(wallet.id);
  if (modeWallet !== wallet.id) {
    setModeWallet(wallet.id);
    setSortMode(readSortMode(wallet.id));
  }
  const changeSort = (mode: TagSortMode) => {
    setSortMode(mode);
    writeSortMode(wallet.id, mode);
  };
  const dragEnabled = !readOnly && sortMode === "custom";

  const counts = useMemo(() => countTagUsage(transactions), [transactions]);
  const orderedTree = useMemo(
    () => sortTree(tree, sortMode, counts),
    [tree, sortMode, counts],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overParent, setOverParent] = useState<string | null>(null);
  const [addingMain, setAddingMain] = useState(false);
  const [addingChildFor, setAddingChildFor] = useState<string | null>(null);

  // The child's parent when a drag started (to know whether it was reparented),
  // and a snapshot of the tree to restore on cancel. Live cross-container moves
  // in onDragOver mutate `tree` directly, so these ride out the whole gesture.
  const dragOriginParent = useRef<string | null>(null);
  const treeBeforeDrag = useRef<TagTreeNode[] | null>(null);

  // Resync the derived tree when the underlying tags change (add / delete /
  // rename / reparent) or the wallet switches. Render-time reconciliation
  // (React-endorsed) rather than an effect: `tree` is derived from tags + the
  // saved order, and drag handlers keep localStorage in step. Stale saved
  // names are harmless and get pruned on the next persist.
  const derivedKey = `${wallet.id}|${tags
    .map((t) => `${t.name}:${t.parentName ?? ""}`)
    .join(",")}`;
  const [syncKey, setSyncKey] = useState(derivedKey);
  if (syncKey !== derivedKey) {
    setSyncKey(derivedKey);
    setTree(applyTagOrder(wallet.id, tags));
  }

  // On each open, pre-expand the deep-linked parent (the TagPicker's drilled-in
  // category). Render-time reconciliation, matching the resync above. Additive:
  // it never collapses rows the user already opened.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open && initialExpandedParent) {
      setExpanded((prev) => ({ ...prev, [initialExpandedParent]: true }));
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const rootNames = new Set(tree.map((n) => n.parent.name));
  const childParent: Record<string, string> = {};
  tree.forEach((n) =>
    n.children.forEach((c) => {
      childParent[c.name] = n.parent.name;
    }),
  );

  const toggleExpand = (name: string) =>
    setExpanded((p) => ({ ...p, [name]: !p[name] }));

  const requestDelete = (tag: Tag) => {
    deleteModalRef.current?.deleteObject(
      tag,
      tag.parentName ? "sub-category" : "category",
      async () => {
        await handleDeleteTag(tag.name);
      },
      false,
      0,
    );
  };

  // Map any drop target id (child name, parent name, or container:<parent>) to
  // the parent it belongs to.
  const resolveTargetParent = (overId: string): string | null => {
    if (overId.startsWith(CONTAINER_PREFIX))
      return overId.slice(CONTAINER_PREFIX.length);
    if (rootNames.has(overId)) return overId;
    return childParent[overId] ?? null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setActiveId(id);
    setOverParent(null);
    dragOriginParent.current = childParent[id] ?? null;
    treeBeforeDrag.current = tree;
    // A parent about to move should not stay expanded over the drop zone; keep
    // the drag focused on the block itself.
  };

  // While dragging a CHILD, move it between parents live so the target opens a
  // gap (and reparenting feels continuous). Same-container fine-ordering is left
  // to the sortable strategy and finalized in onDragEnd.
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    const activeName = String(active.id);
    const sourceParent = childParent[activeName];
    if (!sourceParent) return; // parent drags don't cross containers
    if (!over) {
      setOverParent(null);
      return;
    }
    const overId = String(over.id);
    const targetParent = resolveTargetParent(overId);
    setOverParent(targetParent);
    if (!targetParent || targetParent === sourceParent) return;

    setTree((prev) => {
      const src = prev.find((n) => n.parent.name === sourceParent);
      const tgt = prev.find((n) => n.parent.name === targetParent);
      if (!src || !tgt) return prev;
      const child = src.children.find((c) => c.name === activeName);
      if (!child) return prev;

      // Insert relative to the hovered child (before/after by its mid-line),
      // else append at the end of the target.
      let newIndex = tgt.children.length;
      const overIdx = tgt.children.findIndex((c) => c.name === overId);
      if (overIdx >= 0) {
        const overRect = over.rect;
        const activeTop = active.rect.current.translated?.top;
        const isBelow =
          activeTop != null && activeTop > overRect.top + overRect.height / 2;
        newIndex = overIdx + (isBelow ? 1 : 0);
      }

      const moved: Tag = { ...child, parentName: targetParent };
      return prev.map((n) => {
        if (n.parent.name === sourceParent)
          return {
            ...n,
            children: src.children.filter((c) => c.name !== activeName),
          };
        if (n.parent.name === targetParent)
          return {
            ...n,
            children: [
              ...tgt.children.slice(0, newIndex),
              moved,
              ...tgt.children.slice(newIndex),
            ],
          };
        return n;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeName = String(active.id);
    const originParent = dragOriginParent.current;
    const before = treeBeforeDrag.current;
    setActiveId(null);
    setOverParent(null);
    dragOriginParent.current = null;
    treeBeforeDrag.current = null;

    if (!over) {
      // Dropped nowhere: undo any live cross-container move.
      if (before) {
        setTree(before);
        persistTree(wallet.id, before);
      }
      return;
    }
    const overId = String(over.id);

    // --- dragging a parent: reorder roots only ---
    if (rootNames.has(activeName)) {
      const overRoot = resolveTargetParent(overId);
      if (!overRoot || overRoot === activeName) return;
      const oldIndex = tree.findIndex((n) => n.parent.name === activeName);
      const newIndex = tree.findIndex((n) => n.parent.name === overRoot);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(tree, oldIndex, newIndex);
      setTree(next);
      persistTree(wallet.id, next);
      return;
    }

    // --- dragging a child: finalize position within its (current) parent ---
    // onDragOver has already applied any reparent, so `childParent` is current.
    const currentParent = childParent[activeName];
    if (!currentParent) {
      if (before) {
        setTree(before);
        persistTree(wallet.id, before);
      }
      return;
    }
    const node = tree.find((n) => n.parent.name === currentParent);
    if (!node) return;
    const oldIdx = node.children.findIndex((c) => c.name === activeName);
    let newIdx = oldIdx;
    if (!overId.startsWith(CONTAINER_PREFIX) && !rootNames.has(overId)) {
      const oi = node.children.findIndex((c) => c.name === overId);
      if (oi >= 0) newIdx = oi;
    }

    let next = tree;
    if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
      const reordered = arrayMove(node.children, oldIdx, newIdx);
      next = tree.map((n) =>
        n.parent.name === currentParent ? { ...n, children: reordered } : n,
      );
      setTree(next);
    }
    persistTree(wallet.id, next);

    // Persist a reparent to the backend (order already saved locally above).
    if (originParent && originParent !== currentParent) {
      const moved = next
        .find((n) => n.parent.name === currentParent)
        ?.children.find((c) => c.name === activeName);
      if (moved) {
        void handleUpdateTag(activeName, {
          ...moved,
          parentName: currentParent,
        }).then((ok) => {
          if (!ok) {
            // Backend rejected the move: fall back to a store-consistent tree.
            const reverted = applyTagOrder(wallet.id, tags);
            setTree(reverted);
            persistTree(wallet.id, reverted);
          }
        });
      }
    }
  };

  const handleDragCancel = () => {
    const before = treeBeforeDrag.current;
    treeBeforeDrag.current = null;
    dragOriginParent.current = null;
    setActiveId(null);
    setOverParent(null);
    if (before) setTree(before);
  };

  const activeIsChild = activeId != null && childParent[activeId] != null;
  const activeNode: TagTreeNode | null = activeId
    ? (tree.find((n) => n.parent.name === activeId) ?? null)
    : null;
  const activeChild: Tag | null =
    activeId && !activeNode
      ? (tree.flatMap((n) => n.children).find((c) => c.name === activeId) ??
        null)
      : null;

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title="Manage Categories"
      subtitle={`${wallet.name} · ${tree.length} ${
        tree.length === 1 ? "category" : "categories"
      }`}
      accentColor={wallet.color}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={nestedCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-app-muted">
              Sort
            </span>
            <Selector
              size="sm"
              value={sortMode}
              onChange={(v) => changeSort(v as TagSortMode)}
              options={[
                {
                  value: "custom",
                  label: "Custom",
                  icon: <FontAwesomeIcon icon={faGripVertical} />,
                  activeColorClass: "text-app-text",
                },
                {
                  value: "usage",
                  label: "Usage",
                  icon: <FontAwesomeIcon icon={faFire} />,
                  activeColorClass: "text-app-text",
                },
                {
                  value: "name",
                  label: "Name",
                  icon: <FontAwesomeIcon icon={faArrowDownAZ} />,
                  activeColorClass: "text-app-text",
                },
              ]}
            />
          </div>
        </div>

        {!readOnly && (
          <div className="mb-3">
            {addingMain ? (
              <TagSelectorAddForm
                currentParentName={null}
                currentParentColor={wallet.color}
                onClose={() => setAddingMain(false)}
              />
            ) : (
              <AddCategoryButton
                accentColor={wallet.color}
                label="Add Main Category"
                onClick={() => setAddingMain(true)}
                variant="main"
              />
            )}
          </div>
        )}

        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-app-input text-app-muted">
              <FontAwesomeIcon icon={faLayerGroup} className="text-xl" />
            </div>
            <h3 className="text-sm font-bold text-app-text">
              No categories yet
            </h3>
            <p className="max-w-xs text-xs text-app-muted">
              {readOnly
                ? "This wallet has no categories."
                : "Create your first main category to start organizing transactions."}
            </p>
          </div>
        ) : (
          <SortableContext
            items={orderedTree.map((n) => n.parent.name)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              {orderedTree.map((node) => {
                const isOpen = !!expanded[node.parent.name];
                const parentOccurrences =
                  (counts[node.parent.name] ?? 0) +
                  node.children.reduce((s, c) => s + (counts[c.name] ?? 0), 0);
                return (
                  <CategoryParentRow
                    key={node.parent.name}
                    parent={node.parent}
                    childCount={node.children.length}
                    occurrences={parentOccurrences}
                    expanded={isOpen}
                    onToggleExpand={() => toggleExpand(node.parent.name)}
                    readOnly={readOnly}
                    draggable={dragEnabled}
                    isDropTarget={
                      activeIsChild && overParent === node.parent.name
                    }
                    onUpdateTag={handleUpdateTag}
                    onRequestDelete={requestDelete}
                  >
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-app-border pl-2 pb-1">
                            <SortableContext
                              items={node.children.map((c) => c.name)}
                              strategy={verticalListSortingStrategy}
                            >
                              {node.children.map((c) => (
                                <CategoryChildRow
                                  key={c.name}
                                  child={c}
                                  readOnly={readOnly}
                                  draggable={dragEnabled}
                                  occurrences={counts[c.name] ?? 0}
                                  onUpdateTag={handleUpdateTag}
                                  onRequestDelete={requestDelete}
                                />
                              ))}
                            </SortableContext>

                            {node.children.length === 0 && !readOnly && (
                              <ChildDropZone
                                parentName={node.parent.name}
                                color={node.parent.colorHex}
                              />
                            )}

                            {!readOnly &&
                              (addingChildFor === node.parent.name ? (
                                <TagSelectorAddForm
                                  currentParentName={node.parent.name}
                                  currentParentColor={node.parent.colorHex}
                                  onClose={() => setAddingChildFor(null)}
                                />
                              ) : (
                                <AddCategoryButton
                                  accentColor={wallet.color}
                                  label="Add sub-category"
                                  onClick={() =>
                                    setAddingChildFor(node.parent.name)
                                  }
                                  variant="sub"
                                />
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CategoryParentRow>
                );
              })}
            </div>
          </SortableContext>
        )}

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeNode ? (
            <div className="overflow-hidden rounded-xl bg-app-card shadow-2xl ring-1 ring-app-border">
              <div className="flex items-center gap-2 px-3 py-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-app-input"
                  style={{ color: activeNode.parent.colorHex }}
                >
                  <Icon
                    icon={activeNode.parent.icon}
                    color={activeNode.parent.colorHex}
                  />
                </div>
                <span className="text-sm font-bold text-app-text">
                  {activeNode.parent.name}
                </span>
                <span className="ml-auto rounded-full bg-app-input px-2 py-0.5 font-app-mono text-[11px] font-bold tabular-nums text-app-muted">
                  {activeNode.children.length}
                </span>
              </div>
              {activeNode.children.length > 0 && (
                <div className="ml-5 flex flex-col gap-1 border-l border-app-border pb-2 pl-2 pr-2">
                  {activeNode.children.slice(0, 4).map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 px-1 py-0.5"
                    >
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-md bg-app-input text-xs"
                        style={{ color: c.colorHex }}
                      >
                        <Icon icon={c.icon} color={c.colorHex} />
                      </div>
                      <span className="truncate text-xs font-medium text-app-text">
                        {c.name}
                      </span>
                    </div>
                  ))}
                  {activeNode.children.length > 4 && (
                    <span className="pl-1 text-[11px] italic text-app-muted">
                      +{activeNode.children.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : activeChild ? (
            <div className="flex items-center gap-2 rounded-lg bg-app-card px-3 py-2 shadow-2xl ring-1 ring-app-border">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-app-input"
                style={{ color: activeChild.colorHex }}
              >
                <Icon icon={activeChild.icon} color={activeChild.colorHex} />
              </div>
              <span className="text-sm font-medium text-app-text">
                {activeChild.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ResponsiveOverlay>
  );
};
