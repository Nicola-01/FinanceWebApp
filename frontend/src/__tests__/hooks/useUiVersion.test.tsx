import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUiVersion } from "../../hooks/useUiVersion";

describe("useUiVersion", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.ui;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns v1 by default", () => {
    const { result } = renderHook(() => useUiVersion());
    expect(result.current[0]).toBe("v1");
  });

  it("re-renders when setUiVersion is called", () => {
    const { result } = renderHook(() => useUiVersion());

    act(() => {
      result.current[1]("v2");
    });

    expect(result.current[0]).toBe("v2");
    expect(localStorage.getItem("ui-version")).toBe("v2");
  });
});
