import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { AnimateBackground } from "../AnimateBackground";

/** Full-page error card for the consent flow; `children` is an optional action below the message. */
export const OAuthErrorState: React.FC<{
  iconClassName: string;
  title: string;
  message: string;
  children?: React.ReactNode;
}> = ({ iconClassName, title, message, children }) => (
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
