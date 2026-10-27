import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDay,
  faCoins,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { CurrencySelector } from "../../../components/selectors/CurrencySelector";
import {
  type CurrencyCode,
  getPreferredForeignCurrency,
  setPreferredForeignCurrency,
} from "../../../utils/currencies";
import Toggle from "../../../components/ui/Toggle.tsx";
import { Selector } from "../../../components/ui/Selector.tsx";
import { FieldLabel } from "../../../components/ui/FieldLabel";

interface ForeignCurrencyToggleCardProps {
  isForeignCurrency: boolean;
  onToggle: () => void;
  baseCurrency: CurrencyCode;
  selectedCurrency: CurrencyCode;
  onCurrencyChange?: (currency: CurrencyCode) => void;
  accentColor: string;
  autoExchangeRate?: boolean;
  onAutoExchangeRateChange?: (value: boolean) => void;
  walletId?: string;
  /** The conversion card, shown below the currency selector when expanded. */
  children: React.ReactNode;
}

/** Edit/create wrapper: "Different currency?" toggle that reveals the FX controls. */
export const ForeignCurrencyToggleCard: React.FC<
  ForeignCurrencyToggleCardProps
> = ({
  isForeignCurrency,
  onToggle,
  baseCurrency,
  selectedCurrency,
  onCurrencyChange,
  accentColor,
  autoExchangeRate,
  onAutoExchangeRateChange,
  walletId,
  children,
}) => {
  // The wallet's starred default foreign currency (localStorage-backed). Read
  // fresh each render (cheap, and reflects a wallet switch automatically); a
  // dummy state bump re-renders after the user stars/un-stars from the selector.
  const [, bumpStar] = useState(0);
  const starredCurrency = getPreferredForeignCurrency(walletId);
  const handleToggleStar = (code: string) => {
    const next = starredCurrency === code ? null : code;
    setPreferredForeignCurrency(walletId, next);
    bumpStar((n) => n + 1);
  };

  return (
    <div className="rounded-xl border border-app-border bg-app-input p-4 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-surface text-app-muted transition-colors"
            style={
              isForeignCurrency
                ? {
                    color: accentColor,
                    backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  }
                : undefined
            }
          >
            <FontAwesomeIcon icon={faCoins} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-app-text">
              Different currency?
            </h4>
            <p className="text-xs text-app-muted">
              Record this in another currency
            </p>
          </div>
        </div>

        <Toggle
          checked={isForeignCurrency}
          onChange={() => onToggle()}
          accentColor={accentColor}
          aria-label="Foreign currency"
        />
      </div>

      {isForeignCurrency && (
        <div className="mt-4 space-y-4 border-t border-app-border pt-4 animate-[fadeIn_0.2s_ease-out]">
          <CurrencySelector
            value={selectedCurrency}
            onChange={(val: CurrencyCode) => onCurrencyChange?.(val)}
            excludeCurrency={baseCurrency}
            accentColor={accentColor}
            starredCurrency={starredCurrency ?? undefined}
            onToggleStar={handleToggleStar}
          />
          {children}

          {/* Recurring rate mode — subscriptions only. */}
          {onAutoExchangeRateChange && (
            <div>
              <FieldLabel>Rate for future payments</FieldLabel>
              <Selector
                size="sm"
                value={autoExchangeRate ? "auto" : "fixed"}
                onChange={(v) => onAutoExchangeRateChange(v === "auto")}
                options={[
                  {
                    value: "fixed",
                    label: "Fixed rate",
                    icon: <FontAwesomeIcon icon={faLock} />,
                    activeColorClass: "text-app-text",
                  },
                  {
                    value: "auto",
                    label: "Day's rate",
                    icon: <FontAwesomeIcon icon={faCalendarDay} />,
                    activeColorClass: "text-app-text",
                  },
                ]}
              />
              <p className="ml-1 mt-1.5 text-xs text-app-muted">
                {autoExchangeRate
                  ? "Each payment converts with the exchange rate of its own day."
                  : "Every payment uses the fixed rate above."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
