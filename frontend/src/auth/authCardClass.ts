/** Glass surface shared by every auth-screen card (screens are always dark). */
export const AUTH_GLASS_CARD =
  "rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-7 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9";

export const shakeClass = (shake: boolean) =>
  shake ? "animate-[shake_0.5s_ease-in-out]" : "";
