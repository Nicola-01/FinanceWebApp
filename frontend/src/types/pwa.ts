/**
 * Type for the non-standard Chromium `beforeinstallprompt` event and the
 * global slot (`window._pwaInstallPrompt`) we use to capture it before React
 * mounts. Keeps PWA install code free of `any`.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    _pwaInstallPrompt: BeforeInstallPromptEvent | null;
  }
}
