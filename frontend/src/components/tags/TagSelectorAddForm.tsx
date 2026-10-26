import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSpinner, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types";
import { useWalletContext } from "../../dashboard/wallet/WalletContext.tsx";
import { IconPickerButton } from "../icon/IconPickerButton.tsx";
import type { IconKey } from "../../utils/icons.ts";

interface TagSelectorAddFormProps {
  currentParentName: string | null;
  currentParentColor: string;
  onClose: () => void;
}

/**
 * Inline "create tag" form. Shared by the TagPicker dropdown and the Category
 * Manager drawer, so its name is kept stable for both consumers.
 */
export const TagSelectorAddForm: React.FC<TagSelectorAddFormProps> = ({
  currentParentName,
  currentParentColor,
  onClose,
}) => {
  const { handleAddTag } = useWalletContext();
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newTag, setNewTag] = useState<Tag>({
    name: "",
    icon: "tag",
    colorHex: currentParentColor,
    parentName: currentParentName,
  });

  // Keep colour/parent in sync if the user navigates while the form is open.
  const [prevParent, setPrevParent] = useState({
    color: currentParentColor,
    name: currentParentName,
  });
  if (
    prevParent.color !== currentParentColor ||
    prevParent.name !== currentParentName
  ) {
    setPrevParent({ color: currentParentColor, name: currentParentName });
    setNewTag((prev) => ({
      ...prev,
      colorHex: currentParentColor,
      parentName: currentParentName,
    }));
  }

  const handleSave = async () => {
    if (!newTag.name.trim()) {
      onClose();
      return;
    }
    setIsSaving(true);
    const success = await handleAddTag(newTag);

    if (success) {
      setNewTag({
        name: "",
        icon: "tag",
        colorHex: currentParentColor,
        parentName: currentParentName,
      });
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <div className="flex w-full items-center gap-2 overflow-hidden rounded-xl border border-app-border bg-app-input/70 p-1.5 pl-2 shadow-sm">
      <div className="flex shrink-0 items-center justify-center">
        <IconPickerButton
          icon={newTag.icon as IconKey}
          color={newTag.colorHex as string}
          onIconChange={(icon: IconKey) => setNewTag({ ...newTag, icon })}
          onColorChange={(color: string) =>
            setNewTag({ ...newTag, colorHex: color })
          }
          isOpen={showIconSelector}
          onToggle={setShowIconSelector}
        />
      </div>
      <input
        autoFocus
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-app-text placeholder:text-app-muted/50 outline-none"
        placeholder={
          currentParentName ? "Subcategory name..." : "Category name..."
        }
        value={newTag.name}
        onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
        disabled={isSaving}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onClose();
        }}
      />
      {isSaving ? (
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="px-2 text-app-muted"
        />
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={handleSave}
            aria-label="Save category"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: currentParentColor }}
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
          </button>
          <button
            onClick={onClose}
            aria-label="Cancel"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};
