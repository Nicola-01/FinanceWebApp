import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { setSelectedTags, setSearchQuery, setOnlyToCategorise } = vi.hoisted(
  () => ({
    setSelectedTags: vi.fn(),
    setSearchQuery: vi.fn(),
    setOnlyToCategorise: vi.fn(),
  }),
);
const { setDateRange, setDatePreset } = vi.hoisted(() => ({
  setDateRange: vi.fn(),
  setDatePreset: vi.fn(),
}));
const review = vi.hoisted(() => ({ on: false }));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { color: "#00ff00" },
    tags: [{ name: "A" }, { name: "B" }],
    selectedTags: null,
    setSelectedTags,
    searchQuery: "",
    setSearchQuery,
    setDateRange,
    dateRange: { start: null, end: null },
    datePreset: "all",
    setDatePreset,
    // The search box only renders on the Transactions tab.
    activeTab: "transactions",
    toCategorise: [{ id: "r1" }, { id: "r2" }],
    onlyToCategorise: review.on,
    setOnlyToCategorise,
  }),
}));
vi.mock("../../../utils/ThemeContext.tsx", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("../../../components/datePicker/CustomDatePicker.tsx", () => ({
  default: () => <div data-testid="date-picker" />,
}));
vi.mock("../../../components/tags/TagFilter.tsx", () => ({
  TagFilter: ({
    onChange,
    selectedTags,
    topSlot,
  }: {
    onChange: (s: string[]) => void;
    selectedTags: string[];
    topSlot?: React.ReactNode;
  }) => (
    <div>
      {topSlot}
      <span data-testid="selected">{selectedTags.join(",")}</span>
      <button data-testid="pick-all" onClick={() => onChange(["A", "B"])}>
        all
      </button>
      <button data-testid="pick-one" onClick={() => onChange(["A"])}>
        one
      </button>
    </div>
  ),
}));

import { TransactionsFilter } from "../../../dashboard/transaction/TransactionsFilter";

describe("TransactionsFilter", () => {
  beforeEach(() => {
    setSelectedTags.mockReset();
    setSearchQuery.mockReset();
    setOnlyToCategorise.mockReset();
    setDatePreset.mockReset();
    setDateRange.mockReset();
    review.on = false;
  });

  it("renders the date picker, tag filter and search box", () => {
    render(<TransactionsFilter />);
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByTestId("pick-all")).toBeInTheDocument();
    expect(screen.getByLabelText("Search transactions")).toBeInTheDocument();
  });

  it("updates the search query as the user types", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    await user.type(screen.getByLabelText("Search transactions"), "x");
    expect(setSearchQuery).toHaveBeenCalledWith("x");
  });

  it("collapses a full selection to null", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    await user.click(screen.getByTestId("pick-all"));
    expect(setSelectedTags).toHaveBeenCalledWith(null);
  });

  it("toggles review mode from the switch inside the tag filter", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    const toggle = screen.getByLabelText(
      "Show only transactions to categorise",
    );
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(setOnlyToCategorise).toHaveBeenCalledWith(true);
    // Review mode switches the calendar to its own "All" preset.
    expect(setDatePreset).toHaveBeenCalledWith("all");
    expect(setDateRange).toHaveBeenCalledWith({ start: null, end: null });
  });

  it("shows every tag off in review mode, and picking tags leaves it", async () => {
    review.on = true;
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    expect(screen.getByTestId("selected")).toHaveTextContent("");
    await user.click(screen.getByTestId("pick-all"));
    expect(setOnlyToCategorise).toHaveBeenCalledWith(false);
    expect(setSelectedTags).toHaveBeenCalledWith(null);
  });

  it("passes a partial selection through unchanged", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    await user.click(screen.getByTestId("pick-one"));
    expect(setSelectedTags).toHaveBeenCalledWith(["A"]);
  });
});
