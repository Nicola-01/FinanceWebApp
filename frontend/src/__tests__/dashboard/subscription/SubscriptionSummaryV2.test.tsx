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
    expect(screen.getByLabelText("12,00 €")).toBeInTheDocument();
    expect(screen.getByLabelText("144,00 €")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
