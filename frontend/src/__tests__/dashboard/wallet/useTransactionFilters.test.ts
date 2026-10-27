import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Tag, Transaction } from "../../../types/domain";
import {
  filterTransactions,
  useTransactionFilters,
} from "../../../dashboard/wallet/useTransactionFilters";

const tx = (over: Partial<Transaction>): Transaction =>
  ({
    id: "t",
    name: "Coffee",
    notes: "",
    amount: 1,
    transactionDate: "2026-06-15",
    tag: { name: "Food" },
    ...over,
  }) as unknown as Transaction;

const tags = [{ name: "Food" }, { name: "Rent" }] as unknown as Tag[];
const none = { start: null, end: null };

describe("filterTransactions", () => {
  const list = [
    tx({ id: "1" }),
    tx({ id: "2", name: "Flat", tag: { name: "Rent" } as Tag }),
    tx({ id: "3", transactionDate: "2026-07-02", notes: "latte art" }),
    tx({ id: "4", amountPending: true } as Partial<Transaction>),
  ];
  const ids = (r: Transaction[]) => r.map((t) => t.id);

  it("falls back to all tags and always drops pending rows", () => {
    const r = filterTransactions(list, tags, {
      selectedTags: null,
      dateRange: none,
      query: "",
    });
    expect(ids(r)).toEqual(["1", "2", "3"]);
  });

  it("filters by selected tags", () => {
    const r = filterTransactions(list, tags, {
      selectedTags: ["Rent"],
      dateRange: none,
      query: "",
    });
    expect(ids(r)).toEqual(["2"]);
  });

  it("matches the query case-insensitively over name, tag and notes", () => {
    const f = (query: string) =>
      ids(
        filterTransactions(list, tags, {
          selectedTags: null,
          dateRange: none,
          query,
        }),
      );
    expect(f("  LATTE ")).toEqual(["3"]);
    expect(f("rent")).toEqual(["2"]);
    expect(f("   ")).toEqual(["1", "2", "3"]);
  });

  it("filters by an inclusive whole-day date range", () => {
    const r = filterTransactions(list, tags, {
      selectedTags: null,
      dateRange: { start: new Date(2026, 5, 15), end: new Date(2026, 5, 30) },
      query: "",
    });
    expect(ids(r)).toEqual(["1", "2"]);
  });
});

describe("useTransactionFilters", () => {
  afterEach(() => vi.useRealTimers());

  it("debounces the search query by 200ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTransactionFilters());
    expect(result.current.datePreset).toBe("month");
    expect(result.current.selectedTags).toBeNull();

    act(() => result.current.setSearchQuery("abc"));
    expect(result.current.searchQuery).toBe("abc");
    expect(result.current.debouncedQuery).toBe("");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedQuery).toBe("abc");
  });
});
