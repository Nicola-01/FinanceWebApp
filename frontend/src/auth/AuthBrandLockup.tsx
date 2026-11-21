import React from "react";
import { useUiVersion } from "../hooks/useUiVersion";

export const AuthBrandLockup: React.FC = () => {
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 drops the drop-shadow and the bottom margin (the card gap spaces it).
  if (ui === "v2") {
    return (
      <div className="flex items-center gap-2.5">
        <img
          src="/icon.svg"
          alt="My Wallet"
          className="h-9 w-9 object-contain"
        />
        <span className="font-display text-lg font-semibold text-app-text">
          My Wallet
        </span>
      </div>
    );
  }
  return (
    <div className="mb-6 flex items-center gap-2.5">
      <img
        src="/icon.svg"
        alt="Finance"
        className="h-11 w-11 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
      />
      <span className="text-xl font-bold tracking-tight text-app-text">
        Finance
      </span>
    </div>
  );
};

/** Auth page title. v1 carries its own margin; v2 relies on the card gap. */
export const AuthHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch
  return ui === "v2" ? (
    <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
      {children}
    </h1>
  ) : (
    <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
      {children}
    </h1>
  );
};

/** Auth subtitle. `className` is the v1 spacing (v2 ignores it). */
export const AuthSubtitle: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "mb-7", children }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: -mt-3 pulls the subtitle under the title, the card gap is 24px.
  return ui === "v2" ? (
    <p className="-mt-3 text-[13px] text-app-muted">{children}</p>
  ) : (
    <p className={`${className} text-sm text-app-muted`}>{children}</p>
  );
};
