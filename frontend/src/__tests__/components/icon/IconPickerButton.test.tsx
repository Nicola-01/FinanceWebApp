import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconPickerButton } from "../../../components/icon/IconPickerButton";

const renderPicker = () =>
  render(
    <IconPickerButton
      icon="tag"
      color="#ff8c00"
      onIconChange={vi.fn()}
      onColorChange={vi.fn()}
      isOpen
      onToggle={vi.fn()}
    />,
  );

describe("IconPickerButton", () => {
  it("no longer offers the investment switch (it lives on the category row)", () => {
    renderPicker();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText("Counts as investment")).not.toBeInTheDocument();
  });
});
