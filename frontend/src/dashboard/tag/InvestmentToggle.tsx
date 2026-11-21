import React from "react";
import { Tooltip } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import type { InvestmentState } from "../../utils/investments.ts";

interface InvestmentToggleProps {
  state: InvestmentState;
  /** Name of the flagged ancestor when `state` is "inherited". */
  inheritedFrom?: string;
  onChange: (next: boolean) => void;
}

const TONE: Record<InvestmentState, string> = {
  own: "border-transparent bg-app-invest/15 text-app-invest",
  inherited:
    "border-dashed border-app-invest/60 bg-app-invest/8 text-app-invest",
  partial: "border-dashed border-app-invest/60 bg-app-invest/8 text-app-invest",
  off: "border-transparent text-app-muted hover:bg-app-input hover:text-app-text",
};

/**
 * Compact per-row "counts as investment" toggle. Rendered next to the row
 * actions (edit/delete) so the flag is discoverable without opening the icon picker.
 */
export const InvestmentToggle: React.FC<InvestmentToggleProps> = ({
  state,
  inheritedFrom,
  onChange,
}) => {
  const locked = state === "inherited";
  const tip =
    state === "inherited"
      ? `Inherited from ${inheritedFrom}`
      : state === "partial"
        ? "Some sub-categories count as investments"
        : "Counts as investment (covers its subtags too)";

  return (
    <Tooltip title={tip} placement="top" enterTouchDelay={500}>
      {/* span keeps the tooltip working on the locked (aria-disabled) button */}
      <span className="flex shrink-0">
        <button
          type="button"
          aria-label="Counts as investment"
          aria-pressed={state === "partial" ? "mixed" : state !== "off"}
          aria-disabled={locked || undefined}
          onClick={() => {
            if (!locked) onChange(state !== "own");
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${locked ? "cursor-default" : ""} ${TONE[state]}`}
        >
          <FontAwesomeIcon icon={faChartLine} className="text-xs" />
        </button>
      </span>
    </Tooltip>
  );
};
