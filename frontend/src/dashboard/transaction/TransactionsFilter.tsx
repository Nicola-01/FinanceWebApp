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
    activeTab,
  } = useWalletContext();

  // Text search only makes sense on the Transactions list. On the Categories
  // tab it's hidden (the query is kept in context and reapplied on return).
  const showSearch = activeTab === "transactions";
  const { resolvedTheme } = useTheme();

  const activeTags = selectedTags ?? tags.map((t) => t.name); // Using context state

  return (
    <div className="sticky top-17 z-80 mb-4 w-full max-w-350 mx-auto px-4 lg:px-8 pointer-events-none">
      <div className="w-full flex items-center gap-2 sm:gap-4 p-2 rounded-2xl border border-app-border bg-app-card/60 backdrop-blur-xl shadow-lg transition-all pointer-events-auto">
        {/* Left column. `flex-1 basis-0` here + on the right ⇒ both sides claim
            equal width, so the centre column is always dead-centre regardless of
            the search / tag button widths. `min-w-12` floors each side at the
            48px control width so they never collapse under their button — that
            forces the overflow onto the shrinkable centre column instead of
            letting the side buttons overrun the date picker. Search is a full
            field on lg+, an icon-button-with-popover below it. */}
        <div className="flex-1 basis-0 min-w-12 flex justify-start">
          {showSearch && (
            <TransactionsSearch
              value={searchQuery}
              onChange={setSearchQuery}
              color={wallet.color}
            />
          )}
        </div>

        {/* Centre: date range. Fixed max basis but `min-w-0` + `shrink` so it
            gives up width to the pinned side columns on narrow screens instead
            of overlapping the side buttons. */}
        <div className="flex-[0_1_24rem] min-w-0 w-full">
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

        {/* Right column: dynamic tag filter. Mirrors the left column's width
            and 48px floor so the centre stays dead-centre and never collides. */}
        <div className="flex-1 basis-0 min-w-12 flex justify-end">
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
