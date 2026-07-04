import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { setSelectedTags, setSearchQuery } = vi.hoisted(() => ({
  setSelectedTags: vi.fn(),
  setSearchQuery: vi.fn(),
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { color: "#00ff00" },
    tags: [{ name: "A" }, { name: "B" }],
    selectedTags: null,
    setSelectedTags,
    searchQuery: "",
    setSearchQuery,
    setDateRange: vi.fn(),
    dateRange: { start: null, end: null },
    datePreset: "all",
    setDatePreset: vi.fn(),
    // The search box only renders on the Transactions tab.
    activeTab: "transactions",
  }),
}));
vi.mock("../../../utils/ThemeContext.tsx", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("../../../components/DataPicker/CustomDatePicker.tsx", () => ({
  default: () => <div data-testid="date-picker" />,
}));
vi.mock("../../../components/TagFilter/TagFilter.tsx", () => ({
  TagFilter: ({ onChange }: { onChange: (s: string[]) => void }) => (
    <div>
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

  it("passes a partial selection through unchanged", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    await user.click(screen.getByTestId("pick-one"));
    expect(setSelectedTags).toHaveBeenCalledWith(["A"]);
  });
});
