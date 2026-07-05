import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import { IconPickerButton } from "../../../components/icon/IconPickerButton";
import type { IconKey } from "../../../utils/icons";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

/** Sensible defaults so a tag is valid the moment a name is typed. */
const DEFAULT_ICON: IconKey = "tag";
const DEFAULT_COLOR = "#8b5cf6";

const MIN_NAME = 2;
const MAX_NAME = 25;

const keyOf = (name: string) => name.trim().toLowerCase();

export interface TagCreateModeProps {
  /** Tags already staged in the wizard (to offer as parents + dedupe by name). */
  value: TagRequest[];
  /** Called with a new tag when the user adds one. Parent (TagsStep) owns state. */
  onAdd: (tag: TagRequest) => void;
  /** Per-wallet accent colour (hex) for the primary button, if you want it. */
  accentColor?: string;
}

/**
 * "Create" mode of the wallet wizard's Tags step: a small controlled form to
 * hand-craft a single custom category and hand it up to the parent.
 *
 * Purely presentational and self-contained — it never touches the API,
 * WalletContext, or storage. The wizard defers all persistence; the only
 * outward effect here is calling {@link TagCreateModeProps.onAdd} with a plain
 * {@link TagRequest}. The parent (TagsStep) owns the staged list.
 */
export function TagCreateMode({
  value,
  onAdd,
  accentColor,
}: TagCreateModeProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconKey>(DEFAULT_ICON);
  const [colorHex, setColorHex] = useState(DEFAULT_COLOR);
  const [parentName, setParentName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Only top-level tags (no parent) can be nested under — the backend model is
  // parent → child, so a sub-tag can't itself be a parent here.
  const topLevel = value.filter((t) => !t.parentName?.trim());
  const topLevelNames = new Set(topLevel.map((t) => t.name));
  // Guard against a stale selection if the staged list changed under us.
  const selectedParent = topLevelNames.has(parentName) ? parentName : "";

  const parentOptions: CustomSelectOption[] = [
    { value: "", label: "No parent (top-level)" },
    ...topLevel.map((t) => ({ value: t.name, label: t.name })),
  ];

  const trimmedName = name.trim();
  const isDuplicate = value.some((t) => keyOf(t.name) === keyOf(trimmedName));
  const validLength =
    trimmedName.length >= MIN_NAME && trimmedName.length <= MAX_NAME;
  const canAdd = validLength && !isDuplicate;

  const handleAdd = () => {
    if (!canAdd) return;
    const tag: TagRequest = { name: trimmedName, icon, colorHex };
    // Omit parentName for top-level tags so the shape stays backend-clean.
    if (selectedParent) tag.parentName = selectedParent;
    onAdd(tag);
    // Clear only the name — keep icon/colour/parent so adding several is quick.
    setName("");
  };

  // Inline validation hint (only once the user has started typing).
  const hint =
    trimmedName.length === 0
      ? null
      : isDuplicate
        ? `A tag named "${trimmedName}" already exists.`
        : !validLength
          ? `Name must be ${MIN_NAME}–${MAX_NAME} characters.`
          : null;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--r-card)] border border-app-border bg-app-surface p-4 text-left">
      {/* Name + icon/colour */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
          Category name
        </span>
        <div className="flex items-center gap-2">
          <IconPickerButton
            icon={icon}
            color={colorHex}
            onIconChange={setIcon}
            onColorChange={setColorHex}
            isOpen={pickerOpen}
            onToggle={setPickerOpen}
          />
          <div className="flex-1">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="e.g. Groceries"
              aria-label="Category name"
              invalid={hint !== null}
            />
          </div>
        </div>
        {hint && <p className="text-xs text-app-red">{hint}</p>}
      </div>

      {/* Optional parent */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
          Parent category
        </span>
        <CustomSelect
          value={selectedParent}
          onChange={setParentName}
          options={parentOptions}
          activeColor={accentColor}
          className="w-full rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3.5 py-2.5 text-sm text-app-text"
        />
      </div>

      <Button
        type="button"
        fullWidth
        ripple
        accentColor={accentColor}
        onClick={handleAdd}
        disabled={!canAdd}
      >
        <FontAwesomeIcon icon={faPlus} />
        Add category
      </Button>
    </div>
  );
}

export default TagCreateMode;
