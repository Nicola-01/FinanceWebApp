import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEscapeKey } from "../../hooks/useEscapeKey";

const press = (key: string) =>
  window.dispatchEvent(new KeyboardEvent("keydown", { key }));

describe("useEscapeKey", () => {
  it("fires on Escape only", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape));
    press("Enter");
    expect(onEscape).not.toHaveBeenCalled();
    press("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("also catches keydown dispatched on document (bubbles to window)", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape));
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not listen while disabled or after unmount", () => {
    const onEscape = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useEscapeKey(onEscape, enabled),
      { initialProps: { enabled: false } },
    );
    press("Escape");
    expect(onEscape).not.toHaveBeenCalled();
    rerender({ enabled: true });
    unmount();
    press("Escape");
    expect(onEscape).not.toHaveBeenCalled();
  });
});
