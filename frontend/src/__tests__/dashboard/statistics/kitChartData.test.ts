import { describe, it, expect } from "vitest";
import {
  compactAmount,
  currencySymbolOf,
  formatKitAmount,
  monthLabel,
} from "../../../dashboard/statistics/kitChartData.ts";
import { formatAmount } from "../../../utils/format.ts";

describe("compactAmount", () => {
  it("shortens axis values to k / M", () => {
    expect(compactAmount(950)).toBe("950");
    expect(compactAmount(15000)).toBe("15k");
    expect(compactAmount(1234)).toBe("1.2k");
    expect(compactAmount(1_500_000)).toBe("1.5M");
    expect(compactAmount(-2500)).toBe("-2.5k");
  });
});

describe("formatKitAmount", () => {
  it("prefixes the currency symbol and groups the digits", () => {
    expect(formatKitAmount(1234.5, "€")).toBe(`${formatAmount(1234.5)} €`);
  });

  it("adds + / − only when signed", () => {
    expect(formatKitAmount(476.57, "€", true)).toBe(
      `+${formatAmount(476.57)} €`,
    );
    expect(formatKitAmount(-10, "€", true)).toBe(`−${formatAmount(10)} €`);
    expect(formatKitAmount(0, "€", true)).toBe(`${formatAmount(0)} €`);
  });
});

describe("currencySymbolOf / monthLabel", () => {
  it("maps a wallet currency code to its symbol, falling back to the code", () => {
    expect(currencySymbolOf("EUR")).toBe("€");
    expect(currencySymbolOf("XYZ")).toBe("XYZ");
  });

  it("names the month of a bucket date", () => {
    expect(monthLabel(new Date(2024, 2, 1))).toBe("Mar");
  });
});
