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
  // The row displays these local values (not the tag prop directly) so a freshly
  // picked colour/icon stays on screen continuously. `handleUpdateTag` awaits the
  // backend before the tag prop reflects the change, so reverting to `tag.*` on
  // close would flash the old colour for ~half a second — hence we hold the
  // committed value here and only adopt the prop when it genuinely changes
  // externally (tracked via seen* below), never during that async save gap.
  const [iconOpen, setIconOpen] = useState(false);
  const [iconVal, setIconVal] = useState<IconKey>(tag.icon as IconKey);
  const [colorVal, setColorVal] = useState(tag.colorHex);

  // Adopt external icon/colour changes (edited elsewhere, or our own save landing)
  // via render-time reconciliation, but never while the picker is open (would
  // clobber the in-progress pick). Comparing against the last-seen prop — not the
  // current local value — is what tells a real external change apart from the
  // optimistic value we're already showing, so we don't revert during the save.
  const [seenIcon, setSeenIcon] = useState(tag.icon);
  const [seenColor, setSeenColor] = useState(tag.colorHex);
  if (!iconOpen && (seenIcon !== tag.icon || seenColor !== tag.colorHex)) {
    setSeenIcon(tag.icon);
    setSeenColor(tag.colorHex);
    setIconVal(tag.icon as IconKey);
    setColorVal(tag.colorHex);
  }

  const onIconToggle = (open: boolean) => {
    if (readOnly) return;
    if (open) {
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
    // icon picker (controlled) — display tracks the local committed value, which
    // equals the tag until the user picks, then leads the (async) prop update.
    iconOpen,
    displayIcon: iconVal,
    displayColor: colorVal,
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
