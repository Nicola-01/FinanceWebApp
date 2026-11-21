import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import Button from "../../../../components/ui/Button";
import { TagBadge } from "../../../../components/ui/TagBadge";
import { CategoryIcon } from "../../../../components/ui/CategoryIcon";
import { MissingTagChip } from "../MissingTagResolver";
import { formatFrequency } from "./subscriptionSummary";
import { useUiVersion } from "../../../../hooks/useUiVersion";
import type { Tag } from "../../../../types/domain";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

export interface StagedSubscriptionRowHeaderProps {
  sub: SubscriptionRequest;
  /** The subscription's tag isn't staged — show the amber flag instead of the badge. */
  missing: boolean;
  /** Recommended parent of a missing tag, when known. */
  parentName?: string;
  /** The staged tag the subscription points at (when resolved). */
  matched?: TagRequest;
  /** Staged tags in `Tag` shape, for the badge's parent lookup. */
  contextTags: Tag[];
  currencySymbol: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/** Collapsed header of a staged subscription: tag, recurrence, signed amount, remove. */
export function StagedSubscriptionRowHeader({
  sub,
  missing,
  parentName,
  matched,
  contextTags,
  currencySymbol,
  open,
  onToggle,
  onRemove,
}: StagedSubscriptionRowHeaderProps) {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  const isIncome = sub.type === "INCOME";
  const frequency = formatFrequency(sub.frequencyInterval, sub.frequencyType);
  const label = missing ? `Fix tag for ${sub.name}` : `Edit ${sub.name}`;

  if (isV2) {
    // ui-v2-switch: category icon tile, name + "tag · every month", amount on the right.
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={label}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--r-sm)] text-left"
        >
          <CategoryIcon
            icon={matched?.icon ?? "tag"}
            color={matched?.colorHex ?? "#8b5cf6"}
            size="sm"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-app-text">
              {sub.name}
            </span>
            <span className="block truncate text-[13px] text-app-muted">
              {missing ? (
                <span className="text-app-warn">
                  Tag missing: {sub.tag || "—"}
                </span>
              ) : (
                sub.tag
              )}
              {` · ${frequency}`}
            </span>
          </span>
          <span
            className={`shrink-0 text-right font-semibold tabular-nums ${
              isIncome ? "text-app-income" : "text-app-text"
            }`}
          >
            {isIncome ? "+" : "-"}
            {sub.amount} {currencySymbol}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`shrink-0 text-[10px] text-app-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${sub.name}`}
        >
          <FontAwesomeIcon icon={faXmark} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={label}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--r-sm)] py-1 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {missing ? (
              <MissingTagChip name={sub.tag || "—"} parentName={parentName} />
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
            <span className="text-[11px] text-app-muted">{frequency}</span>
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
  );
}
