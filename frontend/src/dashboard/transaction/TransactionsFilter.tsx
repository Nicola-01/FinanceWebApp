import React, { useRef, useState } from "react";
import CustomDatePicker, {
  type DateRangeValue,
} from "../../components/datePicker/CustomDatePicker.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TagFilter } from "../../components/tags/TagFilter.tsx";
import { useTheme } from "../../utils/ThemeContext.tsx";
import TransactionsSearch from "./TransactionsSearch.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeftRight } from "@fortawesome/free-solid-svg-icons";
import Toggle from "../../components/ui/Toggle.tsx";

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
    toCategorise,
    onlyToCategorise,
    setOnlyToCategorise,
  } = useWalletContext();

  // Text search only makes sense on the Transactions list. On the Categories
  // tab it's hidden (the query is kept in context and reapplied on return).
  const showSearch = activeTab === "transactions";
  const { resolvedTheme } = useTheme();

  const activeTags = selectedTags ?? tags.map((t) => t.name); // Using context state

  // The picker keeps its own state from its `initial*` props, so a programmatic period
  // change needs a remount. Bumped only by the review button: a remount driven by the
  // picker itself would close its popover mid-selection.
  const [pickerKey, setPickerKey] = useState(0);
  const periodBeforeReview = useRef({ preset: datePreset, range: dateRange });

  const toggleReview = () => {
    if (onlyToCategorise) {
      setDatePreset(periodBeforeReview.current.preset);
      setDateRange(periodBeforeReview.current.range);
    } else {
      periodBeforeReview.current = { preset: datePreset, range: dateRange };
      setDatePreset("all");
      setDateRange({ start: null, end: null });
    }
    setOnlyToCategorise(!onlyToCategorise);
    setPickerKey((k) => k + 1);
  };

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
            key={pickerKey}
            isRange={true}
            color={wallet.color}
            isDark={resolvedTheme === "dark"}
            onChange={(val) => setDateRange(val as DateRangeValue)}
            initialPreset={datePreset}
            initialStartDate={dateRange.start}
            initialEndDate={dateRange.end}
            onPresetChange={(preset) => {
              setDatePreset(preset);
              // Review mode spans "All"; picking any other period leaves it.
              if (onlyToCategorise && preset !== "all")
                setOnlyToCategorise(false);
            }}
          />
        </div>

        {/* Right column: dynamic tag filter. Mirrors the left column's width
            and 48px floor so the centre stays dead-centre and never collides. */}
        <div className="flex-1 basis-0 min-w-12 flex justify-end">
          <TagFilter
            tags={tags}
            // Review mode and the tag selection are mutually exclusive: while
            // reviewing, every tag (and "All Tags") shows as off.
            selectedTags={onlyToCategorise ? [] : activeTags}
            color={wallet.color}
            topSlot={
              showSearch &&
              toCategorise.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-app-text">
                    <FontAwesomeIcon
                      icon={faLeftRight}
                      className="text-app-muted"
                    />
                    To categorise
                    <span className="font-app-mono tabular-nums text-app-muted">
                      {toCategorise.length}
                    </span>
                  </span>
                  <Toggle
                    size="sm"
                    checked={onlyToCategorise}
                    onChange={toggleReview}
                    accentColor={wallet.color}
                    aria-label="Show only transactions to categorise"
                  />
                </div>
              )
            }
            onChange={(newSelection) => {
              // Picking tags (incl. "All Tags") leaves review mode.
              if (onlyToCategorise) toggleReview();
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
