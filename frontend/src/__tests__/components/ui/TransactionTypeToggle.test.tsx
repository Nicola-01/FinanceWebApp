import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  beforeEach(() => {
    setUiVersion("v2");
    // jsdom has no ResizeObserver; the MotionHighlight observes its items.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setUiVersion("v1");
    localStorage.clear();
  });

  it("renders a tablist with the chosen type selected", () => {
    render(<TransactionTypeToggle type="INCOME" setType={vi.fn()} />);
    expect(
      screen.getByRole("tablist", { name: "Transaction type" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Income" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Expense" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("keeps expense in the text colour and only income in the green", () => {
    render(<TransactionTypeToggle type="INCOME" setType={vi.fn()} />);
    const income = screen.getByRole("tab", { name: "Income" });
    expect(income.className).toContain("text-app-income");
    const expense = screen.getByRole("tab", { name: "Expense" });
    expect(expense.className).not.toContain("text-app-red");
    expect(expense.className).not.toContain("text-app-income");
  });

  it("still sets the type on click", async () => {
    const setType = vi.fn();
    render(<TransactionTypeToggle type="" setType={setType} />);
    fireEvent.click(screen.getByRole("tab", { name: "Expense" }));
    await waitFor(() => expect(setType).toHaveBeenCalledWith("EXPENSE"));
  });
});
