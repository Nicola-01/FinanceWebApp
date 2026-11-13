import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Insight } from "../../../dashboard/statistics/statisticsInsights.ts";
import { WorthKnowingCard } from "../../../dashboard/statistics/WorthKnowingCard.tsx";

const iconCalls = vi.hoisted(() => [] as { icon: string; color: string }[]);

vi.mock("../../../components/ui/CategoryIcon.tsx", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../components/ui/CategoryIcon.tsx")
    >();
  return {
    ...actual,
    CategoryIcon: (props: { icon: string; color: string }) => {
      iconCalls.push({ icon: props.icon, color: props.color });
      return actual.CategoryIcon(props as never);
    },
  };
});

const insights: Insight[] = [
  {
    id: "expensive-month",
    tone: "danger",
    title: "Heaviest month: March",
    detail: "You spent 1,200 more than usual.",
  },
  {
    id: "best-month",
    tone: "income",
    title: "Best month: June",
    detail: "Income exceeded spending by 900.",
  },
  {
    id: "subscriptions",
    tone: "recurring",
    title: "Subscriptions cost 45 a month",
    detail: "Across 4 active subscriptions.",
  },
  {
    id: "income-steady",
    tone: "neutral",
    title: "Income is steady",
    detail: "Monthly income varies by less than 5%.",
  },
];

describe("WorthKnowingCard", () => {
  it("renders nothing when there are no insights", () => {
    const { container } = render(<WorthKnowingCard insights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the card heading and every insight title and detail", () => {
    render(<WorthKnowingCard insights={insights} />);
    expect(screen.getByText("Worth knowing")).toBeInTheDocument();
    expect(
      screen.getByText("Computed from your transactions."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(insights.length);
    for (const insight of insights) {
      expect(screen.getByText(insight.title)).toBeInTheDocument();
      expect(screen.getByText(insight.detail)).toBeInTheDocument();
    }
  });

  it("maps each tone to its icon and colour", () => {
    iconCalls.length = 0;
    render(<WorthKnowingCard insights={insights} />);
    expect(iconCalls).toEqual([
      { icon: "exclamation", color: "var(--color-app-danger)" },
      { icon: "invest", color: "var(--color-app-income)" },
      { icon: "calendar", color: "var(--color-app-expense-mark)" },
      { icon: "scale", color: "var(--color-app-muted)" },
    ]);
  });

  it("separates items with a top hairline except the first", () => {
    render(<WorthKnowingCard insights={insights} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).not.toHaveClass("border-t");
    for (const item of items.slice(1)) {
      expect(item).toHaveClass("border-t", "border-app-border");
    }
  });
});
