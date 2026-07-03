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
    vi.clearAllMocks();
  });

  it("recomputes the converted amount when the original amount changes", () => {
    const h = renderSection({ originalAmount: "10", exchangeRate: "2" });
    const [original] = screen.getAllByRole("spinbutton");
    // Use a value different from the default so React fires onChange.
    fireEvent.change(original, { target: { value: "12" } });
    expect(h.onOriginalAmountChange).toHaveBeenCalledWith("12");
    expect(h.onConvertedAmountChange).toHaveBeenLastCalledWith("24.00");
  });

  it("recomputes the converted amount when the rate changes", () => {
    const h = renderSection({ originalAmount: "10" });
    const rate = screen.getAllByRole("spinbutton")[1];
    fireEvent.change(rate, { target: { value: "3" } });
    expect(h.onExchangeRateChange).toHaveBeenCalledWith("3");
    expect(h.onConvertedAmountChange).toHaveBeenLastCalledWith("30.00");
  });

  it("derives the rate when the converted amount is edited", () => {
    const h = renderSection({ originalAmount: "10" });
    const converted = screen.getAllByRole("spinbutton")[2];
    fireEvent.change(converted, { target: { value: "50" } });
    expect(h.onConvertedAmountChange).toHaveBeenCalledWith("50");
    expect(h.onExchangeRateChange).toHaveBeenLastCalledWith("5");
  });

  it("resets to the base currency when the foreign toggle is switched off", () => {
    const h = renderSection({ convertedAmount: "20" });
    fireEvent.click(screen.getByText("Foreign Currency"));
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
});
