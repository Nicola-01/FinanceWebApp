import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card } from "../../../components/ui/Card";
import { setUiVersion } from "../../../utils/uiVersion";

describe("Card", () => {
  it("keeps the v1 glass surface by default", () => {
    render(<Card title="Budget">Body</Card>);
    const root = screen.getByText("Body").parentElement!;
    expect(root.className).toContain("backdrop-blur-md");
    expect(root.classList.contains("border")).toBe(true);
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));
    afterEach(() => setUiVersion("v1"));

    it("renders a flat card surface with the hairline ring, no border or blur", () => {
      render(<Card title="Budget">Body</Card>);
      const root = screen.getByText("Body").parentElement!;
      expect(root).toHaveClass("bg-app-card", "shadow-[var(--box-ring)]");
      expect(root.classList.contains("border")).toBe(false);
      expect(root.className).not.toContain("backdrop-blur");
    });

    it("uses the display face for the title and red text for danger", () => {
      render(
        <Card tone="danger" title="Overdue">
          Body
        </Card>,
      );
      const title = screen.getByRole("heading", { name: "Overdue" });
      expect(title).toHaveClass("font-display", "text-app-danger");
    });

    it("still renders and clicks its footer action", () => {
      const onClick = vi.fn();
      render(
        <Card footer={<button onClick={onClick}>Save</button>}>Body</Card>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("danger accent bar", () => {
    it("adds a 3px left accent bar in v2 danger", () => {
      setUiVersion("v2");
      render(
        <Card tone="danger" title="Overdue">
          Body
        </Card>,
      );
      const root = screen.getByText("Body").parentElement!;
      expect(root).toHaveClass(
        "shadow-[inset_3px_0_0_var(--color-app-danger),var(--box-ring)]",
      );
      setUiVersion("v1");
    });

    it("keeps v1 danger free of the accent bar", () => {
      render(
        <Card tone="danger" title="Overdue">
          Body
        </Card>,
      );
      const root = screen.getByText("Body").parentElement!;
      expect(root.className).not.toContain("inset_3px");
      expect(root).toHaveClass("border");
    });
  });
});
