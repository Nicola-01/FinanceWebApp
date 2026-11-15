import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryStrip } from "../../../dashboard/tag/CategoryStrip";
import type { Tag, Transaction } from "../../../types/domain";

const tag = (
  name: string,
  parentName: string | null = null,
  colorHex = "#123456",
): Tag => ({
  name,
  icon: "tag",
  colorHex,
  parentName,
});

const expense = (amount: number, t: Tag): Transaction =>
  ({
    id: `${t.name}-${amount}`,
    type: "EXPENSE",
    amount,
    tag: t,
  }) as unknown as Transaction;

const names = ["Food", "Home", "Car", "Fun", "Pets"];
const tags = names.map((n, i) => tag(n, null, `#${String(i + 1).repeat(6)}`));
const spend = names.map((n, i) => expense(100 - i * 10, tags[i]));

describe("CategoryStrip", () => {
  it("shows the number of categories and a Manage button that opens the manager", () => {
    const onManage = vi.fn();
    render(
      <CategoryStrip transactions={spend} tags={tags} onManage={onManage} />,
    );

    expect(screen.getByText("5 categories")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(onManage).toHaveBeenCalledTimes(1);
  });

  it("uses the singular for a single category", () => {
    render(
      <CategoryStrip transactions={[]} tags={[tags[0]]} onManage={vi.fn()} />,
    );
    expect(screen.getByText("1 category")).toBeInTheDocument();
  });

  it("shows the top four expense categories with their share", () => {
    render(
      <CategoryStrip transactions={spend} tags={tags} onManage={vi.fn()} />,
    );

    // Shares: 100, 90, 80, 70, 60 of 400 total.
    expect(screen.getByText("Food 25%")).toBeInTheDocument();
    expect(screen.getByText("Home 23%")).toBeInTheDocument();
    expect(screen.getByText("Car 20%")).toBeInTheDocument();
    expect(screen.getByText("Fun 18%")).toBeInTheDocument();
  });

  it("collapses the rest into a +K chip for each breakpoint", () => {
    render(
      <CategoryStrip transactions={spend} tags={tags} onManage={vi.fn()} />,
    );

    // Five categories with spending: +1 on wide screens, +2 on phones (the 4th chip is hidden there).
    expect(screen.getByText("+1")).toHaveClass("max-sm:hidden");
    expect(screen.getByText("+2")).toHaveClass("sm:hidden");
  });

  it("shows no +K chip when every spending category is already visible", () => {
    render(
      <CategoryStrip
        transactions={spend.slice(0, 3)}
        tags={tags}
        onManage={vi.fn()}
      />,
    );
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("shows a muted line instead of chips when nothing was spent", () => {
    render(<CategoryStrip transactions={[]} tags={tags} onManage={vi.fn()} />);
    expect(screen.getByText("No spending in this period")).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});
