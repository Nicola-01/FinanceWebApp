import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Budget, Subscription, Tag, Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const { gaugeSpy, walletCtx } = vi.hoisted(() => ({
  gaugeSpy: vi.fn(),
  walletCtx: {
    subscriptions: [] as unknown[],
    tags: [] as unknown[],
  },
}));

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

vi.mock("@/components/ui/charts", () => ({
  Gauge: (props: Record<string, unknown>) => {
    gaugeSpy(props);
    return null;
  },
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: {
      id: "w1",
      name: "Main",
      icon: "wallet",
      color: "#7c3aed",
      currency: "EUR",
    } as Wallet,
    tags: walletCtx.tags,
    subscriptions: walletCtx.subscriptions,
  }),
}));

import { BudgetCard } from "../../../dashboard/budget/BudgetCard";

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  name: "Monthly",
  tagName: null,
  limitAmount: 1200,
  periodType: "MONTHLY",
  startDate: "2026-11-01",
  endDate: null,
  rollover: false,
  alertThresholds: [],
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  spent: 508.58,
  effectiveLimit: 1200,
  remaining: 691.42,
  percentUsed: 42,
  status: "OK",
  crossedThresholds: [],
  active: true,
  ...overrides,
});

const monthlyGym: Subscription = {
  id: "s1",
  name: "Gym",
  tag: { name: "Health", icon: "tag", colorHex: "#000000" } as Tag,
  amount: 120,
  originalAmount: 120,
  originalCurrency: "EUR",
  exchangeValue: 1,
  autoExchangeRate: false,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-10-20",
  nextExecutionDate: "2026-11-20",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 1,
};

const renderCard = (budget: Budget) =>
  render(
    <BudgetCard
      budget={budget}
      currency="EUR"
      canEdit={false}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  );

const lastGaugeProps = () =>
  gaugeSpy.mock.lastCall?.[0] as Record<string, unknown>;

describe("BudgetCard upcoming subscriptions (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    gaugeSpy.mockClear();
    walletCtx.subscriptions = [];
    walletCtx.tags = [];
    // Only Date is faked so the 14-days-left copy is stable.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
    setUiVersion("v1");
  });

  it("adds a due-soon segment and a still-due figure when subscriptions are due", () => {
    walletCtx.subscriptions = [monthlyGym];
    renderCard(makeBudget());

    // Figures row: spent, still due (120 from the Gym subscription), days left.
    expect(screen.getByText("still due")).toBeInTheDocument();
    expect(screen.getByText("120,00 €")).toBeInTheDocument();
    // 691,42 € minus the 120 due = 571,42 €.
    expect(screen.getByLabelText("571,42 €").closest("p")).toHaveTextContent(
      "571,42 € left",
    );
    // Spent arc is 42%; the due segment runs from there to 52% of the limit.
    expect(lastGaugeProps()).toMatchObject({
      value: expect.closeTo(52, 6),
      zoneDisplay: "fill",
      zones: [
        expect.objectContaining({
          from: 42,
          to: expect.closeTo(52, 6),
          color: "#c8705a",
        }),
      ],
      // The centre label stays on the spent percentage, not the drawn value.
      centerValue: 42,
      ariaLabel: "Budget used: 42%",
    });
    expect(document.querySelector("pattern")).toBeNull();
  });

  it("drops the removed 'after … still due' and 'in subscriptions still due' lines", () => {
    walletCtx.subscriptions = [monthlyGym];
    renderCard(makeBudget());

    expect(screen.queryByText(/after .* still due/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/in subscriptions still due/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/left after subscriptions/),
    ).not.toBeInTheDocument();
  });

  it("caps the due segment at the limit", () => {
    walletCtx.subscriptions = [{ ...monthlyGym, amount: 900 }];
    renderCard(makeBudget());

    expect(lastGaugeProps()).toMatchObject({
      value: 100,
      zones: [expect.objectContaining({ from: 42, to: 100 })],
    });
  });

  it("keeps the gauge unchanged without due subscriptions", () => {
    renderCard(makeBudget());

    // The still-due figure stays in the row at 0; the hero is the plain remaining amount.
    expect(screen.getByText("still due")).toBeInTheDocument();
    expect(screen.getByLabelText("691,42 €").closest("p")).toHaveTextContent(
      "691,42 € left",
    );
    expect(screen.getByText("14 days")).toBeInTheDocument();
    expect(lastGaugeProps()).toMatchObject({ value: 42 });
    expect(lastGaugeProps().zones).toBeUndefined();
  });
});

describe("BudgetCard header, hero and pace (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    gaugeSpy.mockClear();
    walletCtx.subscriptions = [];
    walletCtx.tags = [];
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
    setUiVersion("v1");
  });

  it.each([
    ["OK", "On track", 42, 200, 300],
    ["WARNING", "Close to the limit", 85, 200, 300],
    ["EXCEEDED", "Over budget", 133, -100, 400],
  ] as const)(
    "shows the %s status label in the header",
    (status, label, percentUsed, remaining, spent) => {
      renderCard(makeBudget({ status, percentUsed, remaining, spent }));

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it("shows 'Over by' exactly once for an exceeded card, in the gauge area", () => {
    renderCard(
      makeBudget({
        status: "EXCEEDED",
        spent: 400,
        remaining: -100,
        percentUsed: 133,
      }),
    );

    expect(screen.getAllByText(/Over by/)).toHaveLength(1);
    expect(screen.getByText(/Over by/)).toHaveTextContent("Over by 100,00 €");
    expect(screen.getByText("Over budget")).toBeInTheDocument();
  });

  it("sets the hero to remaining minus subscriptions still due", () => {
    walletCtx.subscriptions = [monthlyGym];
    renderCard(makeBudget());

    // 691,42 € remaining minus the 120 € Gym subscription still due.
    expect(screen.getByLabelText("571,42 €").closest("p")).toHaveTextContent(
      /^571,42 € left$/,
    );
  });

  it("shows the projected overspend when due subscriptions push past the limit", () => {
    walletCtx.subscriptions = [{ ...monthlyGym, amount: 900 }];
    renderCard(makeBudget({ status: "WARNING" }));

    // 691,42 € remaining minus 900 € due = 208,58 € over.
    expect(screen.getByText(/Over by/)).toHaveTextContent("Over by 208,58 €");
    expect(screen.getByText("Close to the limit")).toBeInTheDocument();
  });

  it("places a pace marker at the projected end-of-period committed spend", () => {
    walletCtx.subscriptions = [monthlyGym];
    renderCard(makeBudget());

    // 508,58 € over 16 of 30 days, plus 120 € due: about 1.073 € of 1.200 €.
    expect(document.querySelector("[data-pace-marker]")).not.toBeNull();
    expect(
      screen.getByRole("img", { name: /^Pace: about .*1[.,]073/ }),
    ).toBeInTheDocument();
  });

  it("no longer prints the 'after … still due' line under the hero", () => {
    walletCtx.subscriptions = [monthlyGym];
    renderCard(makeBudget());

    expect(screen.queryByText(/after 120/)).not.toBeInTheDocument();
    expect(screen.getByText("still due")).toBeInTheDocument();
  });
});

describe("BudgetCard alert ticks (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    walletCtx.subscriptions = [];
    walletCtx.tags = [];
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("draws one tick per alert threshold and labels them", () => {
    renderCard(makeBudget({ alertThresholds: [50, 80, 100], percentUsed: 60 }));

    const ticks = document.querySelectorAll("[data-alert-tick]");
    expect(ticks).toHaveLength(3);
    expect(
      screen.getByRole("img", { name: "Alerts at 50%, 80%, 100%" }),
    ).toBeInTheDocument();
    // Only the 50% tick has been passed at 60% used.
    expect(ticks[0]).toHaveAttribute("stroke", "var(--color-app-income)");
    expect(ticks[1]).toHaveAttribute("stroke", "var(--color-app-faint)");
  });

  it("draws no alert overlay without thresholds", () => {
    renderCard(makeBudget({ alertThresholds: [] }));
    expect(document.querySelectorAll("[data-alert-tick]")).toHaveLength(0);
  });
});
