import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorSelector } from "../../../components/selectors/ColorSelector";
import { getRecentColors } from "../../../utils/recentColors";

// The colour wheel and shade slider are heavy canvas/drag widgets; stub them so
// the "Advanced" panel can be exercised deterministically. Keep the real colour
// conversion helpers (hexToHsva / hsvaToHex) — they're pure.
vi.mock("@uiw/react-color", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@uiw/react-color")>();
  return {
    ...actual,
    Wheel: () => <div data-testid="color-wheel" />,
    ShadeSlider: () => <div data-testid="shade-slider" />,
  };
});

/** Controlled host so `value` actually updates on change, like in the app. */
function Controlled({ initial }: { initial: string }) {
  const [color, setColor] = useState(initial);
  return <ColorSelector value={color} onChange={setColor} />;
}

describe("ColorSelector", () => {
  // Recents persist in localStorage; isolate every test.
  beforeEach(() => localStorage.clear());

  it("renders the 12 preset swatches plus the Advanced toggle", () => {
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /advanced/i }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("#ff8c00")).toBeInTheDocument();
    expect(screen.getByTitle("#ff00ff")).toBeInTheDocument();
    // 12 presets + 1 Advanced toggle (recents empty → no recent buttons).
    expect(screen.getAllByRole("button")).toHaveLength(13);
  });

  it("fires onChange with the picked preset value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSelector value="" onChange={onChange} />);

    await user.click(screen.getByTitle("#ff8c00"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("#ff8c00");
  });

  it("keeps the hex field and wheel hidden until Advanced is opened", async () => {
    const user = userEvent.setup();
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);

    // Hidden initially — presets still visible.
    expect(screen.queryByLabelText("Hex colour")).not.toBeInTheDocument();
    expect(screen.queryByTestId("color-wheel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /advanced/i }));

    // Wheel + brightness + hex appear, and the presets are STILL there.
    expect(screen.getByTestId("color-wheel")).toBeInTheDocument();
    expect(screen.getByTestId("shade-slider")).toBeInTheDocument();
    expect(screen.getByLabelText("Hex colour")).toBeInTheDocument();
    expect(screen.getByTitle("#ff8c00")).toBeInTheDocument();
  });

  it("marks the currently selected preset via aria-pressed", () => {
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);

    expect(screen.getByTitle("#ff8c00")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTitle("#ff00ff")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("commits a typed hex value on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSelector value="#ff8c00" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    const input = screen.getByLabelText("Hex colour");
    await user.clear(input);
    await user.type(input, "00ff00");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("ignores an incomplete hex value on commit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSelector value="#ff8c00" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    const input = screen.getByLabelText("Hex colour");
    await user.clear(input);
    await user.type(input, "12"); // too short to be valid
    await user.keyboard("{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides the Recent row when there are no recent colours", () => {
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);
    expect(screen.queryByText("Recent")).not.toBeInTheDocument();
  });

  it("renders previously used colours from the recents store", () => {
    // Seed a colour that is NOT one of the presets to avoid ambiguity.
    localStorage.setItem("recent_tag_colors", JSON.stringify(["#123456"]));
    render(<ColorSelector value="#ff8c00" onChange={vi.fn()} />);

    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByTitle("#123456")).toBeInTheDocument();
  });

  it("does not remember a preset as a recent colour", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Controlled initial="#8b5cf6" />);

    await user.click(screen.getByTitle("#ef4444")); // pick a preset
    unmount(); // popup closes → recents would be persisted here

    expect(getRecentColors()).toEqual([]);
  });

  it("remembers a custom colour on close", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Controlled initial="#ff8c00" />);

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    const input = screen.getByLabelText("Hex colour");
    await user.clear(input);
    await user.type(input, "123456");
    await user.keyboard("{Enter}");
    unmount();

    expect(getRecentColors()).toEqual(["#123456"]);
  });
});
