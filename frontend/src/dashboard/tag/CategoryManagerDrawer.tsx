import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownAZ,
  faFire,
  faGripVertical,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { DndContext } from "@dnd-kit/core";
import type { Tag } from "../../types/domain.ts";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { Selector } from "../../components/ui/Selector.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useDeleteModal } from "../../modals/common/DeleteModalContext.tsx";
import { TagSelectorAddForm } from "../../components/tags/TagSelectorAddForm.tsx";
import type { TagSortMode } from "../../utils/tagOrder.ts";
import { nestedCollisionDetection } from "./categoryDnd.ts";
import { useCategoryTree } from "./useCategoryTree.ts";
import { useCategoryTreeDnd } from "./useCategoryTreeDnd.ts";
import { AddCategoryButton } from "./AddCategoryButton.tsx";
import { CategoryTreeList } from "./CategoryTreeList.tsx";
import { CategoryDragOverlay } from "./CategoryDragOverlay.tsx";

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

  const { tree, setTree, sortMode, changeSort, counts, orderedTree } =
    useCategoryTree(wallet.id, tags, transactions);
  const dragEnabled = !readOnly && sortMode === "custom";
  const dnd = useCategoryTreeDnd({
    walletId: wallet.id,
    tags,
    tree,
    setTree,
    handleUpdateTag,
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingMain, setAddingMain] = useState(false);
  const [addingChildFor, setAddingChildFor] = useState<string | null>(null);

  // On each open, pre-expand the deep-linked parent (the TagPicker's drilled-in
  // category). Render-time reconciliation, matching the tree resync. Additive:
  // it never collapses rows the user already opened.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open && initialExpandedParent) {
      setExpanded((prev) => ({ ...prev, [initialExpandedParent]: true }));
    }
  }

  const toggleExpand = (name: string) =>
    setExpanded((p) => ({ ...p, [name]: !p[name] }));

  const requestDelete = (tag: Tag) => {
    deleteModalRef.current?.deleteObject(
      tag,
      tag.parentName ? "sub-category" : "category",
      async () => {
        await handleDeleteTag(tag.name);
      },
      1,
    );
  };

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
        sensors={dnd.sensors}
        collisionDetection={nestedCollisionDetection}
        onDragStart={dnd.handleDragStart}
        onDragOver={dnd.handleDragOver}
        onDragEnd={dnd.handleDragEnd}
        onDragCancel={dnd.handleDragCancel}
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
          <CategoryTreeList
            orderedTree={orderedTree}
            counts={counts}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            readOnly={readOnly}
            dragEnabled={dragEnabled}
            activeIsChild={dnd.activeIsChild}
            overParent={dnd.overParent}
            addingChildFor={addingChildFor}
            setAddingChildFor={setAddingChildFor}
            accentColor={wallet.color}
            onUpdateTag={handleUpdateTag}
            onRequestDelete={requestDelete}
          />
        )}

        <CategoryDragOverlay
          activeNode={dnd.activeNode}
          activeChild={dnd.activeChild}
        />
      </DndContext>
    </ResponsiveOverlay>
  );
};
