import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFileCsv,
  faMinus,
  faPlus,
  faTag,
  faWallet,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { Icon } from "../../../components/icon/Icon";
import { Selector } from "../../../components/ui/Selector";
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
type TagMode = "recommended" | "wallet" | "csv" | "create";

/**
 * Wizard step 2 — tags. A mode selector switches between four ways to add tags:
 * curated **Recommended** categories, **import from another wallet**, a **CSV**
 * upload, and manual **create**. All modes feed one staged list, echoed below as
 * a read-only {@link StagedTagTree}. In Recommended mode a card stages a whole
 * category (main + sub-categories) accented with its colour; individual sub-tags
 * can be struck out (kept visible, crossed out, card turns partial/dashed) and
 * restored, and de-/re-selecting a category restores every child. Optional — the
 * wizard lets the user continue with none.
 */
export function TagsStep({ value, onChange, accentColor }: TagsStepProps) {
  const [mode, setMode] = useState<TagMode>("recommended");
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

  // Staged tree data = active tags plus the struck-out (excluded) children of
  // any still-staged recommended category. Children of a recommended category
  // are emitted in their canonical (definition) order so striking one doesn't
  // shuffle it to the end. Derived, so `value` stays backend-clean.
  const activeByName = new Map(value.map((t) => [keyOf(t.name), t]));
  const displayNodes: StagedTagNode[] = [];
  const emitted = new Set<string>();
  value.forEach((t) => {
    const k = keyOf(t.name);
    if (emitted.has(k)) return;
    const group = RECOMMENDED_TAG_GROUPS.find(
      (g) => keyOf(g.parent.name) === k,
    );
    if (group) {
      displayNodes.push(t);
      emitted.add(k);
      group.children.forEach((c) => {
        const ck = keyOf(c.name);
        displayNodes.push(
          activeByName.get(ck) ?? {
            name: c.name,
            icon: c.icon,
            colorHex: c.colorHex,
            parentName: group.parent.name,
            excluded: true,
          },
        );
        emitted.add(ck);
      });
      return;
    }
    displayNodes.push(t);
    emitted.add(k);
  });

  return (
    <div className="space-y-6 text-left">
      <WizardStepHeader
        icon={faTag}
        title="Tags"
        subtitle="Optional — organise spending into categories."
      />

      <Selector<TagMode>
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          {
            value: "recommended",
            label: "Recommended",
            icon: <FontAwesomeIcon icon={faWandMagicSparkles} />,
            activeColorClass: "text-app-text",
          },
          {
            value: "wallet",
            label: "From wallet",
            icon: <FontAwesomeIcon icon={faWallet} />,
            activeColorClass: "text-app-text",
          },
          {
            value: "csv",
            label: "CSV",
            icon: <FontAwesomeIcon icon={faFileCsv} />,
            activeColorClass: "text-app-text",
          },
          {
            value: "create",
            label: "Create",
            icon: <FontAwesomeIcon icon={faPlus} />,
            activeColorClass: "text-app-text",
          },
        ]}
      />

      {mode === "recommended" && (
        <section>
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
      )}

      {mode === "csv" && (
        <CsvUploadField<TagRequest>
          resource="tags"
          title="Import tags from a CSV"
          columnsHint="Name, Icon, ColorHex, ParentName"
          noun="tag"
          accentColor={accentColor}
          onDtos={mergeDtos}
        />
      )}

      {mode === "wallet" && (
        <div className="flex flex-col items-center gap-2 rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-10 text-center">
          <FontAwesomeIcon
            icon={faWallet}
            className="text-2xl text-app-muted"
          />
          <p className="text-sm text-app-muted">
            Import categories from one of your other wallets — coming next.
          </p>
        </div>
      )}

      {mode === "create" && (
        <div className="flex flex-col items-center gap-2 rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-10 text-center">
          <FontAwesomeIcon icon={faPlus} className="text-2xl text-app-muted" />
          <p className="text-sm text-app-muted">
            Create your own categories from scratch — coming next.
          </p>
        </div>
      )}

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
