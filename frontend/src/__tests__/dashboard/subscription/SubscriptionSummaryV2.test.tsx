import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Subscription } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";
import { SubscriptionSummaryV2 } from "../../../dashboard/subscription/SubscriptionSummaryV2";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

const sub = (over: Partial<Subscription>) =>
  ({
    id: over.id ?? "s",
    name: "Netflix",
    type: "EXPENSE",
    amount: 12,
    status: "ACTIVE",
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    tag: { name: "Fun", icon: "tag", colorHex: "#f00" },
    ...over,
  }) as unknown as Subscription;

describe("SubscriptionSummaryV2", () => {
  afterEach(() => {
    setUiVersion("v1");
  });

  it("animates the tile amounts and the split-bar percentages (v2)", () => {
    setUiVersion("v2");
    render(
      <SubscriptionSummaryV2
        currency="EUR"
        subscriptions={[sub({ id: "a", amount: 12 })]}
      />,
    );
    expect(screen.getByText("Recurring cost / month")).toBeInTheDocument();
    expect(screen.getByText("Over a year")).toBeInTheDocument();
    expect(screen.getByText("1 subscription")).toBeInTheDocument();
    expect(screen.getByText("Recurring income / month")).toBeInTheDocument();
    expect(screen.getByLabelText("12,00 €")).toBeInTheDocument();
    expect(screen.getByLabelText("144,00 €")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders four tiles, with Invested only when it is non-zero", () => {
    setUiVersion("v2");
    const { container, rerender } = render(
      <SubscriptionSummaryV2
        currency="EUR"
        subscriptions={[sub({ id: "a", amount: 12 })]}
      />,
    );
    expect(container.querySelectorAll("[data-stat-value]")).toHaveLength(3);
    expect(
      screen.queryByText("Recurring invested / month"),
    ).not.toBeInTheDocument();
    rerender(
      <SubscriptionSummaryV2
        currency="EUR"
        invest={new Set(["Fund"])}
        subscriptions={[
          sub({ id: "a", amount: 12 }),
          sub({
            id: "pac",
            amount: 30,
            tag: { name: "Fund", icon: "tag", colorHex: "#b39cf5" },
          }),
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-stat-value]")).toHaveLength(4);
    expect(screen.getByText("Recurring invested / month")).toBeInTheDocument();
  });

  it("adds a Recurring invested / month tile for investment subscriptions", () => {
    setUiVersion("v2");
    render(
      <SubscriptionSummaryV2
        currency="EUR"
        invest={new Set(["Fund"])}
        subscriptions={[
          sub({ id: "rent", amount: 420 }),
          sub({
            id: "pac",
            amount: 300,
            tag: { name: "Fund", icon: "tag", colorHex: "#b39cf5" },
          }),
        ]}
      />,
    );
    expect(screen.getByLabelText("420,00 €")).toBeInTheDocument();
    expect(screen.getByText("Recurring invested / month")).toBeInTheDocument();
    expect(screen.getByLabelText("300,00 €")).toBeInTheDocument();
  });
});
