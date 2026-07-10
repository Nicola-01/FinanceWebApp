import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetFormOverlay } from "../../../dashboard/budget/BudgetFormOverlay";
import type { Tag } from "../../../utils/types";

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

  it("shows date-range fields only for the custom period", () => {
    renderForm();
    expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();
    // switch period to Custom range — CustomSelect renders its current value as
    // clickable text (trigger) and its options as clickable text (buttons).
    fireEvent.click(screen.getByText(/monthly/i));
    fireEvent.click(screen.getByText(/custom range/i));
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
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

    // Try to add 80 again via the threshold input + Add button
    fireEvent.change(screen.getByLabelText(/new alert threshold/i), {
      target: { value: "80" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    // Should still have exactly one 80% chip (duplicate was rejected)
    expect(screen.getAllByText("80%")).toHaveLength(1);
    // The input should be cleared
    expect(screen.getByLabelText(/new alert threshold/i)).toHaveValue(null);
  });
});
