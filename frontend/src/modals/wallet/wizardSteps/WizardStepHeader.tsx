import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface WizardStepHeaderProps {
  icon: IconDefinition;
  title: string;
  subtitle: string;
  /** Optional reassurance line (e.g. "you can edit these later"), rendered muted
   *  with an info icon under the subtitle. */
  note?: string;
}

/**
 * Consistent heading for each wizard step: a small tinted icon, a bold title and
 * a one-line subtitle. Gives every step the same orientation without repeating
 * markup, and keeps copy left-aligned above the step body. An optional `note`
 * reassures the user that whatever they stage here can be changed after creation.
 */
export function WizardStepHeader({
  icon,
  title,
  subtitle,
  note,
}: WizardStepHeaderProps) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <h3 className="flex items-center gap-2 text-base font-bold text-app-text">
        <FontAwesomeIcon icon={icon} className="text-app-muted" />
        {title}
      </h3>
      <p className="text-sm text-app-muted">{subtitle}</p>
      {note && (
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-app-muted/80">
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="shrink-0 text-app-muted/70"
          />
          {note}
        </p>
      )}
    </div>
  );
}

export default WizardStepHeader;
