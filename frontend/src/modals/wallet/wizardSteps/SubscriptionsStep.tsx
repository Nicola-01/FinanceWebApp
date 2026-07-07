import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFileCsv,
  faPlus,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { Selector } from "../../../components/ui/Selector";
import { WizardStepHeader } from "./WizardStepHeader";
import { RecommendedSubscriptionPicker } from "./subscriptionModes/RecommendedSubscriptionPicker";
import { SubscriptionCreateMode } from "./subscriptionModes/SubscriptionCreateMode";
import { StagedSubscriptionList } from "./subscriptionModes/StagedSubscriptionList";
import {
  toSubscriptionRequest,
  type RecommendedSubscription,
} from "./subscriptionModes/recommendedSubscriptions";
import { addTagToDraft } from "./tagDraft";
import { CURRENCY_META, type CurrencyCode } from "../../../utils/currencies";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../dashboard/settings/csvImport";

type SubMode = "recommended" | "csv" | "create";

export interface SubscriptionsStepProps {
  /** Subscriptions staged so far (owned by the wizard). */
  value: SubscriptionRequest[];
  /** Emit the next staged list. */
  onChange: (next: SubscriptionRequest[]) => void;
  /** Wallet currency code (e.g. "EUR") used to annotate amounts. */
  currency: string;
  /** Wallet colour (hex) applied to the checkboxes and CTAs. */
  accentColor?: string;
  /** Tags staged in the previous (Tags) step — used to resolve a subscription's tag. */
  tags?: TagRequest[];
  /** Add a tag to the draft (for "Create «X»" when a subscription's tag is missing). */
  onTagsChange?: (next: TagRequest[]) => void;
}

/**
 * Wizard step 3 — subscriptions. A mode selector switches between three ways to
 * add recurring payments: curated **Recommended** toggles (with editable
 * amounts), a **CSV** upload, and manual **Create**. All modes feed one staged
 * list, echoed below as a {@link StagedSubscriptionList}. A subscription whose
 * `tag` isn't among the tags staged in the previous step is flagged there in
 * amber; the user resolves it by reassigning to an existing tag or creating the
 * missing one (added to {@link SubscriptionsStepProps.tags}). Optional — the
 * wizard lets the user continue with none.
 */
export function SubscriptionsStep({
  value,
  onChange,
  currency,
  accentColor,
  tags = [],
  onTagsChange,
}: SubscriptionsStepProps) {
  const [mode, setMode] = useState<SubMode>("recommended");

  const currencySymbol = useMemo(
    () => CURRENCY_META[currency as CurrencyCode]?.symbol ?? currency,
    [currency],
  );

  // --- Recommended mode ---
  const stageSuggestion = (s: RecommendedSubscription, amount: number) =>
    onChange([...value, toSubscriptionRequest(s, amount)]);
  const unstageByName = (name: string) =>
    onChange(value.filter((s) => s.name !== name));

  // --- Create mode ---
  const addCreated = (sub: SubscriptionRequest) => onChange([...value, sub]);

  // --- Staged list: edit + remove + tag resolution ---
  const editStaged = (index: number, patch: Partial<SubscriptionRequest>) =>
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeStaged = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const reassignTag = (index: number, tagName: string) =>
    onChange(value.map((s, i) => (i === index ? { ...s, tag: tagName } : s)));

  // Create a tag named after the subscription's missing tag, adding it to the
  // draft's tag list; the conflict then clears since the names now match. The
  // shared {@link addTagToDraft} recreates the Recommended hierarchy when the
  // tag is a known curated leaf.
  const createTagFor = (index: number) => {
    const name = value[index]?.tag;
    if (!name || !onTagsChange) return;
    const next = addTagToDraft(name, tags, accentColor);
    if (next !== tags) onTagsChange(next);
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <WizardStepHeader
        icon={faArrowsRotate}
        title="Subscriptions"
        subtitle="Optional — add recurring payments from common ones, a CSV, or your own."
        note="You can edit, pause or remove subscriptions anytime from the wallet."
      />

      <Selector<SubMode>
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
          <RecommendedSubscriptionPicker
            staged={value}
            currencySymbol={currencySymbol}
            onStage={stageSuggestion}
            onUnstage={unstageByName}
          />
        )}

        {mode === "csv" && (
          <CsvUploadField<SubscriptionRequest>
            resource="subscriptions"
            title="Import subscriptions from a CSV"
            columnsHint="Name, Tag, Amount, Type, Status, …"
            noun="subscription"
            accentColor={accentColor}
            onDtos={(dtos) => onChange([...value, ...dtos])}
          />
        )}

        {mode === "create" && (
          <SubscriptionCreateMode
            tags={tags}
            currency={currency}
            accentColor={accentColor}
            onAdd={addCreated}
          />
        )}
      </motion.div>

      {value.length > 0 && (
        <StagedSubscriptionList
          value={value}
          tags={tags}
          currencySymbol={currencySymbol}
          accentColor={accentColor}
          onRemove={removeStaged}
          onReassignTag={reassignTag}
          onCreateTagFor={createTagFor}
          onEdit={editStaged}
        />
      )}
    </div>
  );
}

export default SubscriptionsStep;
