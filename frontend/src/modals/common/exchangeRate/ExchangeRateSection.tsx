import React from "react";
import type { CurrencyCode } from "../../../utils/currencies";
import { useExchangeRate } from "./useExchangeRate";
import { ExchangeRateConversionCard } from "./ExchangeRateConversionCard";
import { ForeignCurrencyToggleCard } from "./ForeignCurrencyToggleCard";

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
  const fx = useExchangeRate({
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
    walletId,
  });

  // View mode with no currency difference → nothing to show.
  if (fx.isViewOnly && selectedCurrency === baseCurrency) {
    return null;
  }

  const conversionBody = (
    <ExchangeRateConversionCard
      isViewOnly={fx.isViewOnly}
      baseCurrency={baseCurrency}
      selectedCurrency={selectedCurrency}
      originalAmount={originalAmount}
      exchangeRate={exchangeRate}
      convertedAmount={convertedAmount}
      accentColor={accentColor}
      loadingRate={fx.loadingRate}
      autoRate={fx.autoRate}
      autoRateDate={fx.autoRateDate}
      onOriginalChange={fx.handleOriginalChange}
      onRateChange={fx.handleRateChange}
      onConvertedChange={fx.handleConvertedChange}
      onRestoreAutoRate={fx.restoreAutoRate}
    />
  );

  // View mode: just the read-only conversion card (no toggle wrapper).
  if (fx.isViewOnly) {
    return conversionBody;
  }

  // Edit / create: collapsible card gated by the foreign-currency toggle.
  return (
    <ForeignCurrencyToggleCard
      isForeignCurrency={fx.isForeignCurrency}
      onToggle={fx.handleToggle}
      baseCurrency={baseCurrency}
      selectedCurrency={selectedCurrency}
      onCurrencyChange={onCurrencyChange}
      accentColor={accentColor}
      autoExchangeRate={autoExchangeRate}
      onAutoExchangeRateChange={onAutoExchangeRateChange}
      walletId={walletId}
    >
      {conversionBody}
    </ForeignCurrencyToggleCard>
  );
};
