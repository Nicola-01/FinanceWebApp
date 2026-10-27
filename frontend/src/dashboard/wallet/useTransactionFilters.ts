import { useState } from "react";
import type { Tag, Transaction } from "../../types/domain";
import type {
  DateRangeValue,
  PresetType,
} from "../../components/datePicker/CustomDatePicker.tsx";
import { useDebounce } from "../../hooks/useDebounce";

/** Transaction filter state (tags, date range/preset, search + its debounced copy). */
export function useTransactionFilters() {
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });
  const [datePreset, setDatePreset] = useState<PresetType>("month");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // The input stays bound to `searchQuery` (instant); filtering is driven by a
  // debounced copy so typing stays smooth on large transaction lists.
  const debouncedQuery = useDebounce(searchQuery, 200);

  return {
    selectedTags,
    setSelectedTags,
    dateRange,
    setDateRange,
    datePreset,
    setDatePreset,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
  };
}

interface TransactionFilterCriteria {
  selectedTags: string[] | null;
  dateRange: DateRangeValue;
  /** Raw search text; blank disables the text search. */
  query: string;
}

/**
 * Filters the (overlaid) transactions by tag set, free-text query and date
 * range. Pending (amount-less) rows are always excluded.
 */
export function filterTransactions(
  transactions: Transaction[],
  tags: Tag[],
  { selectedTags, dateRange, query }: TransactionFilterCriteria,
): Transaction[] {
  // Fallback active-tag set is derived from the OVERLAID tags (not raw `tags`)
  // so a transaction whose category was created offline — a tag that only
  // exists in the overlay — isn't filtered out and made to "vanish".
  const currentActiveTags = selectedTags ?? tags.map((t) => t.name);
  const q = query.trim().toLowerCase();

  return transactions.filter((tx) => {
    // Pending (amount-less) rows live only in the pinned panel, never in the normal list.
    if (tx.amountPending) return false;
    if (!currentActiveTags.includes(tx.tag.name)) return false;

    // Free-text search over the transaction name, its tag and notes.
    if (q) {
      const haystack =
        `${tx.name ?? ""} ${tx.tag?.name ?? ""} ${tx.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    const txDate = new Date(tx.transactionDate);

    if (dateRange?.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) return false;
    }

    if (dateRange?.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (txDate > end) return false;
    }
    return true;
  });
}
