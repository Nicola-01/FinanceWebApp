import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faPlus,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import type { DedupOverwrite } from "../../dashboard/settings/csvDedup";
import type { ImportRecap } from "./ImportReviewModal";

const plural = (n: number, word: string): string =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

/** A labelled count chip used in both phases' summary rows. */
const StatChip: React.FC<{
  icon: typeof faPlus;
  label: string;
  value: number;
  tone: "neutral" | "accent" | "green";
}> = ({ icon, label, value, tone }) => {
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
}> = ({ newCount, overwrites }) => (
  <div className="text-app-text">
    <div className="mb-4 flex gap-3">
      <StatChip icon={faPlus} label="New" value={newCount} tone="green" />
      <StatChip
        icon={faPenToSquare}
        label="Overwritten"
        value={overwrites.length}
        tone="accent"
      />
    </div>

    <p className="mb-2 text-sm text-app-muted">
      These {plural(overwrites.length, "existing record")} will be replaced:
    </p>
    <ul className="custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto rounded-[var(--r-input)] border border-app-border bg-app-input">
      {overwrites.map((o, i) => (
        <li
          key={`${o.label}-${o.detail ?? ""}-${i}`}
          className="flex items-baseline justify-between gap-3 px-3 py-2"
        >
          <span className="min-w-0 truncate text-sm font-medium text-app-text">
            {o.label || <span className="text-app-muted">(unnamed)</span>}
          </span>
          {o.detail && (
            <span className="shrink-0 font-mono text-[11px] text-app-muted">
              {o.detail}
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

/** Recap phase: created/overwritten counts + any auto-created tags. */
export const ImportReviewRecapBody: React.FC<{
  recap?: ImportRecap;
  showsTags: boolean;
}> = ({ recap, showsTags }) => (
  <div className="text-app-text">
    <div className="flex gap-3">
      <StatChip
        icon={faPlus}
        label="Created"
        value={recap?.created ?? 0}
        tone="green"
      />
      <StatChip
        icon={faPenToSquare}
        label="Overwritten"
        value={recap?.updated ?? 0}
        tone="accent"
      />
    </div>

    {showsTags && (recap?.autoCreatedTags.length ?? 0) > 0 && (
      <div className="mt-4">
        <p className="mb-2 text-sm text-app-muted">
          <FontAwesomeIcon icon={faTag} className="mr-1.5 text-app-blue" />
          {plural(recap?.autoCreatedTags.length ?? 0, "tag")} auto-created:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recap?.autoCreatedTags.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="rounded-[var(--r-sm)] border border-app-border bg-app-input px-2 py-1 text-xs font-medium text-app-text"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);
