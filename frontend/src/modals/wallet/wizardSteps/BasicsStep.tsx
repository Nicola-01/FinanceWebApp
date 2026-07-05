import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../../components/ui/Input";
import { IconColorSelector } from "../../../components/icon/IconColorSelector";
import { CurrencySelector } from "../../../components/selectors/CurrencySelector";
import { ICONS, type IconKey } from "../../../utils/icons";
import { WizardStepHeader } from "./WizardStepHeader";

export interface WalletBasicsValue {
  name: string;
  icon: string;
  color: string;
  currency: string;
}

export interface BasicsStepProps {
  value: WalletBasicsValue;
  onChange: (next: WalletBasicsValue) => void;
}

/**
 * Wizard step 1 — wallet basics (name, icon/colour, currency). Controlled: the
 * parent owns the value and computes step completeness (name length 3–25). Same
 * building blocks as the legacy CreateWalletModal so the look is unchanged.
 */
export function BasicsStep({ value, onChange }: BasicsStepProps) {
  const [showSelectors, setShowSelectors] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Close the icon/colour popover on an outside click.
  useEffect(() => {
    if (!showSelectors) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || selectorRef.current?.contains(t))
        return;
      setShowSelectors(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showSelectors]);

  const set = (patch: Partial<WalletBasicsValue>) =>
    onChange({ ...value, ...patch });

  const iconKey: IconKey =
    value.icon in ICONS ? (value.icon as IconKey) : "wallet";

  return (
    <div className="space-y-5 text-left">
      <WizardStepHeader
        icon={faWallet}
        title="Wallet basics"
        subtitle="Name it and pick an icon, colour and currency."
      />

      {/* Live icon preview + icon/colour popover */}
      <div className="relative mb-6 flex flex-col items-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowSelectors((s) => !s)}
          className="group flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-app-border bg-app-input text-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-app-surface"
          style={{ color: value.color }}
          title="Change Icon or Color"
        >
          <FontAwesomeIcon icon={ICONS[iconKey]} />
        </button>
        <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-app-muted">
          Click icon to edit
        </span>

        {showSelectors && (
          <div
            ref={selectorRef}
            className="absolute left-1/2 top-24 z-50 -translate-x-1/2"
          >
            <IconColorSelector
              iconValue={iconKey}
              onChangeIcon={(k) => set({ icon: k })}
              colorValue={value.color}
              onChangeColor={(c) => set({ color: c })}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
          Wallet Name
        </label>
        <Input
          type="text"
          placeholder="e.g. Personal Savings"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <CurrencySelector
        value={value.currency}
        onChange={(c) => set({ currency: c })}
      />
    </div>
  );
}

export default BasicsStep;
