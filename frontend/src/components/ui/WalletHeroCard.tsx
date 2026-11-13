import type React from "react";
import { walletVars } from "../../utils/color.ts";
import { Icon } from "../icon/Icon.tsx";
import { AnimatedNumber, type AnimatedNumberProps } from "./AnimatedNumber.tsx";

/** Large wallet card: the wallet colour as a solid surface with the fox emblem. */
export const WalletHeroCard: React.FC<{
  /** Omitted when the page title already names the wallet (D13). */
  name?: string;
  color: string;
  meta?: React.ReactNode;
  /** Wallet icon key (`wallet.icon`), shown before the name. */
  icon?: string;
  label: string;
  /** A number is animated via AnimatedNumber (kind/currency/signed apply); other nodes render as given. */
  value: number | React.ReactNode;
  kind?: AnimatedNumberProps["kind"];
  currency?: string;
  signed?: boolean;
  compact?: boolean;
  className?: string;
}> = ({
  name,
  color,
  meta,
  icon,
  label,
  value,
  kind,
  currency,
  signed,
  compact = false,
  className,
}) => (
  <section
    aria-label={name ?? label}
    style={walletVars(color)}
    className={[
      "relative flex flex-col justify-between gap-[22px] overflow-hidden rounded-[var(--r-hero)] px-6 py-[22px] bg-wallet text-on-wallet",
      compact ? "min-h-[180px]" : "min-h-[196px]",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <img
      src="/icon.svg"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[22px] -right-[18px] w-[150px] -rotate-[8deg] opacity-90"
    />
    {name ? (
      <div className="relative">
        <h2 className="flex items-center gap-2.5 font-display text-[30px] leading-[1.1] font-bold tracking-[-0.02em]">
          {icon ? <Icon icon={icon} className="text-[22px]" /> : null}
          {name}
        </h2>
        {meta ? (
          <div className="mt-1 text-[13px] opacity-70">{meta}</div>
        ) : null}
      </div>
    ) : null}
    <div className="relative">
      <div className="text-[13px] opacity-70">{label}</div>
      <div
        className={[
          "mt-1 font-display leading-none font-bold tracking-[-0.03em]",
          compact ? "text-[34px]" : "text-[46px] max-sm:text-[36px]",
        ].join(" ")}
      >
        {typeof value === "number" ? (
          <AnimatedNumber
            value={value}
            kind={kind}
            currency={currency}
            signed={signed}
            intro
          />
        ) : (
          value
        )}
      </div>
    </div>
  </section>
);
