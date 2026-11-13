import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toggle from "../../../components/ui/Toggle";
import { setUiVersion } from "../../../utils/uiVersion";

describe("Toggle", () => {
  it("exposes role=switch with aria-checked reflecting the checked prop", () => {
    const { rerender } = render(
      <Toggle checked={false} onChange={() => {}} aria-label="wifi" />,
    );
    const sw = screen.getByRole("switch", { name: "wifi" });
    expect(sw).toHaveAttribute("aria-checked", "false");

    rerender(<Toggle checked onChange={() => {}} aria-label="wifi" />);
    expect(screen.getByRole("switch", { name: "wifi" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onChange with the negated state when clicked (off -> on)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} aria-label="wifi" />);
    await user.click(screen.getByRole("switch", { name: "wifi" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange(false) when a checked toggle is clicked (on -> off)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} aria-label="wifi" />);
    await user.click(screen.getByRole("switch", { name: "wifi" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle checked={false} onChange={onChange} disabled aria-label="wifi" />,
    );
    await user.click(screen.getByRole("switch", { name: "wifi" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the button variant with its label as content", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle
        variant="button"
        checked={false}
        onChange={onChange}
        label="Enable"
      />,
    );
    const btn = screen.getByRole("switch", { name: "Enable" });
    expect(btn).toHaveAttribute("aria-checked", "false");
    await user.click(btn);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders a label beside the switch variant", () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("fills a checked track with the wallet colour and a raised off track", () => {
      const { rerender } = render(
        <Toggle checked={false} onChange={() => {}} aria-label="wifi" />,
      );
      const track = screen.getByRole("switch", { name: "wifi" })
        .firstElementChild as HTMLElement;
      expect(track.className).toContain("bg-app-raised");
      expect(track.className).not.toContain("border-white/10");

      rerender(<Toggle checked onChange={() => {}} aria-label="wifi" />);
      const onTrack = screen.getByRole("switch", { name: "wifi" })
        .firstElementChild as HTMLElement;
      expect(onTrack.className).toContain("bg-wallet");
      expect(onTrack.firstElementChild?.className).toContain("bg-on-wallet");
    });

    it("sets the wallet vars for accentColor instead of a gradient", () => {
      render(
        <Toggle
          checked
          onChange={() => {}}
          accentColor="#f2cc2f"
          aria-label="wifi"
        />,
      );
      const track = screen.getByRole("switch", { name: "wifi" })
        .firstElementChild as HTMLElement;
      expect(track.style.getPropertyValue("--wallet")).toBe("#f2cc2f");
      expect(track.className).not.toContain("from-[var(--brand-1)]");
    });

    it("renders a checked button variant as a solid wallet pill", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Toggle variant="button" checked onChange={onChange} label="Enable" />,
      );
      const btn = screen.getByRole("switch", { name: "Enable" });
      expect(btn.className).toContain("bg-wallet");
      expect(btn.className).toContain("text-on-wallet");
      expect(btn.className).toContain("rounded-full");
      await user.click(btn);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });
});
