import React, { useEffect, useState } from "react";
import type { BeforeInstallPromptEvent } from "../types/pwa";
import { PWAContext } from "./PWAContext";

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Lazy init: pick up the event if it fired before React mounted this component
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(
      () => window._pwaInstallPrompt ?? null,
    );

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      window._pwaInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  return (
    <PWAContext.Provider value={{ installPrompt, installApp }}>
      {children}
    </PWAContext.Provider>
  );
};
