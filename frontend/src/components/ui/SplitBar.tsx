import React from "react";
import { splitParts, type SplitSegment } from "../../utils/splitParts";
import { AnimatedNumber } from "./AnimatedNumber.tsx";
import { useGrowIn } from "../../hooks/useGrowIn.ts";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

export type { SplitSegment };

export interface SplitBarProps {
  segments: SplitSegment[];
  ariaLabel: string;
  legend?: boolean;
  className?: string;
}

export const SplitBar: React.FC<SplitBarProps> = ({
  segments,
  ariaLabel,
  legend = true,
  className = "",
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  const grown = useGrowIn(0, v2);
  const parts = splitParts(segments);
  if (parts.length === 0) return null;

  return (
    <div className={"grid gap-3 " + className}>
      <div role="img" aria-label={ariaLabel} className="flex h-3.5 gap-[2px]">
        {parts.map(({ segment, pct, pctLabel }) => (
          <span
            key={segment.id}
            className={
              "h-full min-w-[3px] first:rounded-l-[7px] last:rounded-r-[7px]" +
              (v2
                ? " transition-[width] duration-700 ease-out motion-reduce:transition-none"
                : "")
            }
            style={{
              width: (v2 && !grown ? 0 : pct) + "%",
              backgroundColor: segment.color,
            }}
            title={`${segment.label}: ${pctLabel}`}
          />
        ))}
      </div>
      {legend !== false && (
        <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-app-muted">
          {parts.map(({ segment, pct }) => (
            <li key={segment.id} className="flex items-center">
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[3px]"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
              <b className="ml-1 font-semibold text-app-text">
                {pct < 1 ? (
                  "<1%"
                ) : (
                  <AnimatedNumber kind="percent" value={pct} />
                )}
              </b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
