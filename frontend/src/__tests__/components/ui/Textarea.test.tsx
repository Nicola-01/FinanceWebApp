import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "../../../components/ui/Textarea";

describe("Textarea", () => {
  it("passes through native props like placeholder and rows", () => {
    render(<Textarea placeholder="Notes" rows={5} />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el.tagName).toBe("TEXTAREA");
    expect(el).toHaveAttribute("rows", "5");
  });

  it("defaults to 2 rows", () => {
    render(<Textarea placeholder="Desc" />);
    expect(screen.getByPlaceholderText("Desc")).toHaveAttribute("rows", "2");
  });

  it("applies the neutral border by default", () => {
    render(<Textarea placeholder="Name" />);
    const el = screen.getByPlaceholderText("Name");
    expect(el.className).toContain("border-app-border");
    expect(el.className).not.toContain("border-app-red");
  });

  it("applies the red border when invalid", () => {
    render(<Textarea placeholder="Name" invalid />);
    expect(screen.getByPlaceholderText("Name").className).toContain(
      "border-app-red",
    );
  });

  it("is non-resizable by default and resizable on request", () => {
    const { rerender } = render(<Textarea placeholder="A" />);
    expect(screen.getByPlaceholderText("A").className).toContain("resize-none");
    rerender(<Textarea placeholder="A" resizable />);
    expect(screen.getByPlaceholderText("A").className).toContain("resize-y");
  });

  it("merges a custom className (e.g. a taller min-height)", () => {
    render(<Textarea placeholder="Tall" className="min-h-[100px]" />);
    expect(screen.getByPlaceholderText("Tall").className).toContain(
      "min-h-[100px]",
    );
  });

  it("forwards the ref to the underlying textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="Ref" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(screen.getByPlaceholderText("Ref"));
  });

  it("uses the brand focus ring when no accent is given", () => {
    render(<Textarea placeholder="Brand" />);
    expect(screen.getByPlaceholderText("Brand").className).toContain(
      "focus:border-[var(--brand-1)]",
    );
  });

  it("applies the wallet accent inline only while focused", () => {
    render(<Textarea placeholder="Accent" accentColor="#8b5cf6" />);
    const el = screen.getByPlaceholderText("Accent") as HTMLTextAreaElement;
    // Accent replaces the brand focus classes (colour comes from inline style).
    expect(el.className).not.toContain("focus:border-[var(--brand-1)]");
    expect(el.style.borderColor).toBe("");
    fireEvent.focus(el);
    expect(el.style.borderColor).not.toBe("");
    expect(el.style.boxShadow).not.toBe("");
    fireEvent.blur(el);
    expect(el.style.borderColor).toBe("");
  });

  it("ignores the accent when invalid — the red border wins", () => {
    render(<Textarea placeholder="Bad" accentColor="#8b5cf6" invalid />);
    const el = screen.getByPlaceholderText("Bad");
    expect(el.className).toContain("border-app-red");
    fireEvent.focus(el);
    expect(el.style.borderColor).toBe("");
  });
});
