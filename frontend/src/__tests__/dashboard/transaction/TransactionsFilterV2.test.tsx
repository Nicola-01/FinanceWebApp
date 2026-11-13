import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setUiVersion } from "../../../utils/uiVersion";

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
const state = vi.hoisted(() => ({ review: false, toCategorise: 2 }));

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
    activeTab: "transactions",
    toCategorise: Array.from({ length: state.toCategorise }, (_, i) => ({
      id: `r${i}`,
    })),
    onlyToCategorise: state.review,
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
    </div>
  ),
}));

import { TransactionsFilter } from "../../../dashboard/transaction/TransactionsFilter";

describe("TransactionsFilter (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    setSelectedTags.mockReset();
    setSearchQuery.mockReset();
    setOnlyToCategorise.mockReset();
    setDatePreset.mockReset();
    setDateRange.mockReset();
    state.review = false;
    state.toCategorise = 2;
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("renders a plain toolbar with no sticky or glass classes", () => {
    const { container } = render(<TransactionsFilter />);
    expect(container.querySelector(".sticky")).toBeNull();
    expect(container.querySelector(".backdrop-blur-xl")).toBeNull();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByLabelText("Search transactions")).toBeInTheDocument();
  });

  it("shows the to-categorise button with its count", () => {
    render(<TransactionsFilter />);
    const button = screen.getByRole("button", { name: /To categorise/ });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveTextContent("2");
  });

  it("hides the to-categorise button when nothing is pending", () => {
    state.toCategorise = 0;
    render(<TransactionsFilter />);
    expect(
      screen.queryByRole("button", { name: /To categorise/ }),
    ).not.toBeInTheDocument();
  });

  it("toggles review mode the same way as the v1 switch", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    await user.click(screen.getByRole("button", { name: /To categorise/ }));
    expect(setOnlyToCategorise).toHaveBeenCalledWith(true);
    expect(setDatePreset).toHaveBeenCalledWith("all");
    expect(setDateRange).toHaveBeenCalledWith({ start: null, end: null });
  });

  it("reflects review mode as pressed", () => {
    state.review = true;
    render(<TransactionsFilter />);
    expect(
      screen.getByRole("button", { name: /To categorise/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("picking tags leaves review mode", async () => {
    state.review = true;
    const user = userEvent.setup();
    render(<TransactionsFilter />);
    await user.click(screen.getByTestId("pick-all"));
    expect(setOnlyToCategorise).toHaveBeenCalledWith(false);
    expect(setSelectedTags).toHaveBeenCalledWith(null);
  });
});
