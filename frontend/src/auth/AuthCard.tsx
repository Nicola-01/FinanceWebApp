import React from "react";
import { AUTH_GLASS_CARD, shakeClass } from "./authCardClass";

/** Standalone glass card for the token / email auth screens; `shake` plays the error wobble. */
export const AuthCard: React.FC<{
  shake: boolean;
  children: React.ReactNode;
}> = ({ shake, children }) => (
  <div
    className={`relative z-10 flex w-full max-w-[400px] flex-col ${AUTH_GLASS_CARD} ${shakeClass(shake)}`}
  >
    {children}
  </div>
);
