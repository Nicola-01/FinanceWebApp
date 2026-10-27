import { describe, it, expect } from "vitest";
import { buildCurrencyLists } from "../../../components/selectors/useCurrencyList";
import type { CurrencyMeta } from "../../../utils/currencies";

const m = (name: string): CurrencyMeta =>
  ({ name, symbol: name[0] }) as CurrencyMeta;

const META: Record<string, CurrencyMeta> = {
  EUR: m("Euro"),
  USD: m("US Dollar"),
  ZAR: m("South African Rand"),
  AED: m("UAE Dirham"),
};

describe("buildCurrencyLists", () => {
  it("splits main and (sorted) other codes with no query", () => {
    const { mainCodes, otherCodes, results } = buildCurrencyLists(
      META,
      undefined,
      "  ",
    );
    expect(mainCodes).toEqual(expect.arrayContaining(["EUR", "USD"]));
    expect(mainCodes).not.toContain("ZAR");
    expect(otherCodes).toEqual(["AED", "ZAR"]);
    expect(results).toBeNull();
  });

  it("drops the excluded currency case-insensitively", () => {
    const { mainCodes } = buildCurrencyLists(META, "eur", "");
    expect(mainCodes).not.toContain("EUR");
  });

  it("filters by code or name, main currencies first", () => {
    expect(buildCurrencyLists(META, undefined, "d").results).toEqual([
      "USD",
      "AED",
      "ZAR",
    ]);
    expect(buildCurrencyLists(META, undefined, "euro").results).toEqual([
      "EUR",
    ]);
    expect(buildCurrencyLists(META, undefined, "xyz").results).toEqual([]);
  });
});
