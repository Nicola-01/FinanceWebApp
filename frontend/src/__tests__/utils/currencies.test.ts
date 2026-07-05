import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CURRENCY_META,
  getCurrencies,
  getPreferredForeignCurrency,
  setPreferredForeignCurrency,
  type CurrencyMeta,
} from "../../utils/currencies";

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

const mockFetch = (payload: unknown) => {
  const fn = vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(payload) }),
  ) as unknown as typeof fetch;
  global.fetch = fn;
  return fn as unknown as ReturnType<typeof vi.fn>;
};

describe("getCurrencies", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("hydrates from /v2/currencies and keeps curated meta over the API", async () => {
    const fetchFn = mockFetch([
      { iso_code: "AED", name: "UAE Dirham", symbol: "د.إ" },
      { iso_code: "USD", name: "US Dollar (api)", symbol: "US$" },
    ]);
    const map = await getCurrencies();

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toContain("/v2/currencies");
    // API-only code is hydrated.
    expect(map.AED).toEqual({ name: "UAE Dirham", symbol: "د.إ" });
    // Curated meta wins for a code we already own.
    expect(map.USD).toEqual(CURRENCY_META.USD);
  });

  it("serves the same-day cache without a second fetch", async () => {
    const fetchFn = mockFetch([
      { iso_code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    ]);
    await getCurrencies();
    const map2 = await getCurrencies();

    expect(fetchFn).toHaveBeenCalledTimes(1); // second call served from cache
    expect(map2.AED).toEqual({ name: "UAE Dirham", symbol: "د.إ" });
    expect(map2.EUR).toEqual(CURRENCY_META.EUR);
  });

  it("falls back to the curated set when the request fails", async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error("offline")),
    ) as unknown as typeof fetch;

    const map = await getCurrencies();
    expect(map.EUR).toEqual(CURRENCY_META.EUR);
    // Nothing outside the curated set leaks in.
    expect(map.AED).toBeUndefined();
  });
});

describe("preferred foreign currency", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is starred", () => {
    expect(getPreferredForeignCurrency("w1")).toBeNull();
  });

  it("persists per wallet and can be cleared without touching others", () => {
    setPreferredForeignCurrency("w1", "GBP");
    setPreferredForeignCurrency("w2", "JPY");
    expect(getPreferredForeignCurrency("w1")).toBe("GBP");
    expect(getPreferredForeignCurrency("w2")).toBe("JPY");

    setPreferredForeignCurrency("w1", null);
    expect(getPreferredForeignCurrency("w1")).toBeNull();
    expect(getPreferredForeignCurrency("w2")).toBe("JPY");
  });
});
