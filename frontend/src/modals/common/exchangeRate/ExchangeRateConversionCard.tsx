import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightLong,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { CurrencyCode } from "../../../utils/currencies";

const HIDE_SPINNERS =
  "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface ExchangeRateConversionCardProps {
  isViewOnly: boolean;
  baseCurrency: CurrencyCode;
  selectedCurrency: CurrencyCode;
  originalAmount: number | string;
  exchangeRate: number | string;
  convertedAmount: number | string;
  accentColor: string;
  loadingRate: boolean;
  autoRate: string | null;
  autoRateDate: string | null;
  onOriginalChange: (val: string) => void;
  onRateChange: (val: string) => void;
  onConvertedChange: (val: string) => void;
  onRestoreAutoRate: () => void;
}

/** Original → rate → converted card, plus the auto-rate footnote below it. */
export const ExchangeRateConversionCard: React.FC<
  ExchangeRateConversionCardProps
> = ({
  isViewOnly,
  baseCurrency,
  selectedCurrency,
  originalAmount,
  exchangeRate,
  convertedAmount,
  accentColor,
  loadingRate,
  autoRate,
  autoRateDate,
  onOriginalChange,
  onRateChange,
  onConvertedChange,
  onRestoreAutoRate,
}) => {
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
  return (
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
                onChange={(e) => onOriginalChange(e.target.value)}
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
                  onChange={(e) => onRateChange(e.target.value)}
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
                onChange={(e) => onConvertedChange(e.target.value)}
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
              onClick={onRestoreAutoRate}
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
};
