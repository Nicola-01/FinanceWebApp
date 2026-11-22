import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppearanceSection } from "../../../settings/sections/AppearanceSection";
import { setUiVersion } from "../../../utils/uiVersion";

describe("AppearanceSection", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.ui;
  });

  it("renders the switch checked by default (v2)", () => {
    render(<AppearanceSection />);
    const toggle = screen.getByRole("switch", { name: "New interface (beta)" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(
        "Try the redesigned interface. Saved on this device only.",
      ),
    ).toBeInTheDocument();
  });

  it("turns the new interface on and persists it", async () => {
    setUiVersion("v1");
    const user = userEvent.setup();
    render(<AppearanceSection />);
    const toggle = screen.getByRole("switch", { name: "New interface (beta)" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    // v2 renders a different element (the Base UI Switch), so re-query it.
    expect(
      screen.getByRole("switch", { name: "New interface (beta)" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem("ui-version")).toBe("v2");
    expect(document.documentElement.dataset.ui).toBe("v2");
  });
});
