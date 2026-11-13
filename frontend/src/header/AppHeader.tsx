import React from "react";
import { HeaderActions } from "./HeaderActions.tsx";
import { OfflineBanner } from "../components/ui/OfflineBanner.tsx";

interface AppHeaderProps {
  page: {
    text: string;
    accent: string;
  };
  /** Selected wallet's colour, used to tint wallet-agnostic panels (notification center). */
  accentColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ page, accentColor }) => {
  return (
    <>
      <header className="top-0 z-[120] flex h-16 w-full items-center justify-between gap-3 border-b border-app-border bg-app-bg/80 px-4 backdrop-blur-md sm:px-6">
        {/* Logo & app name */}
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/icon.svg"
            alt="Finance App Logo"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <h2 className="m-0 truncate text-2xl font-bold capitalize tracking-wide text-app-text">
            {page.text}
            <span className="ml-1 bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
              {page.accent}
            </span>
          </h2>
        </div>

        {/* Right cluster: sync badge + notifications + user dropdown. */}
        <HeaderActions accentColor={accentColor} />
      </header>

      <OfflineBanner />
    </>
  );
};
