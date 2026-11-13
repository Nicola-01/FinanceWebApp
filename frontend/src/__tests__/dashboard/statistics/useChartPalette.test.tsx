import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { setUiVersion } from "../../../utils/uiVersion";
import { ThemeContext } from "../../../utils/ThemeContext";
import { useChartPalette } from "../../../dashboard/statistics/useChartPalette";

// Token values per scheme, standing in for the CSS swap on the root class.
let tokens: Record<string, string> = {};

const Probe = () => {
  const palette = useChartPalette();
  return <div data-testid="palette">{JSON.stringify(palette)}</div>;
};

const withScheme = (resolvedTheme: "light" | "dark") => (
  <ThemeContext.Provider
    value={{ theme: resolvedTheme, setTheme: vi.fn(), resolvedTheme }}
  >
    <Probe />
  </ThemeContext.Provider>
);

const readPalette = () =>
  JSON.parse(screen.getByTestId("palette").textContent ?? "{}");

describe("useChartPalette", () => {
  afterEach(() => {
    setUiVersion("v1");
    vi.restoreAllMocks();
  });

  it("returns different v2 colours after the theme changes", () => {
    setUiVersion("v2");
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => tokens[name] ?? "",
        }) as unknown as CSSStyleDeclaration,
    );

    tokens = {
      "--v2-income": "47 143 85",
      "--text-primary": "28 26 23",
      "--v2-kept": "52 120 198",
    };
    const { rerender } = render(withScheme("light"));
    const light = readPalette();
    expect(light.income).toBe("rgb(47 143 85)");
    expect(light.kept).toBe("rgb(52 120 198)");

    tokens = {
      "--v2-income": "110 231 160",
      "--text-primary": "240 238 233",
      "--v2-kept": "122 170 245",
    };
    rerender(withScheme("dark"));
    const dark = readPalette();

    expect(dark.income).toBe("rgb(110 231 160)");
    expect(dark.balance).not.toBe(light.balance);
    expect(dark.kept).toBe("rgb(122 170 245)");
    expect(dark.isV2).toBe(true);
  });

  it("keeps the v1 constants in v1", () => {
    setUiVersion("v1");
    render(withScheme("dark"));
    expect(readPalette()).toMatchObject({
      isV2: false,
      income: "#34d399",
      warn: "#f0a020",
      danger: "#f87171",
      subscription: "#f87171",
      neutral: "#9ca3af",
      kept: "#3b82f6",
    });
  });
});
