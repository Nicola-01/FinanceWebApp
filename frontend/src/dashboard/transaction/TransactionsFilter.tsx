import React from "react";
import CustomDatePicker, {
  type DateRangeValue,
} from "../../components/DataPicker/CustomDatePicker.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TagFilter } from "../../components/TagFilter/TagFilter.tsx";
import { useTheme } from "../../utils/ThemeContext.tsx";
import TransactionsSearch from "./TransactionsSearch.tsx";

export const TransactionsFilter: React.FC = () => {
  const {
    wallet,
    tags,
    selectedTags,
    setSelectedTags,
    searchQuery,
    setSearchQuery,
    setDateRange,
    dateRange,
    datePreset,
    setDatePreset,
  } = useWalletContext();
  const { resolvedTheme } = useTheme();

  const activeTags = selectedTags ?? tags.map((t) => t.name); // Using context state

  return (
    <div className="sticky top-17 z-80 mb-4 w-full max-w-350 mx-auto px-4 lg:px-8 pointer-events-none">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4 p-2 rounded-2xl border border-app-border bg-app-card/60 backdrop-blur-xl shadow-lg transition-all pointer-events-auto">
        {/* Text search over transaction names. Hidden on mobile to keep the date
            picker centered (mirrors the right-side tag filter button). */}
        <div className="hidden sm:flex shrink-0 items-center justify-center">
          <TransactionsSearch
            value={searchQuery}
            onChange={setSearchQuery}
            color={wallet.color}
          />
        </div>

        <div className="flex-1 flex justify-center min-w-60">
          <div className="w-full max-w-sm">
            <CustomDatePicker
              isRange={true}
              color={wallet.color}
              isDark={resolvedTheme === "dark"}
              onChange={(val) => setDateRange(val as DateRangeValue)}
              initialPreset={datePreset}
              initialStartDate={dateRange.start}
              initialEndDate={dateRange.end}
              onPresetChange={(preset) => setDatePreset(preset)}
            />
          </div>
        </div>

        {/* Filtro Tag Dinamico */}
        <div className="shrink-0 flex items-center justify-center">
          <TagFilter
            tags={tags}
            selectedTags={activeTags}
            color={wallet.color}
            onChange={(newSelection) => {
              if (newSelection.length === tags.length) {
                setSelectedTags(null);
              } else {
                setSelectedTags(newSelection);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
