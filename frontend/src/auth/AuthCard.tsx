import React from "react";
import {
  AUTH_GLASS_CARD,
  AUTH_V2_CARD,
  AUTH_V2_H1,
  AUTH_V2_SUBTITLE,
  AUTH_V2_WRAP,
  shakeClass,
} from "./authCardClass";

/** v1 glass card for the token / email auth screens; `shake` plays the error wobble. */
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

/**
 * ui-v2-switch: v2 auth page shell. Heading and subtitle sit above the card
 * (no brand lockup, no wallet fan). `bare` skips the card for states that
 * bring their own surface (e.g. AuthErrorCard).
 */
export const AuthV2Page: React.FC<{
  shake?: boolean;
  title?: string;
  subtitle?: React.ReactNode;
  bare?: boolean;
  children: React.ReactNode;
}> = ({ shake = false, title, subtitle, bare = false, children }) => (
  <div className={`relative z-10 ${AUTH_V2_WRAP}`}>
    {title && <h1 className={AUTH_V2_H1}>{title}</h1>}
    {subtitle && <p className={AUTH_V2_SUBTITLE}>{subtitle}</p>}
    {bare ? (
      children
    ) : (
      <div className={`${AUTH_V2_CARD} ${shakeClass(shake)}`}>{children}</div>
    )}
  </div>
);
