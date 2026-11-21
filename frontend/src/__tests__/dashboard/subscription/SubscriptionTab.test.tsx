import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setUiVersion } from "../../../utils/uiVersion";
import { SubscriptionTab } from "../../../dashboard/subscription/SubscriptionTab";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    subscriptions: [{ id: "s1" }],
    transactions: [],
    fetchData: vi.fn(),
    isLoading: false,
    wallet: { id: "w1", color: "#ff0000", currency: "EUR" },
    tags: [],
  }),
}));
vi.mock("../../../dashboard/wallet/useInvestmentTags.ts", () => ({
  useInvestmentTags: () => new Set<string>(),
}));
vi.mock("../../../dashboard/subscription/SubscriptionSummaryV2.tsx", () => ({
  SubscriptionSummaryV2: () => <div data-testid="summary-stub" />,
}));
vi.mock("../../../dashboard/subscription/SubscriptionList.tsx", () => ({
  SubscriptionList: () => <div data-testid="list-stub" />,
}));
vi.mock("../../../dashboard/subscription/SubscriptionCalendar.tsx", () => ({
  SubscriptionCalendar: () => <div data-testid="calendar-stub" />,
}));
vi.mock("../../../modals/subscription/SubscriptionModal.tsx", () => ({
  SubscriptionModal: () => null,
}));
vi.mock("../../../modals/subscription/SubscriptionDetailsModal.tsx", () => ({
  SubscriptionDetailsModal: () => null,
}));
vi.mock("../../../modals/transaction/TransactionDetailsModal.tsx", () => ({
  TransactionDetailsModal: () => null,
}));
vi.mock("../../../modals/transaction/TransactionModal.tsx", () => ({
  TransactionModal: () => null,
}));

describe("SubscriptionTab view toggle", () => {
  afterEach(() => {
    setUiVersion("v1");
  });

  it("v2: renders the summary before the List | Calendar toggle", () => {
    setUiVersion("v2");
    render(<SubscriptionTab />);
    const summary = screen.getByTestId("summary-stub");
    const toggle = screen.getByRole("tablist");
    expect(
      summary.compareDocumentPosition(toggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("v2: the header holds only the title, not the toggle", () => {
    setUiVersion("v2");
    render(<SubscriptionTab />);
    const heading = screen.getByRole("heading", { name: "Subscriptions" });
    expect(heading.parentElement).not.toContainElement(
      screen.getByRole("tablist"),
    );
  });

  it("v2: toggle spans full width and only goes compact from sm up", () => {
    setUiVersion("v2");
    render(<SubscriptionTab />);
    const list = screen.getByRole("tablist");
    expect(list).toHaveClass("w-full", "sm:w-72");
    expect(list).not.toHaveClass("w-fit");
  });

  it("v2: segments carry no inline wallet colour", () => {
    setUiVersion("v2");
    render(<SubscriptionTab />);
    const tab = screen.getByRole("tab", { name: "List" });
    expect(tab.style.color).toBe("");
  });

  it("v2: switching to Calendar shows the calendar view", async () => {
    setUiVersion("v2");
    render(<SubscriptionTab />);
    expect(screen.getByTestId("list-stub")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Calendar" }));
    expect(screen.getByTestId("calendar-stub")).toBeInTheDocument();
  });

  it("v1: toggle stays in the header with the wallet-coloured active label", () => {
    setUiVersion("v1");
    render(<SubscriptionTab />);
    const active = screen.getByRole("button", { name: "List" });
    expect(active.style.color).toBe("rgb(255, 0, 0)");
    expect(active.parentElement).toHaveClass("w-full", "sm:w-72");
    expect(screen.queryByTestId("summary-stub")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Subscriptions" })).toBeNull();
  });
});
