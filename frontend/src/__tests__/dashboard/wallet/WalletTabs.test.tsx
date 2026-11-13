import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { WalletTabs } from "../../../dashboard/wallet/WalletTabs";
import { setUiVersion } from "../../../utils/uiVersion";

const { ctx } = vi.hoisted(() => ({
  ctx: {
    activeTab: "transactions" as string,
    setActiveTab: vi.fn(),
    wallet: { color: "#8b5cf6" },
  },
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx,
}));

const renderTabs = (activeTab: string) => {
  ctx.activeTab = activeTab;
  const { container } = render(<WalletTabs />);
  // v2 fragment: first child is the desktop Selector wrapper, the bottom bar is the MUI Paper.
  const desktop = container.firstElementChild as HTMLElement;
  const bottom = container.querySelector(".MuiPaper-root") as HTMLElement;
  return { desktop, bottom };
};

describe("WalletTabs", () => {
  beforeEach(() => {
    ctx.setActiveTab.mockClear();
  });

  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("v1 keeps the uppercase tab buttons", () => {
    setUiVersion("v1");
    render(<WalletTabs />);
    expect(
      screen.getByRole("button", { name: "Transactions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  describe("v2", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    it("desktop selector shows all six tabs and sets the clicked one", () => {
      const { desktop } = renderTabs("transactions");
      for (const label of [
        "Transactions",
        "Subscriptions",
        "Categories",
        "Statistics",
        "Budget",
        "Settings",
      ]) {
        expect(
          within(desktop).getByRole("button", { name: label }),
        ).toBeInTheDocument();
      }
      fireEvent.click(within(desktop).getByRole("button", { name: "Budget" }));
      expect(ctx.setActiveTab).toHaveBeenCalledWith("budget");
    });

    it("bottom navigation sets the tab for a bottom action", () => {
      const { bottom } = renderTabs("transactions");
      fireEvent.click(
        within(bottom).getByRole("button", { name: "Subscriptions" }),
      );
      expect(ctx.setActiveTab).toHaveBeenCalledWith("subscription");
    });

    it("More opens a menu whose items set the tab", () => {
      const { bottom } = renderTabs("transactions");
      fireEvent.click(within(bottom).getByRole("button", { name: "More" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Statistics" }));
      expect(ctx.setActiveTab).toHaveBeenCalledWith("statistics");
    });

    it("selects More when the active tab lives under it", () => {
      const { bottom } = renderTabs("settings");
      expect(within(bottom).getByRole("button", { name: "More" })).toHaveClass(
        "Mui-selected",
      );
    });
  });
});
