import { useState } from "react";
import { StagedSubscriptionRow } from "./StagedSubscriptionRow";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

export interface StagedSubscriptionListProps {
  /** Subscriptions staged so far (owned by the parent step). */
  value: SubscriptionRequest[];
  /** Tags staged in the previous step — the source of truth for tag resolution. */
  tags: TagRequest[];
  /** Wallet-currency symbol shown next to each amount. */
  currencySymbol: string;
  /** Wallet accent colour (for the pickers/selects highlight). */
  accentColor?: string;
  /** Remove the staged subscription at `index`. */
  onRemove: (index: number) => void;
  /** Point the subscription at `index` to an existing tag. */
  onReassignTag: (index: number, tagName: string) => void;
  /** Create a tag named after the subscription's current (missing) tag. */
  onCreateTagFor: (index: number) => void;
  /** Patch the staged subscription at `index` (amount, scheduling, dates…). */
  onEdit: (index: number, patch: Partial<SubscriptionRequest>) => void;
}

/**
 * The "subscriptions ready" list: a collapsible {@link StagedSubscriptionRow}
 * per staged subscription. This container owns only the accordion state (one row
 * open at a time) and fans each row's no-arg callbacks back out to the parent's
 * index-based handlers; the row renders itself.
 */
export function StagedSubscriptionList({
  value,
  tags,
  currencySymbol,
  accentColor,
  onRemove,
  onReassignTag,
  onCreateTagFor,
  onEdit,
}: StagedSubscriptionListProps) {
  // Which row is expanded (only one at a time).
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (i: number) => setExpanded((cur) => (cur === i ? null : i));

  return (
    <div className="rounded-[var(--r-input)] border border-app-border bg-app-input">
      <div className="border-b border-app-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
          {value.length} subscription{value.length === 1 ? "" : "s"} ready
        </span>
      </div>

      {/* No overflow clip here: the row's tag dropdown is absolutely positioned
          (not portaled), so an overflow container would cut it off. */}
      <ul className="divide-y divide-app-border">
        {value.map((sub, i) => (
          <StagedSubscriptionRow
            key={`${sub.name}-${i}`}
            sub={sub}
            tags={tags}
            currencySymbol={currencySymbol}
            accentColor={accentColor}
            open={expanded === i}
            onToggle={() => toggle(i)}
            onRemove={() => onRemove(i)}
            onReassignTag={(name) => {
              onReassignTag(i, name);
              setExpanded(null);
            }}
            onCreateTag={() => {
              onCreateTagFor(i);
              setExpanded(null);
            }}
            onEdit={(patch) => onEdit(i, patch)}
          />
        ))}
      </ul>
    </div>
  );
}

export default StagedSubscriptionList;
