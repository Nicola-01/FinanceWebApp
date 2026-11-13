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

  it("marks the active role with the raised segment fill", () => {
    render(<RoleSelector value="EDITOR" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Editor" }).className).toContain(
      "bg-app-raised",
    );
    expect(
      screen.getByRole("button", { name: "Viewer" }).className,
    ).not.toContain("bg-app-raised");
  });

  it("still switches the role on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RoleSelector value="VIEWER" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editor" }));
    expect(onChange).toHaveBeenCalledWith("EDITOR");
  });
});
