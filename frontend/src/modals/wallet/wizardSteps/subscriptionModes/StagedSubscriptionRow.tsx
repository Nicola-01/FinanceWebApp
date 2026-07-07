import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faTriangleExclamation,
  faPlus,
  faChevronRight,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../../components/ui/Button";
import { CustomSelect } from "../../../../components/ui/CustomSelect";
import { Icon } from "../../../../components/icon/Icon";
import { TagBadge } from "../../../../components/ui/TagBadge";
import { TagTreePicker } from "../../../../components/TagSelector/TagTreePicker";
import { AmountInput } from "../../../../components/ui/AmountInput";
import CustomDatePicker from "../../../../components/DataPicker/CustomDatePicker";
import { SchedulingRules } from "../../../subscription/SchedulingRules";
import { findRecommendedTagWithParent } from "../recommendedTags";
import { subscriptionTagUnresolved } from "./subscriptionTags";
import { formatFrequency } from "./subscriptionSummary";
import type { Tag } from "../../../../utils/types";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

const tagKey = (s: string) => s.trim().toLowerCase();

/** Local YYYY-MM-DD (no UTC shift, unlike `toISOString`). */
const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Parse a wallet-local YYYY-MM-DD back to a Date at local midnight. */
const parseIsoDate = (s?: string): Date | null =>
  s ? new Date(`${s}T00:00:00`) : null;

export interface StagedSubscriptionRowProps {
  /** The single staged subscription this row renders. */
  sub: SubscriptionRequest;
  /** Staged tags — resolves the subscription's tag (and its parent chain). */
  tags: TagRequest[];
  /** Wallet-currency symbol shown next to the amount. */
  currencySymbol: string;
  /** Wallet accent colour, used when the tag itself has none. */
  accentColor?: string;
  /** Whether this row's editor/resolver panel is open. */
  open: boolean;
  /** Toggle this row's expanded state. */
  onToggle: () => void;
  /** Remove this subscription. */
  onRemove: () => void;
  /** Point this subscription at an existing tag (closes the row). */
  onReassignTag: (tagName: string) => void;
  /** Create the missing tag for this subscription (closes the row). */
  onCreateTag: () => void;
  /** Patch this subscription (amount, scheduling, dates…). */
  onEdit: (patch: Partial<SubscriptionRequest>) => void;
}

/**
 * One row of the "subscriptions ready" list. Its header shows the subscription's
 * {@link TagBadge} (or an amber flag when the tag isn't staged), recurrence and
 * signed amount; tapping it expands either the editor (amount, start date,
 * recurrence) or, for an unresolved tag, a reassign/create panel. Self-contained
 * and fully controlled — expansion and every mutation are delegated to the
 * parent {@link StagedSubscriptionList} through no-arg callbacks.
 */
export function StagedSubscriptionRow({
  sub,
  tags,
  currencySymbol,
  accentColor,
  open,
  onToggle,
  onRemove,
  onReassignTag,
  onCreateTag,
  onEdit,
}: StagedSubscriptionRowProps) {
  // The expand animation clips overflow while the height grows; once it settles
  // we release the clip so the tag dropdown (absolutely positioned) can spill
  // out of the row. Resets naturally on collapse (the panel unmounts).
  const [settled, setSettled] = useState(false);

  const missing = subscriptionTagUnresolved(sub, tags);
  const matched = tags.find((t) => tagKey(t.name) === tagKey(sub.tag));
  const accent = matched?.colorHex ?? accentColor;
  // A missing tag that is a known Recommended leaf carries a parent category
  // (e.g. "Netflix" → "Subscriptions"); surface it so the user sees — and
  // creates — the whole hierarchy, not a lone orphan tag.
  const recommended = missing
    ? findRecommendedTagWithParent(sub.tag)
    : undefined;
  const parentName = recommended?.parent.name;
  const tagIcon = recommended?.child.icon;
  const tagColor = recommended?.child.colorHex;
  const parentIcon = recommended?.parent.icon;
  const parentColor = recommended?.parent.colorHex;

  // TagBadge resolves a parent from this list; the wizard has no WalletProvider.
  const contextTags: Tag[] = tags.map((t) => ({
    name: t.name,
    icon: t.icon,
    colorHex: t.colorHex,
    parentName: t.parentName ?? null,
  }));

  const tagOptions = [
    { value: "", label: "Use an existing tag" },
    ...tags.map((t) => ({
      value: t.name,
      label: (
        <span className="flex items-center gap-2">
          <Icon icon={t.icon} color={t.colorHex} />
          {t.name}
        </span>
      ),
    })),
  ];

  return (
    <li className="px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={missing ? `Fix tag for ${sub.name}` : `Edit ${sub.name}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--r-sm)] py-1 text-left"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            {/* <span className="truncate text-sm text-app-text">
              {sub.name || <span className="text-app-muted">(unnamed)</span>}
            </span> */}
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {missing ? (
                <span className="flex items-center gap-1 rounded-[var(--r-sm)] border border-app-yellow/40 bg-app-yellow/10 px-2 py-0.5 text-[11px] font-medium text-app-yellow">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="text-[10px]"
                  />
                  {sub.tag || "—"}
                  {parentName && (
                    <>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-[8px] opacity-60"
                      />
                      <span className="opacity-80">{parentName}</span>
                    </>
                  )}
                </span>
              ) : (
                <TagBadge
                  tag={{
                    name: sub.tag,
                    icon: matched?.icon ?? "tag",
                    colorHex: matched?.colorHex ?? "#8b5cf6",
                    parentName: matched?.parentName ?? null,
                  }}
                  tags={contextTags}
                  showParent
                  forceShowParent
                />
              )}
              <span className="text-[11px] text-app-muted">
                {formatFrequency(sub.frequencyInterval, sub.frequencyType)}
              </span>
            </span>
          </span>

          <span
            className={`shrink-0 font-app-mono text-xs tabular-nums ${
              sub.type === "INCOME" ? "text-app-green" : "text-app-red"
            }`}
          >
            {sub.type === "INCOME" ? "+" : "-"}
            {sub.amount} {currencySymbol}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`shrink-0 text-[10px] text-app-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${sub.name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-app-muted transition-colors hover:bg-app-hover hover:text-app-red"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: open && settled ? "visible" : "hidden" }}
            onAnimationComplete={() => open && setSettled(true)}
          >
            {missing ? (
              <div className="mt-2 rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 p-3">
                <p className="text-xs text-app-text">
                  No tag named{" "}
                  <span className="font-semibold">&ldquo;{sub.tag}&rdquo;</span>{" "}
                  in this wallet. Reassign it to an existing tag, or create it
                  {parentName ? (
                    <>
                      {" "}
                      under{" "}
                      <span className="font-semibold">
                        &ldquo;{parentName}&rdquo;
                      </span>
                    </>
                  ) : null}
                  .
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    aria-label={`Create tag ${sub.tag}`}
                    onClick={onCreateTag}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span className="inline-flex flex-wrap items-center justify-center gap-1">
                      Create
                      <span className="inline-flex items-center">
                        &ldquo;
                        {tagIcon && (
                          <Icon
                            icon={tagIcon}
                            color={tagColor}
                            className="mr-1 text-sm"
                          />
                        )}
                        {sub.tag}&rdquo;
                      </span>
                      {parentName && (
                        <>
                          in
                          <span className="inline-flex items-center">
                            &ldquo;
                            {parentIcon && (
                              <Icon
                                icon={parentIcon}
                                color={parentColor}
                                className="mr-1 text-sm"
                              />
                            )}
                            {parentName}&rdquo;
                          </span>
                        </>
                      )}
                    </span>
                  </Button>
                  {tags.length > 0 && (
                    <CustomSelect
                      value=""
                      onChange={(name) => {
                        if (!name) return;
                        onReassignTag(name);
                      }}
                      options={tagOptions}
                      activeColor={accentColor}
                      className="w-full rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3 py-2 text-sm text-app-text sm:w-56"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div
                className="mt-2 flex flex-col gap-3 rounded-[var(--r-input)] border p-3"
                style={{ borderColor: `${accent ?? "#8b5cf6"}33` }}
              >
                <div className="flex justify-center">
                  <AmountInput
                    value={String(sub.amount)}
                    currencySymbol={currencySymbol}
                    type={sub.type}
                    setType={(t) => t && onEdit({ type: t })}
                    onAmountChange={(magnitude) =>
                      onEdit({
                        amount: magnitude === "" ? 0 : Number(magnitude),
                      })
                    }
                    autoFocus={false}
                  />
                </div>

                {/* Tag (left) + start date (right). The user may re-categorise the
              subscription; the picker only offers tags staged in this wallet. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TagTreePicker
                    tags={contextTags}
                    color={accent}
                    selectedTagName={sub.tag}
                    onSelectTag={(name) => onEdit({ tag: name })}
                  />

                  <div>
                    <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                      Start date
                    </label>
                    <div className="flex h-12 rounded-xl border border-app-border bg-app-input shadow-inner transition-colors focus-within:border-[var(--brand-1)]">
                      <CustomDatePicker
                        isRange={false}
                        color={accent}
                        initialPreset="custom"
                        initialStartDate={
                          parseIsoDate(sub.startDate) ?? new Date()
                        }
                        onChange={(val) => {
                          if (val instanceof Date)
                            onEdit({ startDate: toIsoDate(val) });
                        }}
                        triggerClassName="w-full h-full border-0 bg-transparent shadow-none px-3 py-2 text-app-text font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <SchedulingRules
                  showStatus={false}
                  accentColor={accent}
                  frequencyInterval={sub.frequencyInterval}
                  onFrequencyIntervalChange={(v) =>
                    onEdit({ frequencyInterval: v })
                  }
                  frequencyType={sub.frequencyType}
                  onFrequencyTypeChange={(v) => onEdit({ frequencyType: v })}
                  duration={sub.duration}
                  onDurationChange={(d) => {
                    const patch: Partial<SubscriptionRequest> = { duration: d };
                    if (d === "TIMES" && sub.durationTimes == null)
                      patch.durationTimes = 1;
                    if (d === "UNTIL" && !sub.durationUntil)
                      patch.durationUntil = toIsoDate(new Date());
                    onEdit(patch);
                  }}
                  durationTimes={sub.durationTimes ?? 1}
                  onDurationTimesChange={(v) => onEdit({ durationTimes: v })}
                  durationUntil={parseIsoDate(sub.durationUntil)}
                  onDurationUntilChange={(d) =>
                    onEdit({ durationUntil: toIsoDate(d) })
                  }
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default StagedSubscriptionRow;
