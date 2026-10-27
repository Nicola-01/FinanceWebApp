import { useState } from "react";
import { getCurrencySymbol, type CurrencyCode } from "../../utils/currencies";

/** The money/category fields shared by a Transaction and a Subscription. */
export interface AmountEntrySource {
  type: "EXPENSE" | "INCOME";
  name?: string;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeValue?: number;
  notes?: string;
  tag?: { name: string } | null;
}

/**
 * Form state shared by `TransactionModal` and `SubscriptionModal`: type,
 * name/notes, category, and the amount ↔ currency ↔ rate ↔ converted fields.
 */
export function useAmountEntryForm(baseCurrency: CurrencyCode) {
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "">("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<string>("0");
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [exchangeRate, setExchangeRate] = useState<string>("1");
  const [notes, setNotes] = useState("");
  const [selectedTagName, setSelectedTagName] = useState<string>("");

  /** Load an existing row (edit mode) or clear back to create defaults. */
  const reset = (src?: AmountEntrySource) => {
    if (src) {
      setType(src.type);
      setName(src.name || "");
      setCurrency((src.originalCurrency || baseCurrency) as CurrencyCode);
      setAmount((src.originalAmount || src.amount).toString());
      setConvertedAmount(src.amount.toString());
      setExchangeRate((src.exchangeValue || 1).toString());
      setSelectedTagName(src.tag?.name || "");
      setNotes(src.notes || "");
    } else {
      setType("");
      setName("");
      setAmount("");
      setConvertedAmount("0");
      setCurrency(baseCurrency);
      setExchangeRate("1");
      setSelectedTagName("");
      setNotes("");
    }
  };

  // Typing in the big amount input keeps the converted amount in sync.
  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (currency !== baseCurrency && exchangeRate)
      setConvertedAmount((Number(val) * Number(exchangeRate)).toFixed(2));
    else setConvertedAmount(val);
  };

  const hasAmount = amount !== "" && Number(amount) !== 0;

  /** Request fields common to both payloads; `zeroAmounts` = reminder mode. */
  const buildBasePayload = (zeroAmounts = false) => ({
    name: name.trim().length > 0 ? name.trim() : selectedTagName,
    amount: zeroAmounts ? 0 : Math.abs(Number(convertedAmount)),
    originalAmount: zeroAmounts ? 0 : Math.abs(Number(amount)),
    type,
    originalCurrency: currency,
    exchangeValue: Number(exchangeRate) || 1,
    tag: selectedTagName,
    notes,
  });

  /** Props wiring the form into `ExchangeRateSection`. */
  const exchangeRateProps = {
    baseCurrency,
    selectedCurrency: currency,
    onCurrencyChange: setCurrency,
    originalAmount: amount,
    onOriginalAmountChange: setAmount,
    exchangeRate,
    onExchangeRateChange: setExchangeRate,
    convertedAmount,
    onConvertedAmountChange: setConvertedAmount,
  };

  return {
    type,
    setType,
    name,
    setName,
    amount,
    notes,
    setNotes,
    selectedTagName,
    setSelectedTagName,
    currencySymbol: getCurrencySymbol(currency),
    hasAmount,
    reset,
    handleAmountChange,
    buildBasePayload,
    exchangeRateProps,
  };
}
