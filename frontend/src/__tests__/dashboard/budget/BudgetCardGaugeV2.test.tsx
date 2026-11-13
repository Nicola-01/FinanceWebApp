import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Budget } from "../../../types/domain";
import type { Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const { gaugeSpy } = vi.hoisted(() => ({ gaugeSpy: vi.fn() }));

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

// jsdom cannot lay out the chart kit; the stub records the props it receives.
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
    tags: [],
  }),
}));

import { BudgetCard } from "../../../dashboard/budget/BudgetCard";

const makeBudget = (overrides: Partial<Budget>): Budget => ({
  id: "b1",
  name: "Food budget",
  tagName: "Food",
  limitAmount: 300,
  periodType: "MONTHLY",
  startDate: "2026-07-01",
  endDate: null,
  rollover: false,
  alertThresholds: [80, 100],
  periodStart: "2026-07-01",
  periodEnd: "2099-07-31",
  spent: 250,
  effectiveLimit: 300,
  remaining: 50,
  percentUsed: 83,
  status: "WARNING",
  crossedThresholds: [80],
  active: true,
  ...overrides,
});

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

describe("BudgetCard gauge (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    gaugeSpy.mockClear();
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("draws a solid responsive arc with the real percentage in the centre", () => {
    renderCard(makeBudget({ percentUsed: 83, status: "WARNING" }));

    const props = lastGaugeProps();
    expect(props).toMatchObject({
      arcStyle: "solid",
      arcThickness: 0.05,
      inactiveFillOpacity: 0.6,
      minWidth: 0,
      value: 83,
      centerValue: 83,
      suffix: "%",
      defaultLabel: "used",
      formatOptions: { maximumFractionDigits: 0, notation: "standard" },
      activeFill: "var(--color-app-warn-fill)",
      ariaLabel: "Budget used: 83%",
    });
    // Fixed size and our own track colour are gone: the kit default track applies.
    expect(props).not.toHaveProperty("width");
    expect(props).not.toHaveProperty("height");
    expect(props).not.toHaveProperty("inactiveFill");
  });

  it("switches the centre number to compact notation above 1000%", () => {
    renderCard(
      makeBudget({
        spent: 22416,
        remaining: -22116,
        percentUsed: 22416,
        status: "EXCEEDED",
      }),
    );

    expect(lastGaugeProps()).toMatchObject({
      value: 100,
      centerValue: 22416,
      formatOptions: { maximumFractionDigits: 0, notation: "compact" },
    });
  });

  it("clamps the arc at 100 but keeps the real percentage above it", () => {
    renderCard(
      makeBudget({
        spent: 400,
        remaining: -100,
        percentUsed: 133,
        status: "EXCEEDED",
      }),
    );

    expect(lastGaugeProps()).toMatchObject({
      value: 100,
      centerValue: 133,
      activeFill: "var(--color-app-danger)",
      ariaLabel: "Budget used: 133%",
      ariaDescription: "133%",
    });
  });

  it("uses the income token for on-track budgets", () => {
    renderCard(makeBudget({ percentUsed: 20, status: "OK" }));

    expect(lastGaugeProps()).toMatchObject({
      value: 20,
      activeFill: "var(--color-app-income)",
    });
  });

  it("captions the amounts with the currency symbol", () => {
    renderCard(makeBudget({ spent: 250, effectiveLimit: 300 }));

    expect(screen.getByLabelText("250,00 €").closest("p")).toHaveTextContent(
      "250,00 € of 300,00 €",
    );
  });

  it("formats the left line like the caption (formatAmount plus symbol)", () => {
    renderCard(makeBudget({ remaining: 50 }));

    expect(screen.getByLabelText("50,00 €").closest("p")).toHaveTextContent(
      /^50,00 € left · /,
    );
  });

  it("shows 0,00 € left once the budget is exceeded", () => {
    renderCard(
      makeBudget({
        spent: 400,
        remaining: -100,
        percentUsed: 133,
        status: "EXCEEDED",
      }),
    );

    expect(screen.getByLabelText("0,00 €").closest("p")).toHaveTextContent(
      /^0,00 € left · /,
    );
  });
});
