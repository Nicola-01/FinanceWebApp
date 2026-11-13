import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Checkbox } from "../../../components/ui/Checkbox";
import { setUiVersion } from "../../../utils/uiVersion";

describe("Checkbox", () => {
  it("exposes the tri-state through aria-checked and toggles on click", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Checkbox state="indeterminate" onChange={onChange} aria-label="all" />,
    );
    expect(screen.getByRole("checkbox", { name: "all" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
    rerender(<Checkbox state={true} onChange={onChange} aria-label="all" />);
    expect(screen.getByRole("checkbox", { name: "all" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "all" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("colours the checked glyph with the wallet colour by default", () => {
      render(<Checkbox state={true} onChange={() => {}} aria-label="row" />);
      const icon = screen
        .getByRole("checkbox", { name: "row" })
        .querySelector("svg") as SVGElement;
      expect(icon.getAttribute("style")).toContain("var(--wallet)");
    });

    it("still fires onChange and does not bubble the click", () => {
      const onChange = vi.fn();
      const onRowClick = vi.fn();
      render(
        <div onClick={onRowClick}>
          <Checkbox state={false} onChange={onChange} aria-label="row" />
        </div>,
      );
      fireEvent.click(screen.getByRole("checkbox", { name: "row" }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onRowClick).not.toHaveBeenCalled();
    });
  });
});
