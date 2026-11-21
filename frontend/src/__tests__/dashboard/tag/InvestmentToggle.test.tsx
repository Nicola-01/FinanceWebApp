import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InvestmentToggle } from "../../../dashboard/tag/InvestmentToggle";

const btn = () => screen.getByRole("button", { name: "Counts as investment" });

describe("InvestmentToggle states", () => {
  it("own: solid on and pressed; click turns it off", () => {
    const onChange = vi.fn();
    render(<InvestmentToggle state="own" onChange={onChange} />);
    expect(btn()).toHaveAttribute("aria-pressed", "true");
    expect(btn()).not.toHaveClass("border-dashed");
    fireEvent.click(btn());
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("off: muted and not pressed; click turns it on", () => {
    const onChange = vi.fn();
    render(<InvestmentToggle state="off" onChange={onChange} />);
    expect(btn()).toHaveAttribute("aria-pressed", "false");
    expect(btn()).not.toHaveClass("border-dashed");
    fireEvent.click(btn());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("inherited: dashed, locked, explains the source in the tooltip", async () => {
    const onChange = vi.fn();
    render(
      <InvestmentToggle
        state="inherited"
        inheritedFrom="Car"
        onChange={onChange}
      />,
    );
    expect(btn()).toHaveClass("border-dashed");
    expect(btn()).toHaveAttribute("aria-disabled", "true");
    expect(btn()).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btn());
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.mouseOver(btn().parentElement!);
    expect(await screen.findByText("Inherited from Car")).toBeInTheDocument();
  });

  it("partial: dashed, mixed, still clickable (flags the whole subtree)", async () => {
    const onChange = vi.fn();
    render(<InvestmentToggle state="partial" onChange={onChange} />);
    expect(btn()).toHaveClass("border-dashed");
    expect(btn()).toHaveAttribute("aria-pressed", "mixed");
    expect(btn()).not.toHaveAttribute("aria-disabled");
    fireEvent.click(btn());
    expect(onChange).toHaveBeenCalledWith(true);
    fireEvent.mouseOver(btn().parentElement!);
    expect(
      await screen.findByText("Some sub-categories count as investments"),
    ).toBeInTheDocument();
  });
});
