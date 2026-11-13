import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setUiVersion } from "../../../utils/uiVersion";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccentHoverButton } from "../../../components/ui/AccentHoverButton";

describe("AccentHoverButton", () => {
  it("applies the accent tint + hoverStyle only while hovered", () => {
    render(
      <AccentHoverButton
        accentColor="#ff0000"
        hoverStyle={{ color: "#ff0000" }}
        className="cls"
      >
        Add
      </AccentHoverButton>,
    );
    const btn = screen.getByRole("button", { name: "Add" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("cls");
    expect(btn.getAttribute("style")).toBeNull();

    fireEvent.mouseEnter(btn);
    // jsdom normalises hex colours to rgb()/rgba().
    expect(btn.style.borderColor).toBe("rgb(255, 0, 0)");
    expect(btn.style.backgroundColor).toMatch(/^rgba\(255, 0, 0, 0\.0[78]/);
    expect(btn.style.color).toBe("rgb(255, 0, 0)");

    fireEvent.mouseLeave(btn);
    expect(btn.style.borderColor).toBe("");
    expect(btn.style.backgroundColor).toBe("");
  });

  it("passes the hover state to function children and forwards clicks", () => {
    const onClick = vi.fn();
    render(
      <AccentHoverButton accentColor="#00ff00" onClick={onClick}>
        {(hover) => (hover ? "hovered" : "idle")}
      </AccentHoverButton>,
    );
    const btn = screen.getByRole("button", { name: "idle" });
    fireEvent.mouseEnter(btn);
    expect(btn).toHaveTextContent("hovered");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("AccentHoverButton v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("hovers with the raised fill, not the wallet-coloured tint", () => {
    render(
      <AccentHoverButton
        accentColor="#ff0000"
        hoverStyle={{ color: "#ff0000" }}
      >
        {(hover) => (hover ? "Hovered" : "Idle")}
      </AccentHoverButton>,
    );
    const btn = screen.getByRole("button", { name: "Idle" });
    expect(btn).toHaveClass("hover:bg-app-raised");

    fireEvent.mouseEnter(btn);
    expect(
      screen.getByRole("button", { name: "Hovered" }).style.borderColor,
    ).toBe("");
    expect(
      screen.getByRole("button", { name: "Hovered" }).style.backgroundColor,
    ).toBe("");
    // The caller's hoverStyle is still applied.
    expect(screen.getByRole("button", { name: "Hovered" }).style.color).toBe(
      "rgb(255, 0, 0)",
    );
  });
});
