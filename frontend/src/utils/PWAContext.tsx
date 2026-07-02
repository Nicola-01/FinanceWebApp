import { createContext, useContext } from "react";
import type { BeforeInstallPromptEvent } from "../types/pwa";

export interface PWAContextType {
  installPrompt: BeforeInstallPromptEvent | null;
  installApp: () => Promise<void>;
}

export const PWAContext = createContext<PWAContextType>({
  installPrompt: null,
  installApp: async () => {},
});

export const usePWA = () => useContext(PWAContext);
