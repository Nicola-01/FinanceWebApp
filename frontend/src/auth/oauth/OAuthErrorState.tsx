import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { AnimateBackground } from "../AnimateBackground";
import { useUiVersion } from "../../hooks/useUiVersion";

/** Full-page error card for the consent flow; `children` is an optional action below the message. */
export const OAuthErrorState: React.FC<{
  iconClassName: string;
  title: string;
  message: string;
  children?: React.ReactNode;
}> = ({ iconClassName, title, message, children }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: no sphere background; a flat card on the page colour.
  if (ui === "v2")
    return (
      <div className="grid min-h-dvh place-items-center bg-app-bg px-4 py-10">
        <div className="w-full max-w-[400px] rounded-[var(--r-card)] bg-app-card p-6 text-center shadow-[var(--box-ring)] sm:p-8">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className={`mb-4 text-4xl ${iconClassName}`}
          />
          <h2 className="mb-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
            {title}
          </h2>
          <p
            className={
              children
                ? "mb-6 text-[13px] text-app-muted"
                : "text-[13px] text-app-muted"
            }
          >
            {message}
          </p>
          {children}
        </div>
      </div>
    );
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4">
      <AnimateBackground />
      <div className="relative z-10 w-full max-w-[480px] rounded-[var(--r-card)] border border-app-border bg-app-surface/40 p-8 text-center shadow-2xl backdrop-blur-[20px]">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className={`mb-4 text-4xl ${iconClassName}`}
        />
        <h2 className="mb-2 text-xl font-bold text-app-text">{title}</h2>
        <p
          className={
            children ? "mb-6 text-sm text-app-muted" : "text-sm text-app-muted"
          }
        >
          {message}
        </p>
        {children}
      </div>
    </div>
  );
};
