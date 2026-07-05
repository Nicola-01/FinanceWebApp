import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInlineTagEdit } from "../../../dashboard/tag/useInlineTagEdit";
import type { Tag } from "../../../utils/types";

const tag = (colorHex: string, icon = "tag"): Tag => ({
  name: "Food",
  icon,
  colorHex,
  parentName: null,
});

describe("useInlineTagEdit", () => {
  it("shows the picked colour live while the picker is open", () => {
    const { result } = renderHook(() =>
      useInlineTagEdit(tag("#111111"), vi.fn().mockResolvedValue(true)),
    );

    act(() => result.current.onIconToggle(true));
    act(() => result.current.setColorVal("#ff0000"));

    expect(result.current.displayColor).toBe("#ff0000");
  });

  it("keeps the picked colour after close, before the async save propagates", () => {
    // Regression (flicker): the real handleUpdateTag awaits the backend, so the
    // tag prop still carries the OLD colour for ~half a second after closing.
    // The display must stay on the picked colour instead of flashing the old.
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useInlineTagEdit(tag("#111111"), onUpdateTag),
    );

    act(() => result.current.onIconToggle(true));
    act(() => result.current.setColorVal("#ff0000"));
    act(() => result.current.onIconToggle(false));

    expect(onUpdateTag).toHaveBeenCalledWith(
      "Food",
      expect.objectContaining({ colorHex: "#ff0000" }),
    );
    // Prop is still #111111 here (save unresolved) — must not revert to it.
    expect(result.current.displayColor).toBe("#ff0000");
  });

  it("adopts an external colour change coming from the prop", () => {
    const { result, rerender } = renderHook(
      ({ t }: { t: Tag }) =>
        useInlineTagEdit(t, vi.fn().mockResolvedValue(true)),
      { initialProps: { t: tag("#111111") } },
    );
    expect(result.current.displayColor).toBe("#111111");

    rerender({ t: tag("#00ff00") });
    expect(result.current.displayColor).toBe("#00ff00");
  });

  it("does not commit when nothing changed", () => {
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useInlineTagEdit(tag("#111111"), onUpdateTag),
    );

    act(() => result.current.onIconToggle(true));
    act(() => result.current.onIconToggle(false));

    expect(onUpdateTag).not.toHaveBeenCalled();
  });
});
