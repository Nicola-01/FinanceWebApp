import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { getPasswordRequirements } from "./passwordRequirements";
import { useUiVersion } from "../../hooks/useUiVersion";

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  confirmPassword,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: status colours from the v2 tokens; no uppercase/mono styling.
  const v2 = ui === "v2";
  const requirements = getPasswordRequirements(password, confirmPassword);

  return (
    <div className="mb-5 rounded-lg border border-app-border bg-app-input p-[15px] text-left w-full shadow-inner">
      <h4 className="ml-1 mb-2 block text-[0.85rem] font-medium text-app-muted text-left">
        Password Requirements:
      </h4>
      {requirements.map((req) => {
        const isMet = req.test();
        // Pending = nothing typed yet; failed = typed but not satisfied (v2 only).
        const pending = password === "";

        if (v2) {
          const tone = isMet
            ? "text-app-income opacity-40 line-through"
            : pending
              ? "text-app-muted"
              : "text-app-danger";
          return (
            <div
              key={req.label}
              className={`mb-2 flex items-center gap-2.5 text-[13px] transition-all duration-300 last:mb-0 ${tone}`}
            >
              <FontAwesomeIcon icon={isMet ? faCheck : faTimes} />
              <span>{req.label}</span>
            </div>
          );
        }

        return (
          <div
            key={req.label}
            className={`mb-2 flex items-center gap-2.5 text-[0.85rem] transition-all duration-300 last:mb-0 ${
              isMet ? "text-app-green opacity-40 line-through" : "text-app-text"
            }`}
          >
            <FontAwesomeIcon
              icon={isMet ? faCheck : faTimes}
              className={!isMet ? "text-app-muted" : ""}
            />
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
};
