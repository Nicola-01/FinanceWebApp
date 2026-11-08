import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Props {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
}

/** Dashed "Manage …" action at the bottom of a picker's dropdown. */
export function DropdownManageButton({ icon, label, onClick }: Props) {
  return (
    <div className="mt-2 border-t border-app-border pt-2">
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-lg border border-dashed border-app-border p-2.5 text-left transition-colors hover:bg-app-input"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-input transition-colors group-hover:bg-app-surface">
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
