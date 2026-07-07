import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { TagBadge } from "../../../../components/ui/TagBadge";
import { RECOMMENDED_TAG_GROUPS } from "../recommendedTags";
import {
  RECOMMENDED_SUBSCRIPTIONS,
  type RecommendedSubscription,
} from "./recommendedSubscriptions";
import { formatFrequency } from "./subscriptionSummary";
import type { Tag } from "../../../../utils/types";
import type { SubscriptionRequest } from "../../../../dashboard/settings/csvImport";

export interface RecommendedSubscriptionPickerProps {
  /** Subscriptions currently staged (drives the selected state). */
  staged: SubscriptionRequest[];
  /** Wallet-currency symbol shown next to each amount. */
  currencySymbol: string;
  /** Stage a suggestion at its default amount. */
  onStage: (suggestion: RecommendedSubscription, amount: number) => void;
  /** Unstage a suggestion by name. */
  onUnstage: (name: string) => void;
}

// `TagBadge` resolves a tag's parent from a tag list; the creation wizard has no
// WalletProvider, so we hand it the Recommended category tags directly — enough
// to render the "Parent › Child" chain.
const RECOMMENDED_CONTEXT_TAGS: Tag[] = RECOMMENDED_TAG_GROUPS.flatMap((g) => [
  {
    name: g.parent.name,
    icon: g.parent.icon,
    colorHex: g.parent.colorHex,
    parentName: null,
  },
  ...g.children.map((c) => ({
    name: c.name,
    icon: c.icon,
    colorHex: c.colorHex,
    parentName: g.parent.name,
  })),
]);

/**
 * "Recommended" mode of the wizard's Subscriptions step: a list of common
 * recurring payments, each shown as its {@link TagBadge} (with the parent
 * category), its default recurrence and a suggested price. Tapping a row only
 * *selects* it — it's staged and painted in the tag's colour, then editing
 * (amount, start date, recurrence) happens in the "subscriptions ready" list
 * below. Tapping again removes it. The parent owns the staged list, the single
 * source of truth for what's selected.
 */
export function RecommendedSubscriptionPicker({
  staged,
  currencySymbol,
  onStage,
  onUnstage,
}: RecommendedSubscriptionPickerProps) {
  const stagedByName = new Map(staged.map((s) => [s.name, s]));

  const toggle = (s: RecommendedSubscription) => {
    if (stagedByName.has(s.name)) onUnstage(s.name);
    else onStage(s, s.amount);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">
        Recommended
      </p>
      <ul className="custom-scrollbar grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {RECOMMENDED_SUBSCRIPTIONS.map((s) => {
          const current = stagedByName.get(s.name);
          const selected = current !== undefined;
          const accent = s.tag.colorHex;
          const shownAmount = current ? current.amount : s.amount;
          // Income shows green with a leading +, expense red with a −, matching
          // the staged "subscriptions ready" list.
          const type = current?.type ?? s.type;
          // Reflect edits made in the staged list; fall back to the defaults a
          // fresh stage would use (monthly, interval 1).
          const frequency = formatFrequency(
            current?.frequencyInterval ?? 1,
            current?.frequencyType ?? "MONTHLY",
          );

          return (
            <li key={s.name}>
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={selected}
                aria-label={s.name}
                className={`flex h-full w-full items-center justify-between gap-3 rounded-[var(--r-input)] border px-3 py-2.5 text-left transition-colors ${
                  selected ? "" : "border-app-border bg-app-input"
                }`}
                style={
                  selected
                    ? { borderColor: accent, backgroundColor: `${accent}0d` }
                    : undefined
                }
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <TagBadge
                    tag={{
                      name: s.tag.name,
                      icon: s.tag.icon,
                      colorHex: s.tag.colorHex,
                      parentName: s.tag.parentName ?? null,
                    }}
                    tags={RECOMMENDED_CONTEXT_TAGS}
                    showParent
                    forceShowParent
                  />
                  <span className="text-[11px] text-app-muted">
                    {frequency}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2.5">
                  <span
                    className={`font-app-mono text-sm tabular-nums ${
                      type === "INCOME" ? "text-app-green" : "text-app-red"
                    }`}
                  >
                    {type === "INCOME" ? "+" : "-"}
                    {shownAmount} {currencySymbol}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      selected ? "text-app-surface" : "text-app-muted"
                    }`}
                    style={selected ? { backgroundColor: accent } : undefined}
                  >
                    <FontAwesomeIcon icon={selected ? faCheck : faPlus} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default RecommendedSubscriptionPicker;
