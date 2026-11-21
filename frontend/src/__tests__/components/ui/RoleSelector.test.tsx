import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSelector } from "../../../components/ui/RoleSelector";
import { setUiVersion } from "../../../utils/uiVersion";

describe("RoleSelector v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("marks the active role with the sliding highlight, not a segment fill", () => {
    render(<RoleSelector value="EDITOR" onChange={vi.fn()} />);
    const highlight = document.querySelector(
      '[data-slot="motion-highlight-indicator"]',
    );
    expect(highlight).toHaveClass(
      "bg-app-card",
      "shadow-[0_1px_2px_rgb(0_0_0/0.08)]",
    );
    expect(highlight).not.toHaveClass("shadow-[var(--box-ring)]");
    expect(screen.getByRole("tab", { name: "Editor" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Viewer" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("does not override the v2 active pill with a per-option background", () => {
    render(<RoleSelector value="EDITOR" onChange={vi.fn()} />);
    const editor = screen.getByRole("tab", { name: "Editor" });
    expect(editor).not.toHaveClass("bg-app-raised");
    expect(editor).not.toHaveClass("bg-app-surface");
  });

  it("keeps the v2 track at content width so it never clips its buttons", () => {
    render(
      <RoleSelector value="EDITOR" onChange={vi.fn()} fullWidth={false} />,
    );
    const track = screen.getByRole("tablist");
    expect(track).toHaveClass("w-max", "shrink-0");
    expect(track).not.toHaveClass("sm:w-36");
  });

  it("still switches the role on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleSelector value="VIEWER" onChange={onChange} />);
    await user.click(screen.getByRole("tab", { name: "Editor" }));
    expect(onChange).toHaveBeenCalledWith("EDITOR");
  });
});

describe("RoleSelector v1", () => {
  beforeEach(() => setUiVersion("v1"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("keeps the v1 active surface on the selected role", () => {
    render(<RoleSelector value="VIEWER" onChange={vi.fn()} />);
    const viewer = screen.getByRole("button", { name: "Viewer" });
    expect(viewer).toHaveClass("bg-app-surface");
    expect(viewer).not.toHaveClass("bg-app-raised");
  });
});
