import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTag } from "@fortawesome/free-solid-svg-icons";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { Icon } from "../../../components/icon/Icon";
import { WizardStepHeader } from "./WizardStepHeader";
import { StagedTagTree } from "./StagedTagTree";
import {
  RECOMMENDED_TAG_GROUPS,
  groupToTagRequests,
  type RecommendedTagGroup,
} from "./recommendedTags";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

export interface TagsStepProps {
  value: TagRequest[];
  onChange: (next: TagRequest[]) => void;
  accentColor?: string;
}

const keyOf = (name: string) => name.trim().toLowerCase();

/**
 * Wizard step 2 — tags. The "Recommended" mode offers curated **categories**
 * (a main category with its sub-categories, from {@link RECOMMENDED_TAG_GROUPS}):
 * selecting a card stages the whole category at once, and the selection is
 * accented with the category's own colour. A CSV upload feeds the same staged
 * list, which is echoed below as a read-only {@link StagedTagTree}. Optional —
 * the wizard lets the user continue with none.
 */
export function TagsStep({ value, onChange, accentColor }: TagsStepProps) {
  const stagedKeys = new Set(value.map((t) => keyOf(t.name)));

  const isGroupStaged = (g: RecommendedTagGroup) =>
    stagedKeys.has(keyOf(g.parent.name));

  const removeCategory = (parentName: string) => {
    const k = keyOf(parentName);
    onChange(
      value.filter(
        (t) => keyOf(t.name) !== k && keyOf(t.parentName ?? "") !== k,
      ),
    );
  };

  const toggleGroup = (g: RecommendedTagGroup) => {
    if (isGroupStaged(g)) {
      removeCategory(g.parent.name);
      return;
    }
    const additions = groupToTagRequests(g).filter(
      (t) => !stagedKeys.has(keyOf(t.name)),
    );
    onChange([...value, ...additions]);
  };

  // Merge uploaded tags into the staged list, de-duplicating by name (last wins).
  const mergeDtos = (dtos: TagRequest[]) => {
    const merged = new Map(value.map((t) => [keyOf(t.name), t]));
    dtos.forEach((t) => merged.set(keyOf(t.name), t));
    onChange([...merged.values()]);
  };

  return (
    <div className="space-y-6 text-left">
      <WizardStepHeader
        icon={faTag}
        title="Tags"
        subtitle="Optional — organise spending into categories from presets or a CSV."
      />

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-muted">
          Recommended categories
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {RECOMMENDED_TAG_GROUPS.map((g) => {
            const selected = isGroupStaged(g);
            const color = g.parent.colorHex;
            return (
              <button
                key={keyOf(g.parent.name)}
                type="button"
                onClick={() => toggleGroup(g)}
                aria-pressed={selected}
                aria-label={`Select the ${g.parent.name} category`}
                className={`group flex w-full flex-col gap-2.5 rounded-[var(--r-card)] border p-3 text-left transition-colors ${
                  selected
                    ? ""
                    : "border-app-border bg-app-surface hover:bg-app-input"
                }`}
                style={
                  selected
                    ? { borderColor: color, backgroundColor: `${color}14` }
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-card text-base shadow-sm"
                    style={{ color }}
                  >
                    <Icon icon={g.parent.icon} color={color} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide text-app-text">
                    {g.parent.name}
                  </span>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={
                      selected
                        ? { backgroundColor: color, borderColor: color }
                        : { borderColor: "var(--color-app-border)" }
                    }
                  >
                    {selected && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-[10px] text-white"
                      />
                    )}
                  </span>
                </div>

                <ul className="flex flex-col gap-1 pl-0.5">
                  {g.children.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center gap-2 text-xs text-app-muted"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.colorHex }}
                      />
                      <span className="truncate">{c.name}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <CsvUploadField<TagRequest>
        resource="tags"
        title="Import tags from a CSV"
        columnsHint="Name, Icon, ColorHex, ParentName"
        noun="tag"
        accentColor={accentColor}
        onDtos={mergeDtos}
      />

      {value.length > 0 && (
        <section aria-label="Staged tags">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
            {value.length} tag{value.length === 1 ? "" : "s"} staged
          </p>
          <StagedTagTree value={value} onRemoveCategory={removeCategory} />
        </section>
      )}
    </div>
  );
}

export default TagsStep;
