import React from "react";
import { progressWidth } from "../../utils/progressWidth";
import { useGrowIn } from "../../hooks/useGrowIn.ts";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

type Status = "ok" | "warn" | "danger";

const STATUS_BG_CLASS: Record<Status, string> = {
  ok: "bg-app-income",
  warn: "bg-app-warn-fill",
  danger: "bg-app-danger",
};

const SIZE_CLASS = {
  md: "h-2.5 rounded-[5px]",
  sm: "h-1.5 rounded-[3px]",
};

interface ProgressBarProps {
  value: number; // Ratio: 1 = 100%; may exceed 1 or be negative
  status?: Status;
  color?: string; // Overrides the status colour when given
  size?: "md" | "sm";
  label: string;
  className?: string;
  /** v2 grow-in start delay in ms. */
  delay?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  status = "ok",
  color,
  size = "md",
  label,
  className = "",
  delay = 0,
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  const grown = useGrowIn(delay, v2);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={`overflow-hidden bg-app-raised ${SIZE_CLASS[size]} ${className}`}
    >
      <div
        className={[
          "h-full rounded-[inherit]",
          color ? "" : STATUS_BG_CLASS[status],
          v2
            ? "transition-[width] duration-700 ease-out motion-reduce:transition-none"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: `${v2 && !grown ? 0 : progressWidth(value)}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
};
