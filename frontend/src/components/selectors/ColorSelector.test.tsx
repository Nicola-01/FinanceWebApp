import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorSelector } from "./ColorSelector";

// The colour wheel is a heavy third-party widget; stub it so the "Custom"
// toggle can be exercised deterministically.
vi.mock("@uiw/react-color", () => ({
  Wheel: () => <div data-testid="color-wheel" />,
}));

describe("ColorSelector", () => {
  it("renders the 12 preset swatches", () => {
    render(<ColorSelector value="" onChange={vi.fn()} />);
    // Presets are swatch buttons with a title; the extra button is the
    // Preset/Custom toggle.
    expect(
      screen.getByRole("button", { name: /Preset|Custom/i }),
    ).toBeVisible();
    expect(screen.getByTitle("#ff8c00")).toBeInTheDocument();
    expect(screen.getByTitle("#ff00ff")).toBeInTheDocument();
    // 12 presets + 1 toggle button.
    expect(screen.getAllByRole("button")).toHaveLength(13);
  });

  it("fires onChange with the picked colour value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSelector value="" onChange={onChange} />);

    await user.click(screen.getByTitle("#ff8c00"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("#ff8c00");
  });

  it("toggles to the custom wheel, hiding the preset grid", async () => {
    const user = userEvent.setup();
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);

    // Presets visible, wheel hidden initially.
    expect(screen.getByTitle("#ff8c00")).toBeInTheDocument();
    expect(screen.queryByTestId("color-wheel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByTestId("color-wheel")).toBeInTheDocument();
    expect(screen.queryByTitle("#ff8c00")).not.toBeInTheDocument();
  });

  it("marks the currently selected preset with a coloured border", () => {
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);
    // The selected swatch gets a solid border; unselected swatches have none.
    expect(screen.getByTitle("#ff8c00").style.borderStyle).toBe("solid");
    expect(screen.getByTitle("#ff00ff").style.borderStyle).toBe("none");
  });
});
