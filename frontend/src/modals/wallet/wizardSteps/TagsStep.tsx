import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faFileCsv,
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
import { TagCategoryPicker } from "./TagCategoryPicker";
import {
  RECOMMENDED_TAG_GROUPS,
  groupToTagRequests,
  type RecommendedTagGroup,
} from "./recommendedTags";
import { MOCK_SOURCE_WALLETS, type SourceWallet } from "./sourceWallets";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

export interface TagsStepProps {
  value: TagRequest[];
  onChange: (next: TagRequest[]) => void;
  accentColor?: string;
  /** The user's other wallets, offered as tag sources (defaults to a mock). */
  sourceWallets?: SourceWallet[];
}

const keyOf = (name: string) => name.trim().toLowerCase();

type TagMode = "recommended" | "wallet" | "csv" | "create";

/**
 * Wizard step 2 — tags. A mode selector switches between four ways to add tags:
 * curated **Recommended** categories, **import from another wallet**, a **CSV**
 * upload, and manual **create**. All modes feed one staged list, echoed below as
 * a read-only {@link StagedTagTree}. Categories stage whole (main + sub) and are
 * accented with their colour; individual sub-tags can be struck out (kept
 * visible, crossed out, card turns partial/dashed) and restored; de-/re-selecting
 * a category restores every child. Optional — the wizard lets the user continue
 * with none.
 */
export function TagsStep({
  value,
  onChange,
  accentColor,
  sourceWallets = MOCK_SOURCE_WALLETS,
}: TagsStepProps) {
  const [mode, setMode] = useState<TagMode>("recommended");
  const [sourceWalletId, setSourceWalletId] = useState<string | null>(null);
  const stagedKeys = new Set(value.map((t) => keyOf(t.name)));

  // Every category the user can pick from (presets + each source wallet's),
  // indexed by parent name — the source of truth for deriving a category's
  // struck-out children and their canonical order.
  const knownGroups: RecommendedTagGroup[] = [
    ...RECOMMENDED_TAG_GROUPS,
    ...sourceWallets.flatMap((w) => w.groups),
  ];
  const groupByParentKey = new Map<string, RecommendedTagGroup>();
  knownGroups.forEach((g) => {
    const k = keyOf(g.parent.name);
    if (!groupByParentKey.has(k)) groupByParentKey.set(k, g);
  });

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
  // known category still staged, it reappears below as an excluded node.
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
  // any still-staged category. Children of a known category are emitted in their
  // canonical (definition) order so striking one doesn't shuffle it to the end.
  // Derived, so `value` stays backend-clean.
  const activeByName = new Map(value.map((t) => [keyOf(t.name), t]));
  const displayNodes: StagedTagNode[] = [];
  const emitted = new Set<string>();
  value.forEach((t) => {
    const k = keyOf(t.name);
    if (emitted.has(k)) return;
    const group = groupByParentKey.get(k);
    if (group && keyOf(group.parent.name) === k) {
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

  const sourceWallet =
    sourceWallets.find((w) => w.id === sourceWalletId) ?? null;

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
        <TagCategoryPicker
          groups={RECOMMENDED_TAG_GROUPS}
          stagedKeys={stagedKeys}
          onToggle={toggleGroup}
        />
      )}

      {mode === "wallet" &&
        (sourceWallet ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setSourceWalletId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-app-muted transition-colors hover:text-app-text"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
              All wallets
            </button>
            <p className="text-xs text-app-muted">
              Pick categories to copy from{" "}
              <span className="font-semibold text-app-text">
                {sourceWallet.name}
              </span>
              .
            </p>
            <TagCategoryPicker
              groups={sourceWallet.groups}
              stagedKeys={stagedKeys}
              onToggle={toggleGroup}
            />
          </div>
        ) : sourceWallets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-10 text-center">
            <FontAwesomeIcon
              icon={faWallet}
              className="text-2xl text-app-muted"
            />
            <p className="text-sm text-app-muted">
              You have no other wallets to copy categories from.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sourceWallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setSourceWalletId(w.id)}
                aria-label={`Use tags from ${w.name}`}
                className="flex items-center gap-3 rounded-[var(--r-card)] border border-app-border bg-app-surface p-3 text-left transition-colors hover:bg-app-input"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-card text-lg shadow-sm"
                  style={{ color: w.color }}
                >
                  <Icon icon={w.icon} color={w.color} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-app-text">
                    {w.name}
                  </span>
                  <span className="block text-xs text-app-muted">
                    {w.groups.length} categor
                    {w.groups.length === 1 ? "y" : "ies"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ))}

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
