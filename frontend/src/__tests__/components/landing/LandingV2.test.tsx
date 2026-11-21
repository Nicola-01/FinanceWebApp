import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeContext } from "../../../utils/ThemeContext";
import { setUiVersion } from "../../../utils/uiVersion";
import { getUserAuth } from "../../../utils/authHelper";

// Logged-out by default; individual tests flip it to exercise the logged-in label.
vi.mock("../../../utils/authHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../utils/authHelper")>();
  return { ...actual, getUserAuth: vi.fn(() => null) };
});

// Light framer-motion stub (same as LandingPage.test.tsx).
vi.mock("framer-motion", () => {
  const make = (tag: string) => {
    const C = (props: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      onClick?: React.MouseEventHandler;
    }) =>
      React.createElement(
        tag,
        {
          className: props.className,
          style: props.style,
          onClick: props.onClick,
        },
        props.children,
      );
    C.displayName = `motion-${tag}`;
    return C;
  };
  return {
    motion: new Proxy(
      {},
      { get: (_t, tag: string) => make(tag) },
    ) as unknown as Record<string, React.FC>,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});

// Features pulls in MUI x-charts (v1 only); stub it out.
vi.mock("../../../components/landing/Features", () => ({
  default: () => <div data-testid="features" />,
}));

// Avoid the real axios instance and toast side effects.
vi.mock("../../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import LandingPage from "../../../components/landing/LandingPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ThemeContext.Provider
        value={{ theme: "dark", setTheme: vi.fn(), resolvedTheme: "dark" }}
      >
        <LandingPage />
      </ThemeContext.Provider>
    </MemoryRouter>,
  );

beforeEach(() => setUiVersion("v2"));

afterEach(() => {
  setUiVersion("v1");
  vi.unstubAllEnvs();
  vi.mocked(getUserAuth).mockReturnValue(null);
});

describe("LandingPage UI v2", () => {
  it("renders the hero headline and both CTAs", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Know where every euro goes. Keep more.",
      }),
    ).toBeInTheDocument();
    const hero = within(document.getElementById("hero") as HTMLElement);
    expect(hero.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(
      hero.getByRole("button", { name: /see how it works/i }),
    ).toBeInTheDocument();
  });

  it("labels the hero CTA with the logged-out action (login)", () => {
    renderPage();
    const hero = within(document.getElementById("hero") as HTMLElement);
    expect(hero.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(
      hero.queryByRole("button", { name: /start free/i }),
    ).not.toBeInTheDocument();
  });

  it("labels the CTAs with the logged-in action (dashboard)", () => {
    vi.mocked(getUserAuth).mockReturnValue({
      username: "tester",
      userId: "u1",
    } as ReturnType<typeof getUserAuth>);
    renderPage();
    const hero = within(document.getElementById("hero") as HTMLElement);
    expect(
      hero.getByRole("button", { name: "Go to dashboard" }),
    ).toBeInTheDocument();
  });

  it("labels the CTAs with the demo action when demo is enabled", () => {
    vi.stubEnv("VITE_DEMO_ENABLED", "true");
    renderPage();
    const hero = within(document.getElementById("hero") as HTMLElement);
    expect(
      hero.getByRole("button", { name: "Launch the demo" }),
    ).toBeInTheDocument();
  });

  it("renders the wallet card with the example figure", () => {
    renderPage();
    expect(screen.getByText("+€412")).toBeInTheDocument();
    expect(screen.getByText("Kept this month")).toBeInTheDocument();
  });

  it("renders the problem band total", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        name: "Small, one by one. Not so small, added up.",
      }),
    ).toBeInTheDocument();
    // The example strip repeats €217 in its first stat tile.
    expect(screen.getAllByText("€217").length).toBeGreaterThan(0);
    expect(screen.getByText("every month")).toBeInTheDocument();
  });

  it("renders the example month strip", () => {
    renderPage();
    expect(screen.getByText("Example month")).toBeInTheDocument();
    expect(
      screen.getByText("A better month, in three numbers."),
    ).toBeInTheDocument();
    expect(screen.getByText("€412")).toBeInTheDocument();
  });

  it("renders the trust section and the closing CTA", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Your data stays yours." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Open source" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Start keeping more this month.",
      }),
    ).toBeInTheDocument();
  });

  it("renders no background blobs or spheres", () => {
    const { container } = renderPage();
    expect(container.innerHTML).not.toContain("blur(");
  });

  it("keeps the v1 hero when the v1 UI is selected", () => {
    setUiVersion("v1");
    renderPage();
    expect(screen.getByText(/aren't small\./i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Know where every euro goes. Keep more.",
      }),
    ).not.toBeInTheDocument();
  });
});
