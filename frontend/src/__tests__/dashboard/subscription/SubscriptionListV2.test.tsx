import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Subscription } from "../../../types/domain";
import { SubscriptionListV2 } from "../../../dashboard/subscription/SubscriptionListV2";
import { SubscriptionRowV2 } from "../../../dashboard/subscription/SubscriptionRowV2";
import { setUiVersion } from "../../../utils/uiVersion";

const sub = (over: Partial<Subscription>) =>
  ({
    id: "s",
    name: "Netflix",
    type: "EXPENSE",
    amount: 12.99,
    originalCurrency: "EUR",
    status: "ACTIVE",
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    startDate: "2026-01-01",
    nextExecutionDate: "2026-03-13",
    history: [],
    tag: { name: "Fun", icon: "tag", colorHex: "#f00" },
    ...over,
  }) as unknown as Subscription;

const past = {
  groupedPastSubs: {},
  sortedMonthKeys: [],
  visibleMonthsCount: 4,
  onLoadMore: () => {},
  isExpanded: () => false,
  onToggleMonth: () => {},
};

describe("SubscriptionRowV2", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
  });
  afterEach(() => vi.useRealTimers());

  it("shows the overdue label in danger with an icon", () => {
    const { container } = render(
      <SubscriptionRowV2
        subscription={sub({ nextExecutionDate: "2026-03-08" })}
        date="2026-03-08"
      />,
    );
    const due = screen.getByText("2 days overdue");
    expect(due.className).toContain("text-app-danger");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("tones a payment due within 3 days as warn and the rest as muted", () => {
    const { rerender } = render(
      <SubscriptionRowV2
        subscription={sub({ nextExecutionDate: "2026-03-13" })}
        date="2026-03-13"
      />,
    );
    expect(screen.getByText("in 3 days").className).toContain("text-app-warn");
    rerender(
      <SubscriptionRowV2
        subscription={sub({ nextExecutionDate: "2026-03-20" })}
        date="2026-03-20"
      />,
    );
    expect(screen.getByText("in 10 days").className).toContain(
      "text-app-muted",
    );
  });

  it("colours income green and hides the due label when showDue is false", () => {
    const { container } = render(
      <SubscriptionRowV2
        subscription={sub({ type: "INCOME", amount: 1750 })}
        date="2026-03-20"
        showDue={false}
      />,
    );
    expect(container.querySelector(".text-app-income")).not.toBeNull();
    expect(container.textContent).toContain("Fun · every month");
    expect(container.textContent).not.toMatch(/days?/);
  });

  it("calls onClick when the row is pressed", () => {
    const onClick = vi.fn();
    render(
      <SubscriptionRowV2
        subscription={sub({})}
        date="2026-03-13"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("SubscriptionListV2", () => {
  beforeEach(() => {
    setUiVersion("v2");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    setUiVersion("v1");
  });

  it("groups upcoming payments into Due now, This month and Later", () => {
    render(
      <SubscriptionListV2
        past={past}
        subscriptions={[
          sub({ id: "a", name: "Overdue", nextExecutionDate: "2026-03-08" }),
          sub({ id: "b", name: "Soon", nextExecutionDate: "2026-03-13" }),
          sub({ id: "c", name: "Month", nextExecutionDate: "2026-03-25" }),
          sub({ id: "d", name: "Far", nextExecutionDate: "2026-09-01" }),
        ]}
      />,
    );
    const heading = (t: string) => screen.getByRole("heading", { name: t });
    expect(heading("Due now")).toBeTruthy();
    expect(heading("This month")).toBeTruthy();
    expect(heading("Later")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Far/ })).toBeTruthy();
  });

  it("omits empty groups", () => {
    render(
      <SubscriptionListV2
        past={past}
        subscriptions={[sub({ nextExecutionDate: "2026-03-13" })]}
      />,
    );
    expect(screen.queryByRole("heading", { name: "Later" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "This month" })).toBeNull();
  });
});
