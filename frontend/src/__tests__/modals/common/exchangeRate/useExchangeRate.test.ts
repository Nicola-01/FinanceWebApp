import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useExchangeRate,
  type UseExchangeRateArgs,
} from "../../../../modals/common/exchangeRate/useExchangeRate";
import { getExchangeRate } from "../../../../utils/exchangeRates";
import { triggerToast } from "../../../../components/ui/ToastNotification.tsx";

vi.mock("../../../../utils/exchangeRates", () => ({
  getExchangeRate: vi.fn(),
}));
vi.mock("../../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

const setup = (overrides: Partial<UseExchangeRateArgs> = {}) => {
  const args: UseExchangeRateArgs = {
    mode: "edit",
    baseCurrency: "EUR",
    selectedCurrency: "USD",
    originalAmount: "10",
    exchangeRate: "2",
    convertedAmount: "20",
    onCurrencyChange: vi.fn(),
    onOriginalAmountChange: vi.fn(),
    onExchangeRateChange: vi.fn(),
    onConvertedAmountChange: vi.fn(),
    ...overrides,
  };
  return { args, hook: renderHook(() => useExchangeRate(args)) };
};

describe("useExchangeRate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("auto-fetches the rate and recomputes the converted amount", async () => {
    vi.mocked(getExchangeRate).mockResolvedValue({
      rate: 1.5,
      date: "2026-01-02",
    });
    const { args, hook } = setup();
    await waitFor(() => expect(hook.result.current.autoRate).toBe("1.5"));
    expect(getExchangeRate).toHaveBeenCalledWith("USD", "EUR");
    expect(args.onExchangeRateChange).toHaveBeenCalledWith("1.5");
    expect(args.onConvertedAmountChange).toHaveBeenCalledWith("15.00");
    expect(hook.result.current.autoRateDate).toBe("2026-01-02");
    expect(hook.result.current.loadingRate).toBe(false);
  });

  it("toasts when no rate is available or the fetch fails", async () => {
    vi.mocked(getExchangeRate).mockResolvedValueOnce(null);
    setup();
    await waitFor(() =>
      expect(triggerToast).toHaveBeenCalledWith(
        "Could not retrieve exchange rate.",
        false,
      ),
    );

    vi.mocked(getExchangeRate).mockRejectedValueOnce(new Error("boom"));
    setup();
    await waitFor(() =>
      expect(triggerToast).toHaveBeenCalledWith(
        "Error fetching exchange rate.",
        false,
      ),
    );
  });

  it("does not fetch in view mode, in create mode or for the base currency", () => {
    setup({ mode: "view" });
    setup({ mode: "create" });
    setup({ selectedCurrency: "EUR" });
    expect(getExchangeRate).not.toHaveBeenCalled();
  });

  it("restores the auto-fetched rate without refetching", async () => {
    vi.mocked(getExchangeRate).mockResolvedValue({
      rate: 1.5,
      date: "2026-01-02",
    });
    const { args, hook } = setup({ exchangeRate: "3" });
    await waitFor(() => expect(hook.result.current.autoRate).toBe("1.5"));
    vi.mocked(args.onExchangeRateChange!).mockClear();
    act(() => hook.result.current.restoreAutoRate());
    expect(args.onExchangeRateChange).toHaveBeenCalledWith("1.5");
    expect(args.onConvertedAmountChange).toHaveBeenLastCalledWith("15.00");
    expect(getExchangeRate).toHaveBeenCalledTimes(1);
  });

  it("toggling off resets to the base currency and clears the auto rate", async () => {
    vi.mocked(getExchangeRate).mockResolvedValue({
      rate: 1.5,
      date: "2026-01-02",
    });
    const { args, hook } = setup();
    await waitFor(() => expect(hook.result.current.autoRate).toBe("1.5"));
    act(() => hook.result.current.handleToggle());
    expect(hook.result.current.isForeignCurrency).toBe(false);
    expect(hook.result.current.autoRate).toBeNull();
    expect(args.onCurrencyChange).toHaveBeenCalledWith("EUR");
    expect(args.onExchangeRateChange).toHaveBeenCalledWith("1");
    expect(args.onOriginalAmountChange).toHaveBeenCalledWith("20");
  });

  it("toggle is a no-op in view mode", () => {
    const { args, hook } = setup({ mode: "view" });
    act(() => hook.result.current.handleToggle());
    expect(hook.result.current.isForeignCurrency).toBe(true);
    expect(args.onCurrencyChange).not.toHaveBeenCalled();
  });

  it("binds original, rate and converted amounts", () => {
    vi.mocked(getExchangeRate).mockReturnValue(new Promise(() => {}));
    const { args, hook } = setup();
    hook.result.current.handleOriginalChange("4");
    expect(args.onConvertedAmountChange).toHaveBeenLastCalledWith("8.00");
    hook.result.current.handleRateChange("3");
    expect(args.onConvertedAmountChange).toHaveBeenLastCalledWith("30.00");
    hook.result.current.handleConvertedChange("25");
    expect(args.onExchangeRateChange).toHaveBeenLastCalledWith("2.5");
  });
});
