import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { IconPickerButton } from "../../../components/icon/IconPickerButton";

const renderPicker = (investment?: {
  checked: boolean;
  inheritedFrom?: string;
  onChange: (v: boolean) => void;
}) =>
  render(
    <IconPickerButton
      icon="tag"
      color="#ff8c00"
      onIconChange={vi.fn()}
      onColorChange={vi.fn()}
      isOpen
      onToggle={vi.fn()}
      investment={investment}
    />,
  );

describe("IconPickerButton investment switch", () => {
  it("renders no switch when no investment prop is given", () => {
    renderPicker();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("calls onChange with the next value when the switch is flipped", () => {
    const onChange = vi.fn();
    renderPicker({ checked: false, onChange });

    const sw = screen.getByRole("switch", { name: /counts as investment/i });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Covers its subtags too")).toBeInTheDocument();

    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows an inherited flag as on, disabled, with its source", () => {
    const onChange = vi.fn();
    renderPicker({ checked: true, inheritedFrom: "Investments", onChange });

    const sw = screen.getByRole("switch", { name: /counts as investment/i });
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toBeDisabled();
    expect(screen.getByText("Inherited from Investments")).toBeInTheDocument();

    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });
});
