import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Tag, Transaction } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: vi.fn(),
}));
vi.mock("../../../utils/ThemeContext.tsx", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("../../../dashboard/DateRangeBanner.tsx", () => ({
  DateRangeBanner: () => <div>Date range banner</div>,
}));
vi.mock("../../../dashboard/layout/WidgetGrid.tsx", () => ({
  WidgetGrid: () => <div>Widget grid</div>,
}));
vi.mock("../../../dashboard/tag/CategoryManagerDrawer.tsx", () => ({
  CategoryManagerDrawer: ({ open }: { open: boolean }) =>
    open ? <div>Category manager</div> : null,
}));

import { TagsTab } from "../../../dashboard/tag/TagsTab";
import { useWalletContext } from "../../../dashboard/wallet/WalletContext.tsx";

const mockedCtx = useWalletContext as unknown as ReturnType<typeof vi.fn>;

const food: Tag = {
  name: "Food",
  icon: "tag",
  colorHex: "#f0b85a",
  parentName: null,
};
const expense = {
  id: "t1",
  type: "EXPENSE",
  amount: 40,
  needsReview: false,
  tag: food,
} as unknown as Transaction;

function setCtx(transactions: Transaction[] = [expense]) {
  mockedCtx.mockReturnValue({
    wallet: {
      id: "w1",
      name: "W",
      icon: "wallet",
      color: "#8b5cf6",
      currency: "EUR",
      userRole: "OWNER",
    },
    tags: [food],
    filteredTransactions: transactions,
  });
}

describe("TagsTab", () => {
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  describe("v2", () => {
    it("replaces the title row with the category strip", () => {
      setUiVersion("v2");
      setCtx();
      render(<TagsTab />);

      expect(screen.queryByText("Visual Distribution")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Edit Layout" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("1 category")).toBeInTheDocument();
      expect(screen.getByText("Food 100%")).toBeInTheDocument();
    });

    it("opens the category manager from the strip", () => {
      setUiVersion("v2");
      setCtx();
      render(<TagsTab />);

      expect(screen.queryByText("Category manager")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Manage" }));
      expect(screen.getByText("Category manager")).toBeInTheDocument();
    });

    it("enters layout editing from Customize and leaves it with Done", () => {
      setUiVersion("v2");
      setCtx();
      render(<TagsTab />);

      fireEvent.click(
        screen.getByRole("button", { name: "Customize this page" }),
      );
      expect(
        screen.queryByRole("button", { name: "Customize this page" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("toolbar", { name: "Layout editing" }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Done" }));
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Customize this page" }),
      ).toBeInTheDocument();
    });

    it("keeps the date range banner at the bottom", () => {
      setUiVersion("v2");
      setCtx();
      render(<TagsTab />);
      expect(screen.getByText("Date range banner")).toBeInTheDocument();
    });
  });

  describe("v1", () => {
    it("keeps the title row and its header buttons", () => {
      setUiVersion("v1");
      setCtx();
      render(<TagsTab />);

      expect(screen.getByText("Visual Distribution")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Edit Layout" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Manage Categories" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("1 category")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Customize this page" }),
      ).not.toBeInTheDocument();
    });
  });
});
