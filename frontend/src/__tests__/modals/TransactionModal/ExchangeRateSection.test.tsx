import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExchangeRateSection } from "../../../modals/TransactionModal/ExchangeRateSection";
import type { CurrencyCode } from "../../../utils/currencies";

vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

interface Handlers {
  onOriginalAmountChange: ReturnType<typeof vi.fn>;
  onExchangeRateChange: ReturnType<typeof vi.fn>;
  onConvertedAmountChange: ReturnType<typeof vi.fn>;
  onCurrencyChange: ReturnType<typeof vi.fn>;
}

const renderSection = (
  props: Partial<{
    mode: "view" | "edit" | "create";
    baseCurrency: CurrencyCode;
    selectedCurrency: CurrencyCode;
    originalAmount: string;
    exchangeRate: string;
    convertedAmount: string;
  }> = {},
): Handlers => {
  const handlers: Handlers = {
    onOriginalAmountChange: vi.fn(),
    onExchangeRateChange: vi.fn(),
    onConvertedAmountChange: vi.fn(),
    onCurrencyChange: vi.fn(),
  };
  render(
    <ExchangeRateSection
      mode={props.mode ?? "edit"}
      baseCurrency={props.baseCurrency ?? "EUR"}
      selectedCurrency={props.selectedCurrency ?? "USD"}
      originalAmount={props.originalAmount ?? "10"}
      exchangeRate={props.exchangeRate ?? "2"}
      convertedAmount={props.convertedAmount ?? "20"}
      {...handlers}
    />,
  );
  return handlers;
};

describe("ExchangeRateSection", () => {
  beforeEach(() => {
    // Never-resolving fetch: keeps the auto-rate effect from updating state.
    global.fetch = vi.fn(
      () => new Promise(() => {}),
    ) as unknown as typeof fetch;
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("recomputes the converted amount when the original amount changes", () => {
    const h = renderSection({ originalAmount: "10", exchangeRate: "2" });
    const original = screen.getByLabelText("Original amount");
    // Use a value different from the default so React fires onChange.
    fireEvent.change(original, { target: { value: "12" } });
    expect(h.onOriginalAmountChange).toHaveBeenCalledWith("12");
    expect(h.onConvertedAmountChange).toHaveBeenLastCalledWith("24.00");
  });

  it("recomputes the converted amount when the rate changes", () => {
    const h = renderSection({ originalAmount: "10" });
    const rate = screen.getByLabelText("Exchange rate");
    fireEvent.change(rate, { target: { value: "3" } });
    expect(h.onExchangeRateChange).toHaveBeenCalledWith("3");
    expect(h.onConvertedAmountChange).toHaveBeenLastCalledWith("30.00");
  });

  it("derives the rate when the converted amount is edited", () => {
    const h = renderSection({ originalAmount: "10" });
    const converted = screen.getByLabelText("Converted amount");
    fireEvent.change(converted, { target: { value: "50" } });
    expect(h.onConvertedAmountChange).toHaveBeenCalledWith("50");
    expect(h.onExchangeRateChange).toHaveBeenLastCalledWith("5");
  });

  it("resets to the base currency when the foreign toggle is switched off", () => {
    const h = renderSection({ convertedAmount: "20" });
    fireEvent.click(screen.getByRole("switch", { name: "Foreign currency" }));
    expect(h.onCurrencyChange).toHaveBeenCalledWith("EUR");
    expect(h.onExchangeRateChange).toHaveBeenCalledWith("1");
    expect(h.onOriginalAmountChange).toHaveBeenCalledWith("20");
  });

  it("renders nothing in view mode when currency matches the base", () => {
    const { container } = render(
      <ExchangeRateSection
        mode="view"
        baseCurrency="EUR"
        selectedCurrency="EUR"
        originalAmount="10"
        exchangeRate="1"
        convertedAmount="10"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the rate-mode control without onAutoExchangeRateChange (transactions)", () => {
    renderSection(); // no rate-mode handler → transaction mode
    expect(screen.queryByText("Fixed rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Day's rate")).not.toBeInTheDocument();
  });

  it("shows and toggles the rate-mode control (subscriptions)", () => {
    const onAutoExchangeRateChange = vi.fn();
    render(
      <ExchangeRateSection
        mode="edit"
        baseCurrency="EUR"
        selectedCurrency="USD"
        originalAmount="10"
        exchangeRate="2"
        convertedAmount="20"
        autoExchangeRate={true}
        onAutoExchangeRateChange={onAutoExchangeRateChange}
        onOriginalAmountChange={vi.fn()}
        onExchangeRateChange={vi.fn()}
        onConvertedAmountChange={vi.fn()}
        onCurrencyChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Day's rate")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Fixed rate"));
    expect(onAutoExchangeRateChange).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText("Day's rate"));
    expect(onAutoExchangeRateChange).toHaveBeenCalledWith(true);
  });

  it("presets the starred currency when the foreign toggle is switched on", () => {
    localStorage.setItem("fx_default_currency_w1", "GBP");
    const onCurrencyChange = vi.fn();
    render(
      <ExchangeRateSection
        mode="create"
        walletId="w1"
        baseCurrency="EUR"
        selectedCurrency="EUR"
        originalAmount=""
        exchangeRate="1"
        convertedAmount=""
        onCurrencyChange={onCurrencyChange}
        onOriginalAmountChange={vi.fn()}
        onExchangeRateChange={vi.fn()}
        onConvertedAmountChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Foreign currency" }));
    expect(onCurrencyChange).toHaveBeenCalledWith("GBP");
  });

  it("keeps the wallet currency when no default is starred", () => {
    const onCurrencyChange = vi.fn();
    render(
      <ExchangeRateSection
        mode="create"
        walletId="w1"
        baseCurrency="EUR"
        selectedCurrency="EUR"
        originalAmount=""
        exchangeRate="1"
        convertedAmount=""
        onCurrencyChange={onCurrencyChange}
        onOriginalAmountChange={vi.fn()}
        onExchangeRateChange={vi.fn()}
        onConvertedAmountChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Foreign currency" }));
    // preset === base === selectedCurrency → nothing to change
    expect(onCurrencyChange).not.toHaveBeenCalled();
  });
});
