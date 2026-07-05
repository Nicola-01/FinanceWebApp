import { describe, it, expect, beforeEach, vi } from "vitest";
import { getExchangeRate } from "../../utils/exchangeRates";

const mockFetch = (payload: unknown) => {
  const fn = vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(payload) }),
  ) as unknown as typeof fetch;
  global.fetch = fn;
  return fn as unknown as ReturnType<typeof vi.fn>;
};

describe("getExchangeRate", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns rate 1 for identical currencies without fetching", async () => {
    const fetchFn = mockFetch([]);
    const fx = await getExchangeRate("EUR", "EUR");
    expect(fx).toEqual({ rate: 1, date: expect.any(String) });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("parses the Frankfurter v2 array response and hits /v2/rates", async () => {
    const fetchFn = mockFetch([
      { date: "2026-07-04", base: "USD", quote: "EUR", rate: 0.8738 },
    ]);
    const fx = await getExchangeRate("USD", "EUR");
    expect(fx).toEqual({ rate: 0.8738, date: "2026-07-04" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toContain("/v2/rates?base=USD&quotes=EUR");
  });

  it("serves the same-day cache without a second network call", async () => {
    const fetchFn = mockFetch([
      { date: "2026-07-04", base: "USD", quote: "EUR", rate: 0.87 },
    ]);
    await getExchangeRate("USD", "EUR");
    const fx2 = await getExchangeRate("USD", "EUR");
    expect(fx2).toEqual({ rate: 0.87, date: "2026-07-04" });
    expect(fetchFn).toHaveBeenCalledTimes(1); // second call served from cache
  });

  it("returns null on an unexpected response shape", async () => {
    mockFetch({ oops: true });
    const fx = await getExchangeRate("USD", "GBP");
    expect(fx).toBeNull();
  });
});
