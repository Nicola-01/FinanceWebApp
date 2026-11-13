import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordVisibilityToggle } from "../../auth/PasswordVisibilityToggle";
import { setUiVersion } from "../../utils/uiVersion";

describe("PasswordVisibilityToggle", () => {
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("keeps the rounded-md radius in v1", () => {
    render(<PasswordVisibilityToggle visible={false} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Show password" }).className,
    ).toContain("rounded-md");
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));

    it("uses the squared v2 radius and still toggles on click", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<PasswordVisibilityToggle visible onToggle={onToggle} />);
      const button = screen.getByRole("button", { name: "Hide password" });
      expect(button.className).toContain("rounded-[var(--r-sm)]");
      expect(button.className).not.toContain("rounded-md");
      await user.click(button);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});
