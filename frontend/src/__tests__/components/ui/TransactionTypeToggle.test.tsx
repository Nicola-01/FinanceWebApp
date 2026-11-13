import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionTypeToggle } from "../../../components/ui/TransactionTypeToggle";
import { setUiVersion } from "../../../utils/uiVersion";

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

describe("TransactionTypeToggle v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("keeps expense in the text colour and only income in the green", () => {
    render(<TransactionTypeToggle type="INCOME" setType={vi.fn()} />);
    const income = screen.getByRole("button", { name: "Income" });
    expect(income.className).toContain("bg-app-raised");
    expect(income.className).toContain("text-app-income");
    const expense = screen.getByRole("button", { name: "Expense" });
    expect(expense.className).not.toContain("text-app-red");
  });

  it("still sets the type on click", async () => {
    const user = userEvent.setup();
    const setType = vi.fn();
    render(<TransactionTypeToggle type="" setType={setType} />);
    await user.click(screen.getByRole("button", { name: "Expense" }));
    expect(setType).toHaveBeenCalledWith("EXPENSE");
  });
});
