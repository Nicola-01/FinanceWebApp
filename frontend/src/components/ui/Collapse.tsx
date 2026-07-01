import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface CollapseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
}

export const Collapse: React.FC<CollapseProps> = ({
  children,
  title,
  defaultOpen = false,
  className = "",
  ...props
}) => {
  const [collapseOpen, setCollapseOpen] = useState(defaultOpen);

  return (
    <div className={`${className}`} {...props}>
      <button
        onClick={() => setCollapseOpen((o) => !o)}
        className="flex items-center gap-3 w-full text-left group mb-4 outline-none"
      >
        <h2 className="text-2xl font-bold text-app-text group-hover:text-app-text/80 transition-colors">
          {title}
        </h2>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-app-muted transition-transform duration-300 ${collapseOpen ? "rotate-180" : ""}`}
        />
      </button>

      {collapseOpen && (
        <div className="animate-[fadeIn_0.2s_ease-out]">{children}</div>
      )}
    </div>
  );
};
