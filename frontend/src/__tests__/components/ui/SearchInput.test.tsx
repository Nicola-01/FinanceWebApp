import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SearchInput } from "../../../components/ui/SearchInput";
import { setUiVersion } from "../../../utils/uiVersion";

describe("SearchInput", () => {
  it("reports each keystroke and clears through the × button", () => {
    const onChange = vi.fn();
    render(<SearchInput value="abc" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "abcd" },
    });
    expect(onChange).toHaveBeenCalledWith("abcd");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("renders a borderless raised field with a wallet focus ring", () => {
      render(<SearchInput value="" onChange={() => {}} />);
      const wrapper = screen.getByPlaceholderText("Search...")
        .parentElement as HTMLElement;
      expect(wrapper.className).toContain("bg-app-raised");
      expect(wrapper.className).toContain("focus-within:ring-wallet/40");
      expect(wrapper.className).not.toContain("border-app-border");
    });

    it("uses an explicit colour as a 2px ring on focus", () => {
      render(<SearchInput value="" onChange={() => {}} color="#f2cc2f" />);
      const field = screen.getByPlaceholderText("Search...");
      fireEvent.focus(field);
      const wrapper = field.parentElement as HTMLElement;
      expect(wrapper.style.boxShadow).toContain("2px");
    });

    it("still clears through the × button", () => {
      const onChange = vi.fn();
      render(<SearchInput value="tag" onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
      expect(onChange).toHaveBeenCalledWith("");
    });
  });
});
