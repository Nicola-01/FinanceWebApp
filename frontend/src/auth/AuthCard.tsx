import React from "react";
import { AUTH_GLASS_CARD, shakeClass } from "./authCardClass";
import { useUiVersion } from "../hooks/useUiVersion";

/** v2 auth card surface (theme-aware); LoginForm adds its own flow gap. */
export const AUTH_CARD_V2 =
  "flex w-full max-w-[400px] flex-col rounded-[var(--r-card)] bg-app-card p-6 shadow-[var(--box-ring)] sm:p-8";

/** Standalone glass card for the token / email auth screens; `shake` plays the error wobble. */
export const AuthCard: React.FC<{
  shake: boolean;
  children: React.ReactNode;
}> = ({ shake, children }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch
  return ui === "v2" ? (
    <div className={`${AUTH_CARD_V2} gap-6 ${shakeClass(shake)}`}>
      {children}
    </div>
  ) : (
    <div
      className={`relative z-10 flex w-full max-w-[400px] flex-col ${AUTH_GLASS_CARD} ${shakeClass(shake)}`}
    >
      {children}
    </div>
  );
};
