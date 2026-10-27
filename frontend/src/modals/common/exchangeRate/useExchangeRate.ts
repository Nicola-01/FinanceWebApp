import { useEffect, useState } from "react";
import {
  type CurrencyCode,
  getPreferredForeignCurrency,
} from "../../../utils/currencies";
import { getExchangeRate } from "../../../utils/exchangeRates";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";

export interface UseExchangeRateArgs {
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
  walletId?: string;
}

/**
 * State + handlers behind `ExchangeRateSection`: the foreign-currency toggle,
 * the daily auto-rate fetch (and its restorable last value), and the 3-way
 * binding original ↔ rate ↔ converted.
 */
export function useExchangeRate({
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
}: UseExchangeRateArgs) {
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
      } catch {
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

  return {
    isViewOnly,
    isForeignCurrency,
    loadingRate,
    autoRate,
    autoRateDate,
    handleToggle,
    handleOriginalChange,
    handleRateChange,
    handleConvertedChange,
    restoreAutoRate,
  };
}
