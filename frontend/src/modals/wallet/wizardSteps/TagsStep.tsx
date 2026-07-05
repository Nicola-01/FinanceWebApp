import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faMinus, faTag } from "@fortawesome/free-solid-svg-icons";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { Icon } from "../../../components/icon/Icon";
import { WizardStepHeader } from "./WizardStepHeader";
import { StagedTagTree, type StagedTagNode } from "./StagedTagTree";
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

type GroupState = "none" | "partial" | "full";

/**
 * Wizard step 2 — tags. The "Recommended" mode offers curated **categories**
 * (a main category with its sub-categories, from {@link RECOMMENDED_TAG_GROUPS}).
 * Selecting a card stages the whole category, accented with its own colour;
 * individual sub-tags can then be struck out (they stay visible, crossed out,
 * and the card shows a partial/dashed state). Deselecting and re-selecting a
 * category restores every child. A CSV upload feeds the same staged list, which
 * is echoed below as a read-only {@link StagedTagTree}. Optional — the wizard
 * lets the user continue with none.
 */
export function TagsStep({ value, onChange, accentColor }: TagsStepProps) {
  const stagedKeys = new Set(value.map((t) => keyOf(t.name)));

  const groupState = (g: RecommendedTagGroup): GroupState => {
    if (!stagedKeys.has(keyOf(g.parent.name))) return "none";
    return g.children.every((c) => stagedKeys.has(keyOf(c.name)))
      ? "full"
      : "partial";
  };

  const removeCategory = (parentName: string) => {
    const k = keyOf(parentName);
    onChange(
      value.filter(
        (t) => keyOf(t.name) !== k && keyOf(t.parentName ?? "") !== k,
      ),
    );
  };

  const toggleGroup = (g: RecommendedTagGroup) => {
    if (stagedKeys.has(keyOf(g.parent.name))) {
      // Full or partial → clear the whole category.
      removeCategory(g.parent.name);
      return;
    }
    const additions = groupToTagRequests(g).filter(
      (t) => !stagedKeys.has(keyOf(t.name)),
    );
    onChange([...value, ...additions]);
  };

  // Strike an active child: drop it from the active list. If its parent is a
  // recommended category still staged, it reappears below as an excluded node.
  const removeChild = (child: StagedTagNode) =>
    onChange(value.filter((t) => keyOf(t.name) !== keyOf(child.name)));

  const restoreChild = (child: StagedTagNode) => {
    if (stagedKeys.has(keyOf(child.name))) return;
    onChange([
      ...value,
      {
        name: child.name,
        icon: child.icon,
        colorHex: child.colorHex,
        parentName: child.parentName,
      },
    ]);
  };

  // Merge uploaded tags into the staged list, de-duplicating by name (last wins).
  const mergeDtos = (dtos: TagRequest[]) => {
    const merged = new Map(value.map((t) => [keyOf(t.name), t]));
    dtos.forEach((t) => merged.set(keyOf(t.name), t));
    onChange([...merged.values()]);
  };

  // Staged tree data = active tags + the struck-out (excluded) children of any
  // still-staged recommended category, derived so `value` stays backend-clean.
  const excluded: StagedTagNode[] = [];
  RECOMMENDED_TAG_GROUPS.forEach((g) => {
    if (!stagedKeys.has(keyOf(g.parent.name))) return;
    g.children.forEach((c) => {
      if (!stagedKeys.has(keyOf(c.name)))
        excluded.push({
          name: c.name,
          icon: c.icon,
          colorHex: c.colorHex,
          parentName: g.parent.name,
          excluded: true,
        });
    });
  });
  const displayNodes: StagedTagNode[] = [...value, ...excluded];

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
            const state = groupState(g);
            const color = g.parent.colorHex;
            const active = state !== "none";
            return (
              <button
                key={keyOf(g.parent.name)}
                type="button"
                onClick={() => toggleGroup(g)}
                aria-pressed={
                  state === "full"
                    ? true
                    : state === "partial"
                      ? "mixed"
                      : false
                }
                aria-label={`Select the ${g.parent.name} category`}
                className={`group flex w-full flex-col gap-2.5 rounded-[var(--r-card)] border p-3 text-left transition-colors ${
                  active
                    ? state === "partial"
                      ? "border-dashed"
                      : ""
                    : "border-app-border bg-app-surface hover:bg-app-input"
                }`}
                style={
                  active
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
                        className={`flex items-center gap-2 text-xs ${struck ? "text-app-muted/60 line-through" : "text-app-muted"}`}
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
          <StagedTagTree
            value={displayNodes}
            onRemoveCategory={removeCategory}
            onRemoveChild={removeChild}
            onRestoreChild={restoreChild}
          />
        </section>
      )}
    </div>
  );
}

export default TagsStep;
