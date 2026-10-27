import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface DetailRowProps {
  icon: IconDefinition;
  label: string;
  /** The value cell, rendered as-is on the right (below the label on mobile). */
  children: React.ReactNode;
  /** Label colour class (default muted). */
  labelColorClass?: string;
  /** Extra classes on the row (e.g. a highlight background). */
  className?: string;
}

/** Icon + uppercase label ⟷ value row of the details lists (divide-y parent). */
export const DetailRow: React.FC<DetailRowProps> = ({
  icon,
  label,
  children,
  labelColorClass = "text-app-muted",
  className,
}) => (
  <div
    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5${className ? ` ${className}` : ""}`}
  >
    <span
      className={`${labelColorClass} text-xs font-bold uppercase tracking-wider flex items-center shrink-0`}
    >
      {/* w-5 text-center keeps labels aligned regardless of icon width. */}
      <FontAwesomeIcon icon={icon} className="w-5 text-center mr-2" />
      {label}
    </span>
    {children}
  </div>
);
