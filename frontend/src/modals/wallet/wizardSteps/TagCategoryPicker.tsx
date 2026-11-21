import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../../../components/icon/Icon";
import { useUiVersion } from "../../../hooks/useUiVersion";
import type { RecommendedTagGroup } from "./recommendedTags";

const keyOf = (name: string) => name.trim().toLowerCase();

export interface TagCategoryPickerProps {
  /** Categories offered as selectable cards (preset or a source wallet's). */
  groups: RecommendedTagGroup[];
  /** Names currently staged (lower-cased), to compute each card's state. */
  stagedKeys: Set<string>;
  /** Toggle a whole category on/off. */
  onToggle: (group: RecommendedTagGroup) => void;
}

/**
 * Grid of category cards: each stages a whole category (main + sub-categories)
 * and is accented with the category's own colour. A card is *full* (solid
 * border + check), *partial* (dashed border + minus, some children struck out),
 * or *none*. Shared by the Recommended mode and the import-from-wallet mode so
 * both pick categories identically.
 */
export function TagCategoryPicker({
  groups,
  stagedKeys,
  onToggle,
}: TagCategoryPickerProps) {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((g) => {
        const parentStaged = stagedKeys.has(keyOf(g.parent.name));
        const allStaged =
          parentStaged &&
          g.children.every((c) => stagedKeys.has(keyOf(c.name)));
        const state = !parentStaged ? "none" : allStaged ? "full" : "partial";
        const color = g.parent.colorHex;
        const active = state !== "none";
        return (
          <button
            key={keyOf(g.parent.name)}
            type="button"
            onClick={() => onToggle(g)}
            aria-pressed={
              state === "full" ? true : state === "partial" ? "mixed" : false
            }
            aria-label={`Select the ${g.parent.name} category`}
            className={
              v2
                ? `group flex w-full flex-col gap-2.5 rounded-[var(--r-card)] bg-app-card p-4 text-left shadow-[var(--box-ring)] transition-colors ${
                    active ? "" : "hover:bg-app-raised"
                  }`
                : `group flex w-full flex-col gap-2.5 rounded-[var(--r-card)] border p-3 text-left transition-colors ${
                    active
                      ? state === "partial"
                        ? "border-dashed"
                        : ""
                      : "border-app-border bg-app-surface hover:bg-app-input"
                  }`
            }
            style={
              active
                ? v2
                  ? {
                      backgroundColor: `${color}14`,
                      boxShadow: `inset 0 0 0 ${state === "full" ? 1.5 : 1}px ${color}`,
                    }
                  : { borderColor: color, backgroundColor: `${color}14` }
                : undefined
            }
          >
            <div className="flex items-center gap-2.5">
              <span
                className={
                  v2
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-base"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-card text-base shadow-sm"
                }
                style={{
                  color,
                  backgroundColor: v2
                    ? `color-mix(in srgb, ${color} 18%, transparent)`
                    : undefined,
                }}
              >
                <Icon icon={g.parent.icon} color={color} />
              </span>
              <span
                className={
                  v2
                    ? "min-w-0 flex-1 truncate text-[15px] text-app-text"
                    : "min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide text-app-text"
                }
              >
                {g.parent.name}
              </span>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors"
                style={
                  active
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: "var(--color-app-border)" }
                }
              >
                {state === "full" && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-[10px] text-white"
                  />
                )}
                {state === "partial" && (
                  <FontAwesomeIcon
                    icon={faMinus}
                    className="text-[10px] text-white"
                  />
                )}
              </span>
            </div>

            <ul className="flex flex-col gap-1 pl-0.5">
              {g.children.map((c) => {
                const struck = active && !stagedKeys.has(keyOf(c.name));
                return (
                  <li
                    key={c.name}
                    className={`flex items-center gap-2 ${v2 ? "text-[13px]" : "text-xs"} ${struck ? "text-app-muted/60 line-through" : "text-app-muted"}`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: c.colorHex,
                        opacity: struck ? 0.4 : 1,
                      }}
                    />
                    <span className="truncate">{c.name}</span>
                  </li>
                );
              })}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

export default TagCategoryPicker;
