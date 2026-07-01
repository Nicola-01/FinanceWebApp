import React, { type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface SettingsCardProps {
  title: string;
  icon: IconDefinition;
  iconColor?: string;
  description?: ReactNode;
  subtitle?: string;
  danger?: boolean;
  children?: ReactNode;
  headerCentered?: boolean;
  actionText?: string;
  actionIcon?: IconDefinition;
  actionColor?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  isActionLoading?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  icon,
  iconColor = "white",
  description,
  subtitle,
  danger,
  children,
  headerCentered,
  actionText,
  actionIcon,
  actionColor,
  onAction,
  actionDisabled,
  isActionLoading,
}) => {
  return (
    <div
      className={`flex flex-col gap-4 sm:gap-6 border rounded-2xl p-5 sm:p-6 backdrop-blur-md relative overflow-hidden group shrink-0 ${danger ? "theme-bg-danger-transparent theme-border-danger-light" : "bg-app-input border-app-border"}`}
    >
      {danger && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 theme-bg-danger-transparent rounded-full blur-3xl transition-all group-hover:theme-bg-danger-light pointer-events-none"></div>
      )}

      <div
        className={`flex flex-col gap-1 relative z-10 border-b pb-3 sm:pb-4 ${danger ? "theme-border-danger-light" : "border-app-border"}`}
      >
        <div
          className={`flex items-center gap-3 ${headerCentered ? "justify-center sm:justify-start" : ""}`}
        >
          <FontAwesomeIcon
            icon={icon}
            className={`text-xl ${danger ? "theme-text-danger" : ""}`}
            style={!danger ? { color: iconColor } : {}}
          />
          <h2
            className={`text-xl font-bold ${danger ? "theme-text-danger" : "text-app-text"}`}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p
            className={`text-sm mt-1 ${headerCentered ? "text-center sm:text-left" : ""} ${danger ? "theme-text-danger-muted" : "text-app-muted"}`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {description && (
        <div
          className={`relative z-10 text-sm ${danger ? "theme-text-danger" : "text-app-muted"} ${headerCentered ? "text-center" : ""}`}
        >
          {description}
        </div>
      )}

      {children && <div className="relative z-10">{children}</div>}

      {actionText && onAction && (
        <div
          className={`relative z-10 flex pt-4 sm:pt-5 mt-1 sm:mt-2 border-t ${danger ? "theme-border-danger-light" : "border-app-border"} justify-center w-full`}
        >
          <button
            onClick={onAction}
            disabled={actionDisabled || isActionLoading}
            className={`flex justify-center items-center gap-2 h-[48px] px-10 rounded-xl font-bold transition-all disabled:opacity-50 text-sm w-full sm:w-60 ${
              danger
                ? "theme-bg-danger-transparent theme-text-danger border theme-border-danger-light hover:theme-bg-danger hover:theme-text-default disabled:hover:theme-bg-danger-transparent disabled:hover:theme-text-danger"
                : "theme-text-inverse hover:-translate-y-0.5 disabled:hover:translate-y-0 shadow-[0_4px_15px_-5px_rgba(255,255,255,0.4)]"
            }`}
            style={
              !danger && actionColor
                ? {
                    backgroundColor: actionColor,
                    boxShadow: `0 4px 15px -5px ${actionColor}66`,
                  }
                : {}
            }
          >
            {isActionLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
            ) : actionIcon ? (
              <>
                <FontAwesomeIcon
                  icon={actionIcon}
                  className={danger ? "" : "text-lg"}
                />{" "}
                {actionText}
              </>
            ) : (
              actionText
            )}
          </button>
        </div>
      )}
    </div>
  );
};
