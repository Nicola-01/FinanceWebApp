import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightLong,
  faCalendarDay,
  faCoins,
  faLock,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { CurrencySelector } from "../../components/selectors/CurrencySelector";
import {
  type CurrencyCode,
  getPreferredForeignCurrency,
  setPreferredForeignCurrency,
} from "../../utils/currencies";
import { getExchangeRate } from "../../utils/exchangeRates";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import Toggle from "../../components/ui/Toggle.tsx";
import { Selector } from "../../components/ui/Selector.tsx";

export interface UnifiedExchangeRateProps {
  mode: "view" | "edit" | "create";
  baseCurrency: CurrencyCode;
  selectedCurrency: CurrencyCode;
  onCurrencyChange?: (currency: CurrencyCode) => void;

  originalAmount: number | string;
  onOriginalAmountChange?: (amount: string) => void;

  exchangeRate: number | string;
  onExchangeRateChange?: (rate: string) => void;

  convertedAmount: number | string;
  onConvertedAmountChange?: (amount: string) => void;

  /** Per-wallet accent for the toggle / converted value; falls back to the brand. */
  accentColor?: string;

  /**
   * Recurring rate mode (subscriptions only). When these are provided, a
   * "Fixed rate / Day's rate" control is shown: `true` = each future payment
   * converts with the exchange rate of its own day; `false` = the fixed rate.
   */
  autoExchangeRate?: boolean;
  onAutoExchangeRateChange?: (value: boolean) => void;

  /** Wallet id — keys the per-wallet "default foreign currency" (star). */
  walletId?: string;
}

const HIDE_SPINNERS =
  "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const ExchangeRateSection: React.FC<UnifiedExchangeRateProps> = ({
  mode,
  baseCurrency,
  selectedCurrency,
  onCurrencyChange,
  originalAmount,
  onOriginalAmountChange,
  exchangeRate,
  onExchangeRateChange,
  convertedAmount,
  onConvertedAmountChange,
  accentColor = "var(--brand-2)",
  autoExchangeRate,
  onAutoExchangeRateChange,
  walletId,
}) => {
  const isViewOnly = mode === "view";

  // Open the toggle if we're editing something already in a foreign currency.
  const [isForeignCurrency, setIsForeignCurrency] = useState(
    mode === "create" ? false : selectedCurrency !== baseCurrency,
  );
  const [loadingRate, setLoadingRate] = useState(false);
  // Last rate we auto-fetched (+ its "as of" date). Kept so the restore button
  // can put it back after the user manually tweaks the rate — no new API call.
  const [autoRate, setAutoRate] = useState<string | null>(null);
  const [autoRateDate, setAutoRateDate] = useState<string | null>(null);

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

  // Fetch the rate on currency/toggle change. Cached once per day per pair
  // (Frankfurter v2 — rates are daily); see utils/exchangeRates.
  useEffect(() => {
    const loadRate = async () => {
      if (isViewOnly || selectedCurrency === baseCurrency || !isForeignCurrency)
        return;

      setLoadingRate(true);
      try {
        const fx = await getExchangeRate(selectedCurrency, baseCurrency);
        if (fx) {
          const rateStr = fx.rate.toString();
          onExchangeRateChange?.(rateStr);
          setAutoRate(rateStr);
          setAutoRateDate(fx.date ?? null);

          if (originalAmount) {
            const newTotal = (Number(originalAmount) * fx.rate).toFixed(2);
            onConvertedAmountChange?.(newTotal);
          }
        } else {
          triggerToast("Could not retrieve exchange rate.", false);
        }
      } catch (error) {
        console.error("Frankfurter API Error:", error);
        triggerToast("Error fetching exchange rate.", false);
      } finally {
        setLoadingRate(false);
      }
    };

    loadRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, isForeignCurrency, isViewOnly]);

  const handleToggle = () => {
    if (isViewOnly) return;
    const newValue = !isForeignCurrency;
    setIsForeignCurrency(newValue);

    if (newValue) {
      // Switching on: preset the starred default currency (if set and not the
      // base). The rate is then fetched by the effect that watches
      // selectedCurrency / isForeignCurrency.
      const preferred = getPreferredForeignCurrency(walletId);
      const preset =
        preferred && preferred !== baseCurrency ? preferred : baseCurrency;
      if (preset !== selectedCurrency) {
        onCurrencyChange?.(preset as CurrencyCode);
      }
    } else {
      // Switching off resets everything back to the base currency.
      onCurrencyChange?.(baseCurrency);
      onExchangeRateChange?.("1");
      onOriginalAmountChange?.(convertedAmount.toString());
      setAutoRate(null);
      setAutoRateDate(null);
    }
  };

  // --- 3-way binding: original ↔ rate ↔ converted ---
  const handleOriginalChange = (val: string) => {
    onOriginalAmountChange?.(val);
    if (val && exchangeRate) {
      onConvertedAmountChange?.(
        (Number(val) * Number(exchangeRate)).toFixed(2),
      );
    }
  };

  const handleRateChange = (val: string) => {
    onExchangeRateChange?.(val);
    if (val && originalAmount) {
      onConvertedAmountChange?.(
        (Number(originalAmount) * Number(val)).toFixed(2),
      );
    }
  };

  const handleConvertedChange = (val: string) => {
    onConvertedAmountChange?.(val);
    if (val && originalAmount && Number(originalAmount) > 0) {
      const newRate = Number(val) / Number(originalAmount);
      onExchangeRateChange?.(newRate.toFixed(6).replace(/\.?0+$/, ""));
    }
  };

  // Restore the previously auto-fetched rate (does NOT hit the API).
  const restoreAutoRate = () => {
    if (autoRate == null) return;
    onExchangeRateChange?.(autoRate);
    if (originalAmount) {
      onConvertedAmountChange?.(
        (Number(originalAmount) * Number(autoRate)).toFixed(2),
      );
    }
  };

  // View mode with no currency difference → nothing to show.
  if (isViewOnly && selectedCurrency === baseCurrency) {
    return null;
  }

  const rateStr = String(exchangeRate);
  const hasAuto = autoRate !== null;
  const isRateSynced = hasAuto && rateStr === autoRate;
  const canReset = !isViewOnly && hasAuto && rateStr !== autoRate;
  const rateDisplay = Number(exchangeRate)
    .toFixed(6)
    .replace(/\.?0+$/, "");
  const autoDateFmt = autoRateDate
    ? new Date(autoRateDate).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const hasFootnote =
    loadingRate || canReset || (isRateSynced && autoDateFmt !== null);

  // The card holds amounts + rate; the footnote lives OUTSIDE it, below-right.
  const conversionBody = (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-xl border border-app-border bg-app-surface/40 p-4">
        <div className="flex items-center gap-2">
          {/* Original amount + currency (pushed to the left) */}
          <div className="flex min-w-0 flex-1 items-baseline justify-start gap-1.5">
            {isViewOnly ? (
              <span className="truncate font-app-mono text-xl font-bold text-app-text">
                {Number(originalAmount).toFixed(2)}
              </span>
            ) : (
              <input
                type="number"
                step="0.01"
                min="0"
                aria-label="Original amount"
                value={originalAmount}
                onChange={(e) => handleOriginalChange(e.target.value)}
                placeholder="0.00"
                className={`min-w-[2ch] max-w-full bg-transparent font-app-mono text-xl font-bold text-app-text outline-none [field-sizing:content] placeholder:text-app-muted/40 ${HIDE_SPINNERS}`}
              />
            )}
            <span className="shrink-0 text-sm font-bold uppercase tracking-wide text-app-muted">
              {selectedCurrency}
            </span>
          </div>

          {/* Center: long arrow with the rate + * underneath (auto-width, centred) */}
          <div className="flex shrink-0 flex-col items-center gap-1 px-2">
            <FontAwesomeIcon
              icon={faArrowRightLong}
              className="text-base"
              style={{ color: accentColor }}
            />
            <span className="inline-flex items-start">
              {isViewOnly ? (
                <span className="font-app-mono text-xs text-app-muted">
                  {rateDisplay}
                </span>
              ) : (
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  aria-label="Exchange rate"
                  value={exchangeRate}
                  onChange={(e) => handleRateChange(e.target.value)}
                  placeholder="1.00"
                  className={`min-w-[3ch] max-w-[9rem] bg-transparent text-center font-app-mono text-xs text-app-muted outline-none [field-sizing:content] focus:text-app-text ${HIDE_SPINNERS}`}
                />
              )}
              {hasAuto && (
                <span
                  className="text-[10px] leading-none text-app-muted"
                  title={
                    autoDateFmt
                      ? `Rate from the exchange on ${autoDateFmt}`
                      : "Auto-fetched rate"
                  }
                >
                  *
                </span>
              )}
            </span>
          </div>

          {/* Converted amount + base currency (pushed to the right) */}
          <div className="flex min-w-0 flex-1 items-baseline justify-end gap-1.5">
            {isViewOnly ? (
              <span
                className="truncate font-app-mono text-xl font-bold"
                style={{ color: accentColor }}
              >
                {Number(convertedAmount).toFixed(2)}
              </span>
            ) : (
              <input
                type="number"
                step="0.01"
                min="0"
                aria-label="Converted amount"
                value={convertedAmount}
                onChange={(e) => handleConvertedChange(e.target.value)}
                placeholder="0.00"
                style={{ color: accentColor }}
                className={`min-w-[2ch] max-w-full bg-transparent text-right font-app-mono text-xl font-bold outline-none [field-sizing:content] ${HIDE_SPINNERS}`}
              />
            )}
            <span className="shrink-0 text-sm font-bold uppercase tracking-wide text-app-muted">
              {baseCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Footnote (outside the card): grey "* Exchange on …", or a more
          prominent "* Restore …" button once the rate is manually changed. */}
      {hasFootnote && (
        <div className="flex items-center justify-end gap-1 px-1 text-[11px]">
          <span className="text-app-muted">*</span>
          {loadingRate ? (
            <span className="animate-pulse text-app-muted">Fetching…</span>
          ) : canReset ? (
            <button
              type="button"
              onClick={restoreAutoRate}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-app-text transition-colors hover:bg-app-input"
              title="Restore the auto-fetched rate"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" />
              Restore {autoRate}
              {autoDateFmt ? ` of ${autoDateFmt}` : ""}
            </button>
          ) : (
            <span className="text-app-muted">Exchange on {autoDateFmt}</span>
          )}
        </div>
      )}
    </div>
  );

  // View mode: just the read-only conversion card (no toggle wrapper).
  if (isViewOnly) {
    return conversionBody;
  }

  // Edit / create: collapsible card gated by the foreign-currency toggle.
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
          onChange={() => handleToggle()}
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
          {conversionBody}

          {/* Recurring rate mode — subscriptions only. */}
          {onAutoExchangeRateChange && (
            <div>
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                Rate for future payments
              </label>
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
