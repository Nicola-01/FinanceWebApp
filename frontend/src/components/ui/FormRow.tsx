import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

interface FormRowProps {
  icon: IconDefinition;
  label: string;
  /** Shows a "*" after the label. */
  required?: boolean;
  /** Faint line under the label. */
  sub?: string;
  /** Extra classes for the row. */
  className?: string;
  /** Extra classes for the right-aligned control wrapper. */
  controlClassName?: string;
  children: ReactNode;
}

/**
 * One line of a v2 form card: icon chip + label on the left, the control
 * right-aligned on the right. Rows are meant to sit inside a
 * `divide-y divide-app-border rounded-[var(--r-card)] bg-app-card` card.
 */
export function FormRow({
  icon,
  label,
  required = false,
  sub,
  className = "",
  controlClassName = "",
  children,
}: FormRowProps) {
  return (
    <div className={`flex min-h-14 items-center gap-3 px-4 ${className}`}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--r-sm)] bg-app-raised text-xs text-app-muted">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="flex min-w-0 shrink flex-col">
        <span className="flex min-w-0 items-baseline gap-0.5 text-[15px] text-app-text">
          <span className="truncate">{label}</span>
          {required && (
            <span aria-hidden="true" className="text-app-danger">
              *
            </span>
          )}
        </span>
        {sub && <span className="text-[13px] text-app-faint">{sub}</span>}
      </div>
      <div
        className={`ml-auto flex min-w-0 flex-1 justify-end ${controlClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export default FormRow;
