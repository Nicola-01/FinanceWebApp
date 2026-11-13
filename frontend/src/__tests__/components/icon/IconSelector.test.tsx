import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { IconSelector } from "../../../components/icon/IconSelector";
import { ICON_CATEGORIES, type IconKey } from "../../../utils/icons";
import { setUiVersion } from "../../../utils/uiVersion";

const [first, second] = Object.values(ICON_CATEGORIES)[0] as IconKey[];

describe("IconSelector", () => {
  it("calls onChange with the clicked icon", () => {
    const onChange = vi.fn();
    render(
      <IconSelector value={first} onChange={onChange} currentColor="#ff8c00" />,
    );
    fireEvent.click(screen.getByTitle(second));
    expect(onChange).toHaveBeenCalledWith(second);
  });

  describe("v2 UI", () => {
    beforeEach(() => setUiVersion("v2"));
    afterEach(() => setUiVersion("v1"));

    it("marks the selected icon with a rounded tile", () => {
      render(
        <IconSelector
          value={first}
          onChange={vi.fn()}
          currentColor="#ff8c00"
        />,
      );
      expect(screen.getByTitle(first)).toHaveClass("rounded-[var(--r-sm)]");
      expect(screen.getByTitle(second)).toHaveClass("text-app-muted");
    });

    it("opens a raised search field with the wallet focus ring", () => {
      render(
        <IconSelector
          value={first}
          onChange={vi.fn()}
          currentColor="#ff8c00"
        />,
      );
      fireEvent.click(screen.getByTitle("Search Icons"));
      const field =
        screen.getByPlaceholderText("Search icons...").parentElement;
      expect(field).toHaveClass("bg-app-raised", "focus-within:ring-wallet/40");
    });

    it("still calls onChange on click", () => {
      const onChange = vi.fn();
      render(
        <IconSelector
          value={first}
          onChange={onChange}
          currentColor="#ff8c00"
        />,
      );
      fireEvent.click(screen.getByTitle(second));
      expect(onChange).toHaveBeenCalledWith(second);
    });
  });
});
