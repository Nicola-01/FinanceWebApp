import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDatePicker } from "../../../components/datePicker/useDatePicker";
import { mainPresets } from "../../../components/datePicker/datePresets";
import type { PresetType } from "../../../components/datePicker/datePresets";

const JAN_15 = new Date(2026, 0, 15);

const setup = (overrides: Partial<Parameters<typeof useDatePicker>[0]> = {}) =>
  renderHook(
    (props: Parameters<typeof useDatePicker>[0]) => useDatePicker(props),
    {
      initialProps: {
        isRange: true,
        initialPreset: "month" as PresetType,
        initialStartDate: JAN_15,
        initialEndDate: null,
        ...overrides,
      },
    },
  );

describe("datePresets", () => {
  it("lists the sidebar presets in display order (Today is separate)", () => {
    expect(mainPresets.map((p) => p.id)).toEqual([
      "last30",
      "month",
      "year",
      "all",
      "custom",
    ]);
  });
});

describe("useDatePicker", () => {
  it("derives the month range from the initial date", () => {
    const { result } = setup();
    expect(result.current.startDate).toEqual(new Date(2026, 0, 1));
    expect(result.current.endDate?.getDate()).toBe(31);
  });

  it("derives the year range when the preset changes", () => {
    const { result } = setup();
    act(() => result.current.setPreset("year"));
    expect(result.current.startDate).toEqual(new Date(2026, 0, 1));
    expect(result.current.endDate?.getMonth()).toBe(11);
  });

  it("clears the range for the 'all' preset", () => {
    const { result } = setup();
    act(() => result.current.setPreset("all"));
    expect(result.current.startDate).toBeNull();
    expect(result.current.endDate).toBeNull();
  });

  it("emits a range object or a single date depending on isRange", () => {
    const onRange = vi.fn();
    setup({ onChange: onRange });
    expect(onRange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: expect.any(Date) }),
    );

    const onSingle = vi.fn();
    setup({ isRange: false, initialPreset: "custom", onChange: onSingle });
    expect(onSingle).toHaveBeenLastCalledWith(JAN_15);
  });

  it("reports preset changes", () => {
    const onPresetChange = vi.fn();
    const { result } = setup({ onPresetChange });
    act(() => result.current.setPreset("last30"));
    expect(onPresetChange).toHaveBeenLastCalledWith("last30");
  });

  it("auto-closes after a new single-date selection", () => {
    const { result } = setup({
      isRange: false,
      initialPreset: "custom",
      initialStartDate: null,
    });
    act(() => result.current.setIsOpen(true));
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.setStartDate(JAN_15));
    expect(result.current.isOpen).toBe(false);
  });
});
