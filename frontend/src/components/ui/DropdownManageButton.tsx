import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useUiVersion } from "../../hooks/useUiVersion";

interface Props {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
}

/** Dashed "Manage …" action at the bottom of a picker's dropdown. */
export function DropdownManageButton({ icon, label, onClick }: Props) {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  return (
    <div className="mt-2 border-t border-app-border pt-2">
      <button
        type="button"
        onClick={onClick}
        // ui-v2-switch: no dashed border in dark; the row is a plain raised hover.
        className={`group flex w-full items-center gap-3 p-2.5 text-left transition-colors ${
          isV2
            ? "rounded-[var(--r-sm)] hover:bg-app-raised"
            : "rounded-lg border border-dashed border-app-border hover:bg-app-input"
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            isV2 ? "bg-app-card" : "bg-app-input group-hover:bg-app-surface"
          }`}
        >
          <FontAwesomeIcon
            icon={icon}
            className="text-app-muted group-hover:text-app-text"
          />
        </div>
        <span className="text-sm font-medium text-app-muted group-hover:text-app-text">
          {label}
        </span>
      </button>
    </div>
  );
}
