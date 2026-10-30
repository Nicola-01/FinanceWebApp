import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
// The date picker reads ThemeContext, not provided here — stub it with a
// button that emits a fixed range.
vi.mock("../../../components/datePicker/CustomDatePicker", () => ({
  default: ({ onChange }: { onChange: (v: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ start: new Date(2026, 7, 1), end: new Date(2026, 7, 15) })
      }
    >
      pick range
    </button>
  ),
}));

import { BudgetFormOverlay } from "../../../dashboard/budget/BudgetFormOverlay";
import type { Tag } from "../../../types/domain";

const tags: Tag[] = [
  { name: "Food", icon: "utensils", colorHex: "#34d399" },
  { name: "Rent", icon: "house", colorHex: "#60a5fa" },
];

describe("BudgetFormOverlay", () => {
  const onSubmit = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  const renderForm = () =>
    render(
      <BudgetFormOverlay
        open
        initial={null}
        tags={tags}
        accentColor="#7c3aed"
        currency="EUR"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

  it("renders the create form with default thresholds", () => {
    renderForm();
    expect(screen.getByText(/new budget/i)).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("swaps rollover for the date range on the custom period", async () => {
    renderForm();
    const rollover = /roll over unused budget/i;
    expect(screen.getByRole("switch", { name: rollover })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Custom" }));
    expect(screen.queryByRole("switch", { name: rollover })).toBeNull();
    // Custom range without dates can't be submitted.
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Trip" },
    });
    fireEvent.change(screen.getByLabelText(/limit/i), {
      target: { value: "500" },
    });
    const submit = screen.getByRole("button", { name: /create budget/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /pick range/i }));
    fireEvent.click(submit);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          periodType: "CUSTOM",
          startDate: "2026-08-01",
          endDate: "2026-08-15",
        }),
      ),
    );
  });

  it("adds a new threshold on blur and cancels on Escape", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    let input = screen.getByLabelText(/new alert threshold/i);
    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.blur(input);
    expect(screen.getByText("50%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    input = screen.getByLabelText(/new alert threshold/i);
    fireEvent.change(input, { target: { value: "60" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("60%")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("requires a category when scoped to one", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Food only" },
    });
    fireEvent.change(screen.getByLabelText(/limit/i), {
      target: { value: "200" },
    });
    const submit = screen.getByRole("button", { name: /create budget/i });
    expect(submit).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /one category/i }));
    expect(submit).toBeDisabled();
  });

  it("submits a whole-wallet monthly budget payload", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Everything" },
    });
    fireEvent.change(screen.getByLabelText(/limit/i), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create budget/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Everything",
        tagName: null,
        limitAmount: 1000,
        periodType: "MONTHLY",
        alertThresholds: [80, 100],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("blocks submit while the name is invalid", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "ab" },
    });
    expect(
      screen.getByRole("button", { name: /create budget/i }),
    ).toBeDisabled();
  });

  it("prevents duplicate threshold chips", () => {
    renderForm();
    // Default thresholds are [80, 100], so 80% and 100% chips should exist
    expect(screen.getAllByText("80%")).toHaveLength(1);
    expect(screen.getAllByText("100%")).toHaveLength(1);

    // The input only exists once "Add" is pressed, and takes the focus.
    expect(screen.queryByLabelText(/new alert threshold/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    const input = screen.getByLabelText(/new alert threshold/i);
    expect(input).toHaveFocus();

    // Adding 80 again is rejected, and Enter folds back into "Add".
    fireEvent.change(input, { target: { value: "80" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByText("80%")).toHaveLength(1);
    expect(screen.queryByLabelText(/new alert threshold/i)).toBeNull();
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  });
});
