import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { Subscription } from "../../../types/domain";

vi.mock("../../../components/ui/TagBadge.tsx", () => ({
  TagBadge: () => <div />,
}));

import { SubscriptionCard } from "../../../dashboard/subscription/SubscriptionCard";

const sub = (over: Partial<Subscription>) =>
  ({
    id: "s",
    name: "Netflix",
    type: "EXPENSE",
    amount: 12.99,
    status: "ACTIVE",
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    nextExecutionDate: "2026-01-01",
    tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
    ...over,
  }) as unknown as Subscription;

describe("SubscriptionCard", () => {
  it("shows 'bank' and no countdown for a bank-driven subscription", () => {
    const { container } = render(
      <SubscriptionCard
        subscription={sub({ bankDriven: true })}
        date="2026-01-01"
      />,
    );
    expect(container.textContent).toContain("/ bank");
    expect(container.textContent).not.toMatch(/day|overdue|today/i);
  });

  it("shows the compact frequency for a scheduled subscription", () => {
    const { container } = render(
      <SubscriptionCard subscription={sub({})} date="2026-01-01" />,
    );
    expect(container.textContent).toContain("/ mo");
  });
});
