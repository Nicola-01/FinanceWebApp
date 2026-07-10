import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Subscription, Wallet } from "../../../utils/types";
import { SubscriptionView } from "../../../modals/subscription/SubscriptionView";

vi.mock("../../../components/ui/TagBadge.tsx", () => ({
  TagBadge: () => <div data-testid="tag-badge" />,
}));
vi.mock("../../../modals/TransactionModal/ExchangeRateSection", () => ({
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
    originalCurrency: "EUR",
    exchangeValue: 1,
    ...over,
  }) as unknown as Subscription;

describe("SubscriptionView", () => {
  it("renders an expense amount with a minus sign", () => {
    const { container } = render(
      <SubscriptionView sub={makeSub({})} wallet={wallet} />,
    );
    expect(container.textContent).toContain("-9.99");
  });

  it("renders an income amount with a plus sign", () => {
    const { container } = render(
      <SubscriptionView
        sub={makeSub({ type: "INCOME", amount: 5 })}
        wallet={wallet}
      />,
    );
    expect(container.textContent).toContain("+5.00");
  });

  it("renders a singular frequency label for interval 1", () => {
    render(<SubscriptionView sub={makeSub({})} wallet={wallet} />);
    expect(screen.getByText("Every month")).toBeInTheDocument();
  });

  it("shows the status", () => {
    render(
      <SubscriptionView sub={makeSub({ status: "PAUSED" })} wallet={wallet} />,
    );
    expect(screen.getByText("PAUSED")).toBeInTheDocument();
  });

  it("labels a FOREVER duration", () => {
    render(<SubscriptionView sub={makeSub({})} wallet={wallet} />);
    expect(screen.getByText("Forever")).toBeInTheDocument();
  });

  it("labels a TIMES duration with the run count", () => {
    render(
      <SubscriptionView
        sub={makeSub({ duration: "TIMES", durationTimes: 3, executedTimes: 1 })}
        wallet={wallet}
      />,
    );
    expect(screen.getByText(/Runs 3 times/)).toBeInTheDocument();
  });

  it("shows notes only when present", () => {
    const { rerender } = render(
      <SubscriptionView sub={makeSub({})} wallet={wallet} />,
    );
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();

    rerender(
      <SubscriptionView
        sub={makeSub({ notes: "Family plan" })}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("Family plan")).toBeInTheDocument();
  });

  it("shows 'Reminder' instead of the amount for reminder subscriptions", () => {
    render(
      <SubscriptionView
        sub={makeSub({ amount: 0, amountPending: true })}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("Reminder")).toBeInTheDocument();
  });

  it("renders the exchange section only for a foreign currency", () => {
    const { rerender } = render(
      <SubscriptionView
        sub={makeSub({ originalCurrency: "EUR" })}
        wallet={wallet}
      />,
    );
    expect(screen.queryByTestId("exchange")).not.toBeInTheDocument();

    rerender(
      <SubscriptionView
        sub={makeSub({ originalCurrency: "USD" })}
        wallet={wallet}
      />,
    );
    expect(screen.getByTestId("exchange")).toBeInTheDocument();
  });
});
