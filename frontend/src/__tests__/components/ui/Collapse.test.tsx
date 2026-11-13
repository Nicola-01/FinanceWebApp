import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Collapse } from "../../../components/ui/Collapse";
import { setUiVersion } from "../../../utils/uiVersion";

describe("Collapse", () => {
  it("keeps the v1 large title by default", () => {
    render(<Collapse title="Section">Body</Collapse>);
    const heading = screen.getByRole("heading", { name: "Section" });
    expect(heading).toHaveClass("text-2xl", "font-bold");
    expect(heading.className).not.toContain("font-display");
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));
    afterEach(() => setUiVersion("v1"));

    it("uses the display face for large titles", () => {
      render(<Collapse title="Section">Body</Collapse>);
      expect(screen.getByRole("heading", { name: "Section" })).toHaveClass(
        "font-display",
        "text-2xl",
        "font-semibold",
      );
    });

    it("still toggles the body", () => {
      render(<Collapse title="Section">Body</Collapse>);
      const toggle = screen.getByRole("button", { name: "Section" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Body")).not.toBeInTheDocument();
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Body")).toBeInTheDocument();
    });
  });
});
