import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faPlus,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import type { DedupOverwrite } from "../../dashboard/settings/csvDedup";
import type { ImportRecap } from "./ImportReviewModal";
import { useUiVersion } from "../../hooks/useUiVersion";

const plural = (n: number, word: string): string =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

/** A labelled count chip used in both phases' summary rows. */
const StatChip: React.FC<{
  icon: typeof faPlus;
  label: string;
  value: number;
  tone: "neutral" | "accent" | "green";
  isV2: boolean;
}> = ({ icon, label, value, tone, isV2 }) => {
  if (isV2) {
    // ui-v2-switch: StatTile does not fit (no per-chip tone icon, animated
    // display number), so the v2 chip is restyled here.
    const v2Tone =
      tone === "green"
        ? "text-app-income"
        : tone === "accent"
          ? "text-app-warn"
          : "text-app-muted";
    return (
      <div className="flex flex-1 flex-col gap-1 rounded-[var(--r-card)] bg-app-card px-[18px] py-4 text-left shadow-[var(--box-ring)]">
        <span className="flex items-center gap-2 text-[13px] text-app-muted">
          <FontAwesomeIcon icon={icon} className={v2Tone} />
          {label}
        </span>
        <span className="text-[22px] font-semibold tabular-nums text-app-text">
          {value}
        </span>
      </div>
    );
  }
  const toneClass =
    tone === "green"
      ? "text-app-green"
      : tone === "accent"
        ? "text-app-yellow"
        : "text-app-muted";
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-3 text-center">
      <FontAwesomeIcon icon={icon} className={toneClass} />
      <span className="text-lg font-bold text-app-text">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
        {label}
      </span>
    </div>
  );
};

/** Confirm phase: new vs overwritten counts + the list of colliding rows. */
export const ImportReviewConfirmBody: React.FC<{
  newCount: number;
  overwrites: DedupOverwrite[];
}> = ({ newCount, overwrites }) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  return (
    <div
      className={isV2 ? "flex flex-col gap-4 text-app-text" : "text-app-text"}
    >
      <div className={isV2 ? "flex gap-3" : "mb-4 flex gap-3"}>
        <StatChip
          icon={faPlus}
          label="New"
          value={newCount}
          tone="green"
          isV2={isV2}
        />
        <StatChip
          icon={faPenToSquare}
          label="Overwritten"
          value={overwrites.length}
          tone="accent"
          isV2={isV2}
        />
      </div>

      <p
        className={
          isV2 ? "text-[13px] text-app-muted" : "mb-2 text-sm text-app-muted"
        }
      >
        These {plural(overwrites.length, "existing record")} will be replaced:
      </p>
      <ul
        className={
          isV2
            ? "custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]"
            : "custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto rounded-[var(--r-input)] border border-app-border bg-app-input"
        }
      >
        {overwrites.map((o, i) => (
          <li
            key={`${o.label}-${o.detail ?? ""}-${i}`}
            className={
              isV2
                ? "flex items-baseline justify-between gap-3 px-4 py-2.5"
                : "flex items-baseline justify-between gap-3 px-3 py-2"
            }
          >
            <span
              className={
                isV2
                  ? "min-w-0 truncate text-[15px] text-app-text"
                  : "min-w-0 truncate text-sm font-medium text-app-text"
              }
            >
              {o.label || <span className="text-app-muted">(unnamed)</span>}
            </span>
            {o.detail && (
              <span
                className={
                  isV2
                    ? "shrink-0 text-[13px] tabular-nums text-app-muted"
                    : "shrink-0 font-mono text-[11px] text-app-muted"
                }
              >
                {o.detail}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Recap phase: created/overwritten counts + any auto-created tags. */
export const ImportReviewRecapBody: React.FC<{
  recap?: ImportRecap;
  showsTags: boolean;
}> = ({ recap, showsTags }) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  return (
    <div
      className={isV2 ? "flex flex-col gap-4 text-app-text" : "text-app-text"}
    >
      <div className="flex gap-3">
        <StatChip
          icon={faPlus}
          label="Created"
          value={recap?.created ?? 0}
          tone="green"
          isV2={isV2}
        />
        <StatChip
          icon={faPenToSquare}
          label="Overwritten"
          value={recap?.updated ?? 0}
          tone="accent"
          isV2={isV2}
        />
      </div>

      {showsTags && (recap?.autoCreatedTags.length ?? 0) > 0 && (
        <div className={isV2 ? "flex flex-col gap-2" : "mt-4"}>
          <p
            className={
              isV2
                ? "text-[13px] text-app-muted"
                : "mb-2 text-sm text-app-muted"
            }
          >
            <FontAwesomeIcon
              icon={faTag}
              className={
                isV2 ? "mr-1.5 text-app-muted" : "mr-1.5 text-app-blue"
              }
            />
            {plural(recap?.autoCreatedTags.length ?? 0, "tag")} auto-created:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recap?.autoCreatedTags.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className={
                  isV2
                    ? "rounded-[var(--r-sm)] bg-app-raised px-2 py-1 text-[13px] text-app-text"
                    : "rounded-[var(--r-sm)] border border-app-border bg-app-input px-2 py-1 text-xs font-medium text-app-text"
                }
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
