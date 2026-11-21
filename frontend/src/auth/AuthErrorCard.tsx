import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import Button from "../components/ui/Button";
import { useUiVersion } from "../hooks/useUiVersion";

/** Invalid / used token state with a "Back to login" action. */
export const AuthErrorCard: React.FC<{
  title: string;
  message: string;
  onBack: () => void;
}> = ({ title, message, onBack }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: a flat card with a danger stripe on the left.
  if (ui === "v2") {
    return (
      <div className="flex w-full flex-col gap-3 rounded-[var(--r-card)] bg-app-card p-5 shadow-[inset_3px_0_0_var(--color-app-danger),var(--box-ring)]">
        <h2 className="font-display text-base font-semibold text-app-text">
          {title}
        </h2>
        <p className="text-[13px] text-app-muted">{message}</p>
        <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
          Back to login
        </Button>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col items-center py-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--r-card)] bg-app-red/15 text-app-red">
        <FontAwesomeIcon icon={faCircleExclamation} className="text-2xl" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-app-text">{title}</h2>
      <p className="mb-6 text-sm text-app-muted">{message}</p>
      <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
        Back to login
      </Button>
    </div>
  );
};
