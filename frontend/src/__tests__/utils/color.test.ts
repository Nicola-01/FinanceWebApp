import { describe, expect, it, vi } from "vitest";
import {
  FALLBACK_HEX,
  hexToRgba,
  onColor,
  toHex,
  walletVars,
} from "../../utils/color";

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

describe("onColor", () => {
  it("uses dark ink on light wallet colours", () => {
    expect(onColor("#f2cc2f")).toBe("#1d1a10"); // yellow
    expect(onColor("#2ec4d6")).toBe("#1d1a10"); // cyan
    expect(onColor("#fff")).toBe("#1d1a10");
  });

  it("uses white on dark or saturated wallet colours", () => {
    expect(onColor("#8b6cf6")).toBe("#ffffff"); // violet
    expect(onColor("#5b7cfa")).toBe("#ffffff"); // blue
    expect(onColor("#000000")).toBe("#ffffff");
  });
});

describe("walletVars", () => {
  it("sets the wallet colour and its readable ink together", () => {
    expect(walletVars("#f2cc2f")).toEqual({
      "--wallet": "#f2cc2f",
      "--on-wallet": "#1d1a10",
    });
  });
});
