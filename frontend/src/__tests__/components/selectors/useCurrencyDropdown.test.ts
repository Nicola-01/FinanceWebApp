import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { useCurrencyDropdown } from "../../../components/selectors/useCurrencyDropdown";

const key = (k: string) =>
  ({
    key: k,
    preventDefault: vi.fn(),
  }) as unknown as React.KeyboardEvent<HTMLInputElement>;

const CODES = ["EUR", "USD", "GBP"];

describe("useCurrencyDropdown", () => {
  it("opens with a fresh query and closes on toggle", () => {
    const { result } = renderHook(() => useCurrencyDropdown(vi.fn()));
    act(() => result.current.handleQueryChange("us"));
    act(() => result.current.toggleDropdown());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.query).toBe("");
    act(() => result.current.toggleDropdown());
    expect(result.current.isOpen).toBe(false);
  });

  it("navigates with arrows (clamped) and selects with Enter", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCurrencyDropdown(onSelect));
    act(() => result.current.toggleDropdown());
    act(() => result.current.handleSearchKeyDown(key("ArrowUp"), CODES));
    expect(result.current.activeIndex).toBe(0);
    for (let i = 0; i < 5; i++)
      act(() => result.current.handleSearchKeyDown(key("ArrowDown"), CODES));
    expect(result.current.activeIndex).toBe(2);
    act(() => result.current.handleSearchKeyDown(key("Enter"), CODES));
    expect(onSelect).toHaveBeenCalledWith("GBP");
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on Escape without selecting", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCurrencyDropdown(onSelect));
    act(() => result.current.toggleDropdown());
    act(() => result.current.handleSearchKeyDown(key("Escape"), CODES));
    expect(result.current.isOpen).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
