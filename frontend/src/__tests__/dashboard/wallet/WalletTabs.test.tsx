import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
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
  // v2 fragment: first child is the desktop tabs wrapper; the bottom bar is the other tablist.
  const desktop = container.firstElementChild as HTMLElement;
  const bottom = screen
    .getAllByRole("tablist", { name: "Wallet sections" })
    .find((el) => !desktop.contains(el)) as HTMLElement;
  return { desktop, bottom };
};

describe("WalletTabs", () => {
  beforeEach(() => {
    ctx.setActiveTab.mockClear();
    // jsdom has no ResizeObserver; the desktop MotionHighlight observes its items.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

    it("desktop tabs show all six sections and select the clicked one", async () => {
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
          within(desktop).getByRole("tab", { name: label }),
        ).toBeInTheDocument();
      }
      expect(
        within(desktop).getByRole("tab", { name: "Transactions" }),
      ).toHaveAttribute("aria-selected", "true");
      fireEvent.click(within(desktop).getByRole("tab", { name: "Budget" }));
      await waitFor(() =>
        expect(ctx.setActiveTab).toHaveBeenCalledWith("budget"),
      );
    });

    // Ark tabs commit selection asynchronously after a click, hence waitFor.
    it("bottom navigation sets the tab for a bottom action", async () => {
      const { bottom } = renderTabs("transactions");
      fireEvent.click(
        within(bottom).getByRole("tab", { name: "Subscriptions" }),
      );
      await waitFor(() =>
        expect(ctx.setActiveTab).toHaveBeenCalledWith("subscription"),
      );
    });

    it("More opens a menu whose items set the tab", async () => {
      const { bottom } = renderTabs("transactions");
      fireEvent.click(within(bottom).getByRole("tab", { name: "More" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Statistics" }));
      await waitFor(() =>
        expect(ctx.setActiveTab).toHaveBeenCalledWith("statistics"),
      );
    });

    it("tapping More does not change the active tab", async () => {
      const { bottom } = renderTabs("transactions");
      fireEvent.click(within(bottom).getByRole("tab", { name: "More" }));
      await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
      await new Promise((r) => setTimeout(r, 20));
      expect(ctx.setActiveTab).not.toHaveBeenCalled();
      // The open MUI menu hides the rest of the page from role queries.
      expect(
        within(bottom).getByRole("tab", { name: "Transactions", hidden: true }),
      ).toHaveAttribute("aria-selected", "true");
    });

    it("selects More when the active tab lives under it", () => {
      const { bottom } = renderTabs("settings");
      expect(within(bottom).getByRole("tab", { name: "More" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("selects the active bottom tab", () => {
      const { bottom } = renderTabs("transactions");
      expect(
        within(bottom).getByRole("tab", { name: "Transactions" }),
      ).toHaveAttribute("aria-selected", "true");
    });

    it("the bottom highlight sits on the active bottom tab", () => {
      const { bottom } = renderTabs("budget");
      expect(
        within(bottom).getByRole("tab", { name: "Budget" }),
      ).toHaveAttribute("data-highlighted");
      expect(
        within(bottom).getByRole("tab", { name: "Transactions" }),
      ).not.toHaveAttribute("data-highlighted");
    });
  });
});
