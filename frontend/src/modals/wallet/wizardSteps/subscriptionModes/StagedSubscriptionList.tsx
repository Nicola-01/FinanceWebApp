import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faTriangleExclamation,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../../components/ui/Button";
import { CustomSelect } from "../../../../components/ui/CustomSelect";
import { Icon } from "../../../../components/icon/Icon";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

const tagKey = (s: string) => s.trim().toLowerCase();

export interface StagedSubscriptionListProps {
  /** Subscriptions staged so far (owned by the parent step). */
  value: SubscriptionRequest[];
  /** Tags staged in the previous step — the source of truth for tag resolution. */
  tags: TagRequest[];
  /** Wallet-currency symbol shown next to each amount. */
  currencySymbol: string;
  /** Wallet accent colour (for the reassign select highlight). */
  accentColor?: string;
  /** Remove the staged subscription at `index`. */
  onRemove: (index: number) => void;
  /** Point the subscription at `index` to an existing tag. */
  onReassignTag: (index: number, tagName: string) => void;
  /** Create a tag named after the subscription's current (missing) tag. */
  onCreateTagFor: (index: number) => void;
}

/**
 * Read-out of the staged subscriptions with per-row tag resolution. A
 * subscription whose `tag` isn't among the staged {@link StagedSubscriptionListProps.tags}
 * is flagged with an amber warning badge; tapping it opens an inline panel to
 * either reassign the subscription to an existing tag or create the missing one.
 * Purely presentational — every mutation is delegated to the parent's callbacks.
 */
export function StagedSubscriptionList({
  value,
  tags,
  currencySymbol,
  accentColor,
  onRemove,
  onReassignTag,
  onCreateTagFor,
}: StagedSubscriptionListProps) {
  // Which row's resolver panel is open (only conflicting rows can open one).
  const [expanded, setExpanded] = useState<number | null>(null);

  const tagByKey = new Map(tags.map((t) => [tagKey(t.name), t]));
  const isMissing = (sub: SubscriptionRequest) =>
    sub.tag.trim() !== "" && !tagByKey.has(tagKey(sub.tag));
  const conflicts = value.filter(isMissing).length;

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
    <div className="rounded-[var(--r-input)] border border-app-border bg-app-input">
      <div className="border-b border-app-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
          {value.length} subscription{value.length === 1 ? "" : "s"} ready
        </span>
      </div>

      {conflicts > 0 && (
        <div className="flex items-center gap-2 border-b border-app-yellow/30 bg-app-yellow/5 px-3 py-2 text-xs text-app-yellow">
          <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
          <span>
            {conflicts} subscription{conflicts === 1 ? "" : "s"} use a tag that
            isn't in this wallet yet — tap the tag to pick or create one.
          </span>
        </div>
      )}

      <ul className="custom-scrollbar max-h-72 divide-y divide-app-border overflow-y-auto">
        {value.map((sub, i) => {
          const missing = isMissing(sub);
          const matched = tagByKey.get(tagKey(sub.tag));
          const open = missing && expanded === i;
          return (
            <li key={`${sub.name}-${i}`} className="px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-app-text">
                  {sub.name || (
                    <span className="text-app-muted">(unnamed)</span>
                  )}
                </span>

                <span className="shrink-0 font-app-mono text-xs tabular-nums text-app-muted">
                  <span
                    className={
                      sub.type === "INCOME" ? "text-app-green" : "text-app-red"
                    }
                  >
                    {sub.type === "INCOME" ? "+" : "-"}
                    {sub.amount} {currencySymbol}
                  </span>
                  {" · "}
                  {sub.frequencyType.toLowerCase()}
                </span>

                {missing ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : i)}
                    aria-label={`Fix tag for ${sub.name}`}
                    aria-expanded={open}
                    className="flex shrink-0 items-center gap-1 rounded-[var(--r-sm)] border border-app-yellow/40 bg-app-yellow/10 px-2 py-0.5 text-[11px] font-medium text-app-yellow transition-colors hover:bg-app-yellow/20"
                  >
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="text-[10px]"
                    />
                    {sub.tag}
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-[var(--r-sm)] border border-app-border bg-app-surface px-2 py-0.5 text-[11px] font-medium text-app-muted">
                    {matched && (
                      <Icon
                        icon={matched.icon}
                        color={matched.colorHex}
                        className="text-[11px]"
                      />
                    )}
                    {sub.tag || "—"}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${sub.name}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-app-muted transition-colors hover:bg-app-hover hover:text-app-red"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {open && (
                <div className="mt-2 rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 p-3">
                  <p className="text-xs text-app-text">
                    No tag named{" "}
                    <span className="font-semibold">
                      &ldquo;{sub.tag}&rdquo;
                    </span>{" "}
                    in this wallet. Reassign it to an existing tag, or create
                    it.
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    {tags.length > 0 && (
                      <CustomSelect
                        value=""
                        onChange={(name) => {
                          if (!name) return;
                          onReassignTag(i, name);
                          setExpanded(null);
                        }}
                        options={tagOptions}
                        activeColor={accentColor}
                        className="w-full rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3 py-2 text-sm text-app-text sm:w-56"
                      />
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-label={`Create tag ${sub.tag}`}
                      onClick={() => {
                        onCreateTagFor(i);
                        setExpanded(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Create &ldquo;{sub.tag}&rdquo;
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default StagedSubscriptionList;
