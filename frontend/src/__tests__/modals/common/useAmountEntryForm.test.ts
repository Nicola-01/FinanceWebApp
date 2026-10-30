import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAmountEntryForm } from "../../../modals/common/useAmountEntryForm";

const row = {
  type: "EXPENSE" as const,
  name: "Coffee",
  amount: 20,
  originalAmount: 10,
  originalCurrency: "USD",
  exchangeValue: 2,
  notes: "n",
  tag: { name: "Food" },
};

describe("useAmountEntryForm", () => {
  it("starts empty in the base currency", () => {
    const { result } = renderHook(() => useAmountEntryForm("EUR"));
    expect(result.current.type).toBe("");
    expect(result.current.hasAmount).toBe(false);
    expect(result.current.exchangeRateProps).toMatchObject({
      selectedCurrency: "EUR",
      originalAmount: "",
      exchangeRate: "1",
      convertedAmount: "0",
    });
    expect(result.current.currencySymbol).toBe("€");
  });

  it("loads a row and builds the base payload", () => {
    const { result } = renderHook(() => useAmountEntryForm("EUR"));
    act(() => result.current.reset(row));
    expect(result.current.selectedTagName).toBe("Food");
    expect(result.current.buildBasePayload()).toEqual({
      name: "Coffee",
      amount: 20,
      originalAmount: 10,
      type: "EXPENSE",
      originalCurrency: "USD",
      exchangeValue: 2,
      tag: "Food",
      notes: "n",
    });
    // Reminder mode zeroes both amounts.
    expect(result.current.buildBasePayload(true)).toMatchObject({
      amount: 0,
      originalAmount: 0,
    });
  });

  it("leaves the tag empty for a row still to categorise", () => {
    const { result } = renderHook(() => useAmountEntryForm("EUR"));
    act(() =>
      result.current.reset({
        ...row,
        tag: { name: "To categorise" },
        needsReview: true,
      }),
    );
    expect(result.current.selectedTagName).toBe("");
  });

  it("falls back to the tag name, amount and rate 1 when fields are missing", () => {
    const { result } = renderHook(() => useAmountEntryForm("EUR"));
    act(() =>
      result.current.reset({ type: "INCOME", amount: 5, tag: { name: "Pay" } }),
    );
    act(() => result.current.setName("   "));
    expect(result.current.buildBasePayload()).toMatchObject({
      name: "Pay",
      amount: 5,
      originalAmount: 5,
      originalCurrency: "EUR",
      exchangeValue: 1,
      notes: "",
    });
  });

  it("syncs the converted amount when typing the amount", () => {
    const { result } = renderHook(() => useAmountEntryForm("EUR"));
    act(() => result.current.handleAmountChange("7"));
    expect(result.current.exchangeRateProps.convertedAmount).toBe("7");

    act(() => result.current.reset(row)); // USD @ 2
    act(() => result.current.handleAmountChange("3"));
    expect(result.current.exchangeRateProps.convertedAmount).toBe("6.00");
    expect(result.current.hasAmount).toBe(true);

    act(() => result.current.reset());
    expect(result.current.exchangeRateProps.selectedCurrency).toBe("EUR");
    expect(result.current.name).toBe("");
  });
});
