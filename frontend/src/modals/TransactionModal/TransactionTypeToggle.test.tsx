import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionTypeToggle } from "./TransactionTypeToggle";

describe("TransactionTypeToggle", () => {
  it("calls setType('EXPENSE') when Expense is clicked", async () => {
    const setType = vi.fn();
    const user = userEvent.setup();
    render(<TransactionTypeToggle type="" setType={setType} />);
    await user.click(screen.getByRole("button", { name: "Expense" }));
    expect(setType).toHaveBeenCalledWith("EXPENSE");
  });

  it("calls setType('INCOME') when Income is clicked", async () => {
    const setType = vi.fn();
    const user = userEvent.setup();
    render(<TransactionTypeToggle type="" setType={setType} />);
    await user.click(screen.getByRole("button", { name: "Income" }));
    expect(setType).toHaveBeenCalledWith("INCOME");
  });

  it("highlights the active type", () => {
    render(<TransactionTypeToggle type="EXPENSE" setType={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Expense" }).className).toContain(
      "text-app-red",
    );
  });
});
