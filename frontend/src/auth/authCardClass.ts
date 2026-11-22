/** Glass surface shared by every auth-screen card (screens are always dark). */
export const AUTH_GLASS_CARD =
  "rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-7 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9";

/** v2 auth page: the heading and subtitle sit above the card, which is capped at 480px. */
export const AUTH_V2_WRAP = "flex w-full max-w-[480px] flex-col items-center";
export const AUTH_V2_H1 =
  "text-center font-display text-[30px] leading-none font-bold tracking-[-0.04em] text-app-text sm:text-[60px]";
export const AUTH_V2_SUBTITLE =
  "mt-2 text-center text-sm text-app-muted sm:mt-3 sm:text-base";
export const AUTH_V2_CARD =
  "mt-5 flex w-full flex-col gap-3.5 rounded-[var(--r-card)] bg-app-card px-[22px] pt-6 pb-[22px] shadow-[var(--box-ring)] sm:mt-[30px] sm:gap-4 sm:px-[34px] sm:pt-[30px] sm:pb-[28px] [&>div]:mb-0";

export const shakeClass = (shake: boolean) =>
  shake ? "animate-[shake_0.5s_ease-in-out]" : "";
