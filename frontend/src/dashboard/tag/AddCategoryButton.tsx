import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { AccentHoverButton } from "../../components/ui/AccentHoverButton.tsx";

/**
 * Dashed "add" affordance whose hover accent is the wallet's colour. The colour
 * is dynamic (per wallet), so the hover state is tracked in JS and applied via
 * inline styles rather than static Tailwind hover classes.
 */
export const AddCategoryButton: React.FC<{
  accentColor: string;
  label: string;
  onClick: () => void;
  variant?: "main" | "sub";
}> = ({ accentColor, label, onClick, variant = "main" }) => {
  if (variant === "sub") {
    return (
      <AccentHoverButton
        accentColor={accentColor}
        hoverStyle={{ color: accentColor }}
        onClick={onClick}
        className="flex items-center gap-2 self-start rounded-lg border border-dashed border-app-border/60 px-2.5 py-1.5 text-xs font-semibold text-app-muted transition-colors"
      >
        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
        {label}
      </AccentHoverButton>
    );
  }

  return (
    <AccentHoverButton
      accentColor={accentColor}
      hoverStyle={{ color: "var(--color-app-text)" }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-app-border/70 bg-transparent px-3 py-2.5 text-app-muted transition-colors"
    >
      {(hover) => (
        <>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-input text-app-muted transition-colors"
            style={
              hover
                ? { backgroundColor: `${accentColor}26`, color: accentColor }
                : undefined
            }
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
          </span>
          <span className="text-sm font-semibold">{label}</span>
        </>
      )}
    </AccentHoverButton>
  );
};
