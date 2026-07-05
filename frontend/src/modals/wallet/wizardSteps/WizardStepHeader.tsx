import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface WizardStepHeaderProps {
  icon: IconDefinition;
  title: string;
  subtitle: string;
}

/**
 * Consistent heading for each wizard step: a small tinted icon, a bold title and
 * a one-line subtitle. Gives every step the same orientation without repeating
 * markup, and keeps copy left-aligned above the step body.
 */
export function WizardStepHeader({
  icon,
  title,
  subtitle,
}: WizardStepHeaderProps) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <h3 className="flex items-center gap-2 text-base font-bold text-app-text">
        <FontAwesomeIcon icon={icon} className="text-app-muted" />
        {title}
      </h3>
      <p className="text-sm text-app-muted">{subtitle}</p>
    </div>
  );
}

export default WizardStepHeader;
