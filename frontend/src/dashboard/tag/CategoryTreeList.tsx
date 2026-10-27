import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Tag } from "../../types/domain.ts";
import type { TagTreeNode } from "../../utils/tagOrder.ts";
import { TagSelectorAddForm } from "../../components/tags/TagSelectorAddForm.tsx";
import { CategoryParentRow } from "./CategoryParentRow.tsx";
import { CategoryChildRow } from "./CategoryChildRow.tsx";
import { ChildDropZone } from "./ChildDropZone.tsx";
import { AddCategoryButton } from "./AddCategoryButton.tsx";

interface CategoryTreeListProps {
  orderedTree: TagTreeNode[];
  counts: Record<string, number>;
  expanded: Record<string, boolean>;
  onToggleExpand: (name: string) => void;
  readOnly: boolean;
  dragEnabled: boolean;
  activeIsChild: boolean;
  overParent: string | null;
  addingChildFor: string | null;
  setAddingChildFor: (name: string | null) => void;
  accentColor: string;
  onUpdateTag: (oldName: string, updated: Partial<Tag>) => Promise<boolean>;
  onRequestDelete: (tag: Tag) => void;
}

/** Sortable list of parent rows, each expanding to its sortable children. */
export const CategoryTreeList: React.FC<CategoryTreeListProps> = ({
  orderedTree,
  counts,
  expanded,
  onToggleExpand,
  readOnly,
  dragEnabled,
  activeIsChild,
  overParent,
  addingChildFor,
  setAddingChildFor,
  accentColor,
  onUpdateTag,
  onRequestDelete,
}) => (
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
            onToggleExpand={() => onToggleExpand(node.parent.name)}
            readOnly={readOnly}
            draggable={dragEnabled}
            isDropTarget={activeIsChild && overParent === node.parent.name}
            onUpdateTag={onUpdateTag}
            onRequestDelete={onRequestDelete}
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
                          onUpdateTag={onUpdateTag}
                          onRequestDelete={onRequestDelete}
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
                          accentColor={accentColor}
                          label="Add sub-category"
                          onClick={() => setAddingChildFor(node.parent.name)}
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
);
