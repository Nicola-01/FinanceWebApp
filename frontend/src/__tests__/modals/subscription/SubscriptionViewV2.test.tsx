import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Subscription, Wallet } from "../../../types/domain";
import { SubscriptionView } from "../../../modals/subscription/SubscriptionView";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../components/ui/TagBadge.tsx", () => ({
  TagBadge: () => <div data-testid="tag-badge" />,
}));
vi.mock("../../../modals/common/exchangeRate/ExchangeRateSection", () => ({
  ExchangeRateSection: () => <div data-testid="exchange" />,
}));

const wallet = { currency: "EUR" } as unknown as Wallet;

const makeSub = (over: Partial<Subscription>): Subscription =>
  ({
    id: "s1",
    name: "Netflix",
    type: "EXPENSE",
    amount: 9.99,
    status: "ACTIVE",
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    duration: "FOREVER",
    startDate: "2025-01-10",
    nextExecutionDate: "2025-02-10",
    ...over,
  }) as unknown as Subscription;

describe("SubscriptionView (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("shows the expense amount as a neutral hero", () => {
    render(<SubscriptionView sub={makeSub({})} wallet={wallet} />);
    const amount = screen.getByText("-9.99", { exact: false });
    expect(amount).toHaveClass("text-5xl", "text-app-text");
  });

  it("shows the reminder placeholder for amount-pending subscriptions", () => {
    render(
      <SubscriptionView
        sub={makeSub({ amountPending: true } as never)}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("Reminder")).toBeInTheDocument();
  });

  it("shows the status as a sentence-case pill", () => {
    render(
      <SubscriptionView sub={makeSub({ status: "PAUSED" })} wallet={wallet} />,
    );
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.queryByText("PAUSED")).not.toBeInTheDocument();
  });

  it("renders the schedule group with frequency, next run and start", () => {
    render(<SubscriptionView sub={makeSub({})} wallet={wallet} />);
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Every month")).toBeInTheDocument();
    expect(screen.getByText("Forever")).toBeInTheDocument();
    expect(screen.getByText("Next run")).toBeInTheDocument();
    expect(screen.getByText("Started on")).toBeInTheDocument();
  });

  it("shows the bank-driven runs row instead of a schedule", () => {
    render(
      <SubscriptionView
        sub={makeSub({ bankDriven: true } as never)}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("Runs")).toBeInTheDocument();
    expect(screen.getByText("Date from bank")).toBeInTheDocument();
    expect(screen.queryByText("Every month")).not.toBeInTheDocument();
  });

  it("shows the Open Banking card only when a bank rule is set", () => {
    const { rerender } = render(
      <SubscriptionView sub={makeSub({})} wallet={wallet} />,
    );
    expect(screen.queryByText("Open Banking")).not.toBeInTheDocument();
    rerender(
      <SubscriptionView
        sub={makeSub({ bankRuleName: "Netflix charge" } as never)}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("Open Banking")).toBeInTheDocument();
    expect(screen.getByText("Netflix charge")).toBeInTheDocument();
  });

  it("shows notes under the Notes label only when present", () => {
    const { rerender } = render(
      <SubscriptionView
        sub={makeSub({ notes: "Family plan" })}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Family plan")).toBeInTheDocument();
    rerender(<SubscriptionView sub={makeSub({ notes: "" })} wallet={wallet} />);
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });
});
