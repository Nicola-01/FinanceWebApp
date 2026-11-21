import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useUiVersion } from "../../hooks/useUiVersion";
import { FormRow } from "../../components/ui/FormRow";

/** Label (icon + caps text) on the left, value / actions on the right. */
export const AccountRow: React.FC<{
  label: string;
  icon: IconDefinition;
  children: React.ReactNode;
}> = ({ label, icon, children }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 rows are the shared FormRow (icon chip + label + control).
  if (ui === "v2") {
    return (
      <FormRow icon={icon} label={label}>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {children}
        </div>
      </FormRow>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 bg-app-input px-4 py-3">
      <div className="flex shrink-0 items-center gap-3 text-app-muted">
        <FontAwesomeIcon icon={icon} className="w-4" />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
};
