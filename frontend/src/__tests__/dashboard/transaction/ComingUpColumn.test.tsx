import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingUpColumn } from "../../../dashboard/transaction/ComingUpColumn";
import type { ComingUpItem } from "../../../dashboard/transaction/comingUp";
import type { Subscription } from "../../../types/domain";

const item = (
  id: string,
  patch: Partial<Subscription>,
  days: number,
  label: string,
): ComingUpItem => ({
  sub: {
    id,
    name: `Sub ${id}`,
    amount: 12.99,
    type: "EXPENSE",
    status: "ACTIVE",
    tag: { name: "Film", icon: "film", colorHex: "#ff5a5a" },
    ...patch,
  } as Subscription,
  days,
  label,
  soon: days <= 3,
});

describe("ComingUpColumn", () => {
  it("shows the empty line when nothing is due", () => {
    render(<ComingUpColumn items={[]} currency="EUR" />);
    expect(
      screen.getByText("Nothing due in the next 31 days"),
    ).toBeInTheDocument();
  });

  it("renders name, signed amount and relative due label", () => {
    render(
      <ComingUpColumn
        items={[
          item("a", {}, 2, "in 2 days"),
          item("b", { type: "INCOME", amount: 1750 }, 15, "in 15 days"),
        ]}
        currency="EUR"
      />,
    );
    expect(screen.getByText("Coming up")).toBeInTheDocument();
    expect(screen.getByText("Sub a")).toBeInTheDocument();
    expect(screen.getByText("−12,99 €")).toBeInTheDocument();
    expect(screen.getByText(/^\+1\D?750,00 €$/)).toBeInTheDocument();
    expect(screen.getByText("in 2 days")).toHaveClass("text-app-warn");
    expect(screen.getByText("in 15 days")).toHaveClass("text-app-muted");
  });
});
