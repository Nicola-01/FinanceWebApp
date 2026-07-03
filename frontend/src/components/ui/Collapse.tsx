import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface CollapseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
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

  const titleClass =
    size === "sm" ? "text-sm font-semibold" : "text-2xl font-bold";

  return (
    <div className={`${className}`} {...props}>
      <button
        onClick={() => setCollapseOpen((o) => !o)}
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
