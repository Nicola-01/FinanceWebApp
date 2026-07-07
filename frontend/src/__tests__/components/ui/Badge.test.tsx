import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "../../../components/ui/Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Paused</Badge>);
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("applies the soft tone tint by default (bg + text + border)", () => {
    render(<Badge tone="yellow">Due</Badge>);
    const el = screen.getByText("Due");
    expect(el.className).toContain("bg-app-yellow/15");
    expect(el.className).toContain("text-app-yellow");
    expect(el.className).toContain("border-app-yellow/40");
    expect(el.className).toContain("border");
  });

  it("subtle variant has no border and no tinted fill for neutral", () => {
    render(
      <Badge variant="subtle" mono>
        7
      </Badge>,
    );
    const el = screen.getByText("7");
    expect(el.className).toContain("bg-app-input");
    expect(el.className).toContain("text-app-muted");
    // no `border` utility token (would be a standalone word)
    expect(el.className.split(/\s+/)).not.toContain("border");
    expect(el.className).toContain("font-app-mono");
    expect(el.className).toContain("tabular-nums");
  });

  it("outline variant keeps the border but no fill", () => {
    render(
      <Badge variant="outline" tone="green">
        Live
      </Badge>,
    );
    const el = screen.getByText("Live");
    expect(el.className.split(/\s+/)).toContain("border");
    expect(el.className).toContain("text-app-green");
    expect(el.className).not.toContain("bg-app-green");
  });

  it("uppercase adds uppercase + tracking", () => {
    render(<Badge uppercase>Pending</Badge>);
    const el = screen.getByText("Pending");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("tracking-wider");
  });

  it("shape controls the radius", () => {
    const { rerender } = render(<Badge shape="pill">A</Badge>);
    expect(screen.getByText("A").className).toContain("rounded-full");
    rerender(<Badge shape="square">A</Badge>);
    expect(screen.getByText("A").className).toContain("rounded-[var(--r-sm)]");
  });

  it("renders a leading icon when provided", () => {
    const { container } = render(<Badge icon={faClock}>Soon</Badge>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("an arbitrary color tints inline and overrides tone classes", () => {
    render(
      <Badge color="#8b5cf6" tone="green">
        Custom
      </Badge>,
    );
    const el = screen.getByText("Custom");
    expect(el.className).not.toContain("text-app-green");
    expect(el.style.color).not.toBe("");
    expect(el.style.backgroundColor).not.toBe("");
    expect(el.style.borderColor).not.toBe("");
  });

  it("merges a custom className", () => {
    render(<Badge className="tracking-widest">X</Badge>);
    expect(screen.getByText("X").className).toContain("tracking-widest");
  });

  it("forwards native span attributes (title, onClick)", () => {
    render(<Badge title="tip">Y</Badge>);
    expect(screen.getByText("Y")).toHaveAttribute("title", "tip");
  });
});
