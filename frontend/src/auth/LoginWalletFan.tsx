import React from "react";

/** Three fanned wallet cards above the login heading. Decorative only. Mirrors WalletHeroCard's cat corner. */
const WALLETS = [
  {
    name: "Holiday fund",
    amount: "€ 2.410,00",
    className:
      "z-[1] translate-x-[-92px] rotate-[-9deg] bg-[#2d4f8a] max-sm:translate-x-[-62px]",
  },
  {
    name: "Car",
    amount: "€ 640,00",
    className:
      "z-[2] translate-x-[-38px] rotate-[-3deg] bg-[#8f4a7a] max-sm:translate-x-[-26px]",
  },
  {
    name: "Household",
    amount: "€ 1.284,50",
    className:
      "z-[3] translate-x-[16px] rotate-[2deg] bg-[#2f6f5e] max-sm:translate-x-[10px]",
  },
];

export const LoginWalletFan: React.FC = () => (
  <div
    aria-hidden="true"
    className="relative mt-3 h-[130px] w-[420px] max-w-full shrink-0 max-sm:h-[72px] max-sm:w-[300px]"
  >
    {WALLETS.map((wallet) => (
      <div
        key={wallet.name}
        className={`absolute top-1 left-1/2 -ml-[105px] flex h-[118px] w-[210px] origin-bottom flex-col justify-between overflow-hidden rounded-[var(--r-hero)] px-[18px] py-4 text-white shadow-[0_0_0_1px_rgb(255_255_255/0.08)] max-sm:top-0.5 max-sm:-ml-[62px] max-sm:h-[70px] max-sm:w-[124px] max-sm:px-3 max-sm:py-2.5 ${wallet.className}`}
      >
        <img
          src="/hero-cat.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-[10px] -bottom-[12px] w-[84px] -rotate-[8deg] opacity-90 max-sm:-right-[6px] max-sm:-bottom-[8px] max-sm:w-[50px]"
        />
        <span className="relative font-display text-sm leading-[1.1] font-bold max-sm:text-xs">
          {wallet.name}
        </span>
        <span className="relative font-display text-[22px] leading-none font-bold tracking-[-0.03em] max-sm:text-base">
          {wallet.amount}
        </span>
      </div>
    ))}
  </div>
);

export default LoginWalletFan;
