import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Selector, type SelectorOption } from "../../../components/ui/Selector";

const options: SelectorOption<string>[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma", disabled: true },
];

describe("Selector", () => {
  it("renders one button per option", () => {
    render(<Selector options={options} value="a" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument();
  });

  it("fires onChange with the selected option value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selector options={options} value="a" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("marks the active option as bold and does not re-fire for it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selector options={options} value="a" onChange={onChange} />);
    const active = screen.getByRole("button", { name: "Alpha" });
    expect(active.className).toContain("font-bold");
    await user.click(active);
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("does not fire onChange for a disabled option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selector options={options} value="a" onChange={onChange} />);
    const disabled = screen.getByRole("button", { name: "Gamma" });
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });
});
