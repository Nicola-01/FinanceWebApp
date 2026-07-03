import React, { useRef, useState } from "react";
import type { Tag } from "../../utils/types.ts";
import type { IconKey } from "../../utils/icons.ts";

/**
 * Shared inline-editing logic for a category row (parent or child): the
 * controlled icon/color picker and the click-to-rename field. Committing
 * happens on blur (Enter blurs to commit, Escape blurs to cancel) so there is
 * a single save path and no double-submit.
 */
export function useInlineTagEdit(
  tag: Tag,
  onUpdateTag: (oldName: string, updated: Partial<Tag>) => Promise<boolean>,
  readOnly = false,
) {
  // --- icon + color ---
  const [iconOpen, setIconOpen] = useState(false);
  const [iconVal, setIconVal] = useState<IconKey>(tag.icon as IconKey);
  const [colorVal, setColorVal] = useState(tag.colorHex);

  const onIconToggle = (open: boolean) => {
    if (readOnly) return;
    if (open) {
      // Re-seed from the tag every time the popup opens.
      setIconVal(tag.icon as IconKey);
      setColorVal(tag.colorHex);
      setIconOpen(true);
      return;
    }
    setIconOpen(false);
    if (iconVal !== tag.icon || colorVal !== tag.colorHex) {
      onUpdateTag(tag.name, { ...tag, icon: iconVal, colorHex: colorVal });
    }
  };

  // --- inline name ---
  const [isEditing, setIsEditing] = useState(false);
  const [nameVal, setNameVal] = useState(tag.name);
  const cancelledRef = useRef(false);

  const startEditing = () => {
    if (readOnly) return;
    setNameVal(tag.name);
    cancelledRef.current = false;
    setIsEditing(true);
  };

  const commitName = async () => {
    setIsEditing(false);
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setNameVal(tag.name);
      return;
    }
    const next = nameVal.trim();
    if (next && next !== tag.name) {
      const ok = await onUpdateTag(tag.name, { ...tag, name: next });
      if (!ok) setNameVal(tag.name);
    } else {
      setNameVal(tag.name);
    }
  };

  const nameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      cancelledRef.current = true;
      e.currentTarget.blur();
    }
  };

  return {
    // icon picker (controlled)
    iconOpen,
    displayIcon: iconOpen ? iconVal : (tag.icon as IconKey),
    displayColor: iconOpen ? colorVal : tag.colorHex,
    setIconVal,
    setColorVal,
    onIconToggle,
    // inline name
    isEditing,
    nameVal,
    setNameVal,
    startEditing,
    commitName,
    nameKeyDown,
  };
}
