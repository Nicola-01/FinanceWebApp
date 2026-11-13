import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryIcon } from "../../../components/ui/CategoryIcon";

describe("CategoryIcon", () => {
  it("renders md size classes by default and sets the colour variable", () => {
    const { container } = render(
      <CategoryIcon icon="piggyBank" color="#ff0000" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("inline-grid", "h-10", "w-10", "rounded-[11px]");
    expect(el.style.getPropertyValue("--c")).toBe("#ff0000");
    expect(el.style.backgroundColor).toContain("color-mix");
  });

  it('uses sm size classes with size="sm"', () => {
    const { container } = render(
      <CategoryIcon icon="piggyBank" color="#00ff00" size="sm" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("h-8", "w-8", "rounded-[9px]", "text-[13px]");
    expect(el).not.toHaveClass("h-10");
  });

  it("is aria-hidden without a title", () => {
    const { container } = render(
      <CategoryIcon icon="piggyBank" color="#ff0000" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).not.toHaveAttribute("role");
  });

  it("exposes role img and aria-label when a title is given", () => {
    render(<CategoryIcon icon="piggyBank" color="#ff0000" title="Savings" />);
    const el = screen.getByRole("img", { name: "Savings" });
    expect(el).not.toHaveAttribute("aria-hidden");
  });
});
