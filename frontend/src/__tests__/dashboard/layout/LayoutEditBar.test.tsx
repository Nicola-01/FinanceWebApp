import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LayoutEditBar } from "../../../dashboard/layout/LayoutEditBar";

describe("LayoutEditBar", () => {
  it("shows the hidden count when widgets are hidden", () => {
    render(
      <LayoutEditBar hiddenCount={2} onReset={vi.fn()} onDone={vi.fn()} />,
    );
    expect(
      screen.getByRole("toolbar", { name: "Layout editing" }),
    ).toHaveTextContent("Editing layout · 2 hidden");
  });

  it("omits the hidden count when nothing is hidden", () => {
    render(
      <LayoutEditBar hiddenCount={0} onReset={vi.fn()} onDone={vi.fn()} />,
    );
    expect(screen.getByText(/^Editing layout/).textContent).toBe(
      "Editing layout",
    );
  });

  it("calls onReset and onDone from the buttons", () => {
    const onReset = vi.fn();
    const onDone = vi.fn();
    render(<LayoutEditBar hiddenCount={0} onReset={onReset} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset layout" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("marks the body while mounted and clears it on unmount", () => {
    const { unmount } = render(
      <LayoutEditBar hiddenCount={0} onReset={vi.fn()} onDone={vi.fn()} />,
    );
    expect(document.body.hasAttribute("data-layout-editing")).toBe(true);

    unmount();
    expect(document.body.hasAttribute("data-layout-editing")).toBe(false);
  });
});
