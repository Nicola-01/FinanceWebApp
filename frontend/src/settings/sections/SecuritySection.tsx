import React from "react";
import { ChangePasswordCard } from "../security/ChangePasswordCard";
import { MfaMethods } from "../security/MfaMethods";
import { SignOutEverywhereCard } from "../security/SignOutEverywhereCard";

interface SecuritySectionProps {
  /** Forced (mustChangePWD) mode: show a blocking banner on the password card. */
  forced?: boolean;
  /** Called after a successful password change (clears the forced state). */
  onPasswordChanged?: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  forced = false,
  onPasswordChanged,
}) => (
  <div className="flex flex-col gap-6">
    <ChangePasswordCard forced={forced} onPasswordChanged={onPasswordChanged} />
    <MfaMethods />
    <SignOutEverywhereCard />
  </div>
);
