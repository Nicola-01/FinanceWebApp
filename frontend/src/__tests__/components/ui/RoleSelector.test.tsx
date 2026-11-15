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
    expect(highlight).toHaveClass("bg-app-card");
    expect(screen.getByRole("tab", { name: "Editor" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Viewer" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("still switches the role on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleSelector value="VIEWER" onChange={onChange} />);
    await user.click(screen.getByRole("tab", { name: "Editor" }));
    expect(onChange).toHaveBeenCalledWith("EDITOR");
  });
});
