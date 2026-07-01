import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faCheckSquare,
  faSquare,
  faMinusSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types.ts";
import { TagFilterRow } from "./TagFilterRow.tsx";

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  color?: string;
  onChange: (selectedTags: string[]) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTags,
  color = "var(--color-app-green)",
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Group tags
  const rootTags = tags.filter((t) => !t.parentName);

  const getChildren = (parentName: string) =>
    tags.filter((t) => t.parentName === parentName);

  const getFamily = (parentTag: Tag) => [
    parentTag,
    ...getChildren(parentTag.name),
  ];

  // "All" state
  let allState: "checked" | "unchecked" | "indeterminate" = "unchecked";
  if (selectedTags.length === tags.length && tags.length > 0) {
    allState = "checked";
  } else if (selectedTags.length > 0) {
    allState = "indeterminate";
  }

  const toggleAll = () => {
    if (allState === "checked") {
      onChange([]);
    } else {
      onChange(tags.map((t) => t.name));
    }
  };

  const toggleParent = (parentTag: Tag) => {
    const family = getFamily(parentTag);
    const familyNames = family.map((t) => t.name);
    const isFullyChecked = familyNames.every((name) =>
      selectedTags.includes(name),
    );

    if (isFullyChecked) {
      // Uncheck all in family
      onChange(selectedTags.filter((name) => !familyNames.includes(name)));
    } else {
      // Check all in family
      const newSelection = new Set([...selectedTags, ...familyNames]);
      onChange(Array.from(newSelection));
    }
  };

  const toggleSingle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((name) => name !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const toggleExpand = (parentName: string) => {
    setExpandedParents((prev) =>
      prev.includes(parentName)
        ? prev.filter((name) => name !== parentName)
        : [...prev, parentName],
    );
  };

  const getParentState = (
    parentTag: Tag,
  ): "checked" | "unchecked" | "indeterminate" => {
    const familyNames = getFamily(parentTag).map((t) => t.name);
    const checkedCount = familyNames.filter((name) =>
      selectedTags.includes(name),
    ).length;

    if (checkedCount === 0) return "unchecked";
    if (checkedCount === familyNames.length) return "checked";
    return "indeterminate";
  };

  let allIcon = faSquare;
  let allColorClass = "text-app-muted";
  if (allState === "checked") {
    allIcon = faCheckSquare;
    allColorClass = "";
  } else if (allState === "indeterminate") {
    allIcon = faMinusSquare;
    allColorClass = "";
  }

  const isFilterActive = selectedTags.length !== tags.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-[48px] h-[48px] rounded-xl border transition-all ${
          isFilterActive || isOpen
            ? "shadow-lg"
            : "bg-app-input border-app-border text-app-muted hover:bg-app-surface hover:text-app-text"
        }`}
        style={
          isFilterActive || isOpen
            ? {
                backgroundColor: color + "26",
                color: color,
                borderColor: color + "40",
              }
            : {}
        }
        title="Filter by Tags"
      >
        <div className="relative">
          <FontAwesomeIcon
            icon={faFilter}
            className="text-lg transition-transform hover:scale-110"
          />
          {isFilterActive && (
            <div
              className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            ></div>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-4 w-64 rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out] flex flex-col max-h-[350px]">
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {/* All Option */}
            <div
              className="flex items-center gap-3 px-3 py-2 hover:bg-app-input rounded-lg cursor-pointer transition-colors group mb-1 border-b border-app-border pb-2"
              onClick={toggleAll}
            >
              <FontAwesomeIcon
                icon={allIcon}
                className={`text-lg transition-colors ${allColorClass}`}
                style={allState !== "unchecked" ? { color } : {}}
              />
              <span className="text-app-text text-sm font-medium">
                All Tags
              </span>
            </div>

            {/* Tag Tree */}
            {rootTags.map((rootTag) => {
              const children = getChildren(rootTag.name);
              const isExpanded = expandedParents.includes(rootTag.name);
              const pState = getParentState(rootTag);

              return (
                <div key={rootTag.name} className="flex flex-col space-y-0.5">
                  <TagFilterRow
                    tag={rootTag}
                    childrenTags={children}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(rootTag.name)}
                    selectionState={pState}
                    onToggleSelection={() => toggleParent(rootTag)}
                    color={color}
                  />

                  {isExpanded && children.length > 0 && (
                    <div className="pl-3 space-y-0.5 border-l border-app-border ml-5 my-1">
                      {children.map((childTag) => {
                        const cState = selectedTags.includes(childTag.name)
                          ? "checked"
                          : "unchecked";
                        return (
                          <TagFilterRow
                            key={childTag.name}
                            tag={childTag}
                            isExpanded={false}
                            onToggleExpand={() => {}}
                            selectionState={cState}
                            onToggleSelection={() =>
                              toggleSingle(childTag.name)
                            }
                            color={color}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {rootTags.length === 0 && (
              <div className="p-4 text-sm text-app-muted text-center italic">
                No tags available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
