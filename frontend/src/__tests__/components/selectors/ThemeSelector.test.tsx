import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSelector } from "../../../components/selectors/ThemeSelector";
import {
  ThemeContext,
  type Theme,
  type ThemeContextType,
} from "../../../utils/ThemeContext";

const renderWithTheme = (overrides: Partial<ThemeContextType> = {}) => {
  const setTheme = vi.fn<(theme: Theme) => void>();
  const value: ThemeContextType = {
    theme: "light",
    setTheme,
    resolvedTheme: "light",
    ...overrides,
  };
  render(
    <ThemeContext.Provider value={value}>
      <ThemeSelector />
    </ThemeContext.Provider>,
  );
  return { setTheme };
};

describe("ThemeSelector", () => {
  it("renders the three theme options", () => {
    renderWithTheme();
    expect(screen.getByText("App Theme")).toBeInTheDocument();
    expect(screen.getByTitle("Light")).toBeInTheDocument();
    expect(screen.getByTitle("Dark")).toBeInTheDocument();
    expect(screen.getByTitle("System")).toBeInTheDocument();
  });

  it("fires setTheme with the chosen theme", async () => {
    const user = userEvent.setup();
    const { setTheme } = renderWithTheme({ theme: "light" });

    await user.click(screen.getByTitle("Dark"));

    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("can switch to the system theme", async () => {
    const user = userEvent.setup();
    const { setTheme } = renderWithTheme({ theme: "dark" });

    await user.click(screen.getByTitle("System"));

    expect(setTheme).toHaveBeenCalledWith("system");
  });

  it("marks the active theme button as bold/selected", () => {
    renderWithTheme({ theme: "dark" });
    // The Selector applies a bold class to the active option only.
    expect(screen.getByTitle("Dark").className).toContain("font-bold");
    expect(screen.getByTitle("Light").className).not.toContain("font-bold");
  });
});
