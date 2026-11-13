import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useUiVersion } from "../../hooks/useUiVersion";

interface CollapseProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  children: React.ReactNode;
  title: React.ReactNode;
  defaultOpen?: boolean;
  /** `lg` (default) = big section title; `sm` = compact inline disclosure. */
  size?: "sm" | "lg";
  /** Optional node rendered after the title (e.g. a count badge). */
  badge?: React.ReactNode;
}

export const Collapse: React.FC<CollapseProps> = ({
  children,
  title,
  defaultOpen = false,
  size = "lg",
  badge,
  className = "",
  ...props
}) => {
  const [collapseOpen, setCollapseOpen] = useState(defaultOpen);
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";

  // ui-v2-switch: large section titles use the display face, sentence case.
  const titleClass =
    size === "sm"
      ? "text-sm font-semibold"
      : isV2
        ? "font-display text-2xl font-semibold"
        : "text-2xl font-bold";

  return (
    <div className={`${className}`} {...props}>
      <button
        type="button"
        onClick={() => setCollapseOpen((o) => !o)}
        aria-expanded={collapseOpen}
        className="group mb-3 flex w-full items-center gap-2.5 text-left outline-none"
      >
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-app-muted transition-transform duration-300 ${
            size === "sm" ? "text-xs" : ""
          } ${collapseOpen ? "rotate-180" : ""}`}
        />
        <h2
          className={`${titleClass} text-app-text transition-colors group-hover:text-app-text/80`}
        >
          {title}
        </h2>
        {badge}
      </button>

      {collapseOpen && (
        <div className="animate-[fadeIn_0.2s_ease-out]">{children}</div>
      )}
    </div>
  );
};
