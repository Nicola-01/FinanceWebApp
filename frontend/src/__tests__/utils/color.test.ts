import { describe, expect, it, vi } from "vitest";
import { FALLBACK_HEX, hexToRgba, toHex } from "../../utils/color";

describe("hexToRgba", () => {
  it("converts #rrggbb to rgba with the given alpha", () => {
    expect(hexToRgba("#ff8000", 0.6)).toBe("rgba(255, 128, 0, 0.6)");
  });

  it("falls back to spring green for an empty string", () => {
    expect(hexToRgba("", 0.5)).toBe("rgba(0, 255, 127, 0.5)");
  });
});

describe("toHex", () => {
  it("expands 3-digit hex and lowercases", () => {
    expect(toHex("#AbC")).toBe("#aabbcc");
  });

  it("lowercases and trims 6-digit hex", () => {
    expect(toHex("  #FF00AA ")).toBe("#ff00aa");
  });

  it("resolves rgb() via computed style", () => {
    expect(toHex("rgb(1, 2, 255)")).toBe("#0102ff");
  });

  it("returns the fallback when the computed colour has no rgb parts", () => {
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ color: "" } as CSSStyleDeclaration);
    expect(toHex("var(--missing)")).toBe(FALLBACK_HEX);
    spy.mockRestore();
  });

  it("returns the fallback when resolution throws", () => {
    const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(() => {
      throw new Error("boom");
    });
    expect(toHex("red")).toBe(FALLBACK_HEX);
    spy.mockRestore();
  });
});
