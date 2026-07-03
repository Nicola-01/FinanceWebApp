import { describe, it, expect } from "vitest";
import { CURRENCY_META, type CurrencyMeta } from "./currencies";

describe("CURRENCY_META", () => {
  it("returns the expected metadata for a known currency code", () => {
    expect(CURRENCY_META.EUR).toEqual({ name: "Euro", symbol: "€" });
    expect(CURRENCY_META.USD.name).toBe("United States Dollar");
    expect(CURRENCY_META.USD.symbol).toBe("$");
  });

  it("exposes a narrow symbol only for currencies that define one", () => {
    // Ambiguous dollar symbols carry a disambiguating narrow variant.
    expect(CURRENCY_META.AUD.symbolNarrow).toBe("A$");
    expect(CURRENCY_META.CAD.symbolNarrow).toBe("C$");
    // The Euro has an unambiguous symbol, so no narrow variant is defined.
    expect(CURRENCY_META.EUR.symbolNarrow).toBeUndefined();
  });

  it("returns undefined for an unknown currency code (graceful lookup)", () => {
    const lookup = CURRENCY_META as Record<string, CurrencyMeta | undefined>;
    expect(lookup.XYZ).toBeUndefined();
    expect(lookup[""]).toBeUndefined();
  });

  it("provides a non-empty map that includes common currencies", () => {
    const codes = Object.keys(CURRENCY_META);
    expect(codes.length).toBeGreaterThan(0);
    expect(codes).toEqual(expect.arrayContaining(["EUR", "USD", "GBP", "JPY"]));
  });

  it("gives every entry a non-empty name and symbol", () => {
    for (const [code, meta] of Object.entries(CURRENCY_META)) {
      expect(meta.name, `${code} name`).toBeTruthy();
      expect(meta.symbol, `${code} symbol`).toBeTruthy();
    }
  });
});
