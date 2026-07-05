import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCsv,
  faPlus,
  faTag,
  faWallet,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { Selector } from "../../../components/ui/Selector";
import { WizardStepHeader } from "./WizardStepHeader";
import { StagedTagTree, type StagedTagNode } from "./StagedTagTree";
import { RecommendedTagMode } from "./tagModes/RecommendedTagMode";
import { WalletTagMode } from "./tagModes/WalletTagMode";
import { CsvTagMode } from "./tagModes/CsvTagMode";
import { TagCreateMode } from "./tagModes/TagCreateMode";
import {
  RECOMMENDED_TAG_GROUPS,
  groupToTagRequests,
  groupTagRequests,
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
  // This-screen-only provenance for tags that can't be derived from a known
  // group (CSV upload / manual create). Recommended & wallet origins are derived.
  const [originOverrides, setOriginOverrides] = useState<
    Record<string, "csv" | "create">
  >({});
  // CSV-uploaded tags, kept so this mode can keep showing them as cards (all
  // pre-selected) even after they've been merged into the staged list.
  const [csvTags, setCsvTags] = useState<TagRequest[]>([]);
  const stagedKeys = new Set(value.map((t) => keyOf(t.name)));

  // Every category the user can pick from (presets + each source wallet's),
  // indexed by parent name — the source of truth for deriving a category's
  // struck-out children and their canonical order.
  const knownGroups: RecommendedTagGroup[] = [
    ...RECOMMENDED_TAG_GROUPS,
    ...sourceWallets.flatMap((w) => w.groups),
    ...groupTagRequests(csvTags),
  ];
  const groupByParentKey = new Map<string, RecommendedTagGroup>();
  knownGroups.forEach((g) => {
    const k = keyOf(g.parent.name);
    if (!groupByParentKey.has(k)) groupByParentKey.set(k, g);
  });

  // Where a staged tag came from — a preset (Recommended), one of the user's
  // wallets (its name), a CSV upload, or manual create.
  const originOf = (name: string): StagedTagNode["origin"] => {
    const k = keyOf(name);
    const matches = (g: RecommendedTagGroup) =>
      keyOf(g.parent.name) === k || g.children.some((c) => keyOf(c.name) === k);
    if (RECOMMENDED_TAG_GROUPS.some(matches))
      return { label: "Recommended", icon: faWandMagicSparkles };
    const w = sourceWallets.find((sw) => sw.groups.some(matches));
    if (w) return { label: w.name, icon: faWallet };
    if (originOverrides[k] === "csv") return { label: "CSV", icon: faFileCsv };
    return { label: "Custom", icon: faPlus };
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
    setOriginOverrides((prev) => {
      const next = { ...prev };
      dtos.forEach((t) => {
        next[keyOf(t.name)] = "csv";
      });
      return next;
    });
    onChange([...merged.values()]);
  };

  // CSV mode: remember the uploaded tags (so they keep showing as cards) and
  // pre-stage all of them.
  const handleCsvUpload = (dtos: TagRequest[]) => {
    setCsvTags((prev) => {
      const m = new Map(prev.map((t) => [keyOf(t.name), t]));
      dtos.forEach((t) => m.set(keyOf(t.name), t));
      return [...m.values()];
    });
    mergeDtos(dtos);
  };

  // Create mode: stage a hand-made tag and mark its origin as custom.
  const addCreated = (tag: TagRequest) => {
    if (stagedKeys.has(keyOf(tag.name))) return;
    setOriginOverrides((prev) => ({ ...prev, [keyOf(tag.name)]: "create" }));
    onChange([...value, tag]);
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
  // Tag each node with its provenance for the staged-tree badge.
  const nodesWithOrigin: StagedTagNode[] = displayNodes.map((n) => ({
    ...n,
    origin: originOf(n.name),
  }));

  return (
    <div className="space-y-6 text-left">
      <WizardStepHeader
        icon={faTag}
        title="Tags"
        subtitle="Optional — organise spending into categories."
        note="You can edit or delete any tag anytime from the wallet."
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

      <motion.div
        key={mode}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {mode === "recommended" && (
          <RecommendedTagMode stagedKeys={stagedKeys} onToggle={toggleGroup} />
        )}

        {mode === "wallet" && (
          <WalletTagMode
            sourceWallets={sourceWallets}
            selectedWalletId={sourceWalletId}
            onSelectWallet={setSourceWalletId}
            stagedKeys={stagedKeys}
            onToggle={toggleGroup}
          />
        )}

        {mode === "csv" && (
          <CsvTagMode
            csvTags={csvTags}
            stagedKeys={stagedKeys}
            accentColor={accentColor}
            onUpload={handleCsvUpload}
            onToggle={toggleGroup}
          />
        )}

        {mode === "create" && (
          <TagCreateMode
            value={value}
            onAdd={addCreated}
            accentColor={accentColor}
          />
        )}
      </motion.div>

      {value.length > 0 && (
        <section aria-label="Staged tags">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
            {value.length} tag{value.length === 1 ? "" : "s"} staged
          </p>
          <StagedTagTree
            value={nodesWithOrigin}
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
