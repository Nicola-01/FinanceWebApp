import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./ThemeContext";

const Consumer = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("dark")}>dark</button>
    </div>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to the system theme when nothing is persisted", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("initialises from the persisted theme in localStorage", () => {
    localStorage.setItem("app-theme", "dark");
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("updates the exposed theme and persists the choice via setTheme", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByText("dark"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(localStorage.getItem("app-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByText("light"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(localStorage.getItem("app-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("throws when useTheme is used outside a ThemeProvider", () => {
    // React logs the thrown render error; silence it to keep test output clean.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      /useTheme must be used within a ThemeProvider/,
    );
    errorSpy.mockRestore();
  });
});
