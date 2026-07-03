import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toggle from "./Toggle";

describe("Toggle", () => {
  it("exposes role=switch with aria-checked reflecting the checked prop", () => {
    const { rerender } = render(
      <Toggle checked={false} onChange={() => {}} aria-label="wifi" />,
    );
    const sw = screen.getByRole("switch", { name: "wifi" });
    expect(sw).toHaveAttribute("aria-checked", "false");

    rerender(<Toggle checked onChange={() => {}} aria-label="wifi" />);
    expect(screen.getByRole("switch", { name: "wifi" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onChange with the negated state when clicked (off -> on)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} aria-label="wifi" />);
    await user.click(screen.getByRole("switch", { name: "wifi" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange(false) when a checked toggle is clicked (on -> off)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} aria-label="wifi" />);
    await user.click(screen.getByRole("switch", { name: "wifi" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle checked={false} onChange={onChange} disabled aria-label="wifi" />,
    );
    await user.click(screen.getByRole("switch", { name: "wifi" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the button variant with its label as content", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle
        variant="button"
        checked={false}
        onChange={onChange}
        label="Enable"
      />,
    );
    const btn = screen.getByRole("switch", { name: "Enable" });
    expect(btn).toHaveAttribute("aria-checked", "false");
    await user.click(btn);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders a label beside the switch variant", () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });
});
