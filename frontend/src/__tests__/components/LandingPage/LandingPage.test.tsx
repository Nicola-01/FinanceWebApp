import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeContext } from "../../../utils/ThemeContext";
import { GITHUB_URL } from "../../../components/LandingPage/landingDemoData";

// Light framer-motion stub (BackgroundSpheres -> Sphere uses motion.div).
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

// Features pulls in MUI x-charts / x-charts-pro (heavy SVG); stub it out.
vi.mock("../../../components/LandingPage/Features", () => ({
  default: () => <div data-testid="features" />,
}));

// Avoid the real axios instance and toast side effects.
vi.mock("../../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import LandingPage from "../../../components/LandingPage/LandingPage";

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

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("LandingPage (smoke)", () => {
  it("renders the hero eyebrow, headline and navbar wordmark", () => {
    renderPage();
    expect(
      screen.getByText(/open-source personal finance/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/aren't small\./i)).toBeInTheDocument();
    // Wordmark appears in both the navbar and the footer.
    expect(screen.getAllByText("FinanceWebApp").length).toBeGreaterThan(0);
  });

  it("links to the GitHub repository", () => {
    const { container } = renderPage();
    expect(
      container.querySelector(`a[href="${GITHUB_URL}"]`),
    ).toBeInTheDocument();
  });

  it("shows the Log in CTA when demo is disabled", () => {
    renderPage();
    expect(
      screen.getAllByRole("button", { name: /log in/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Ready to take control?")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /launch the demo/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the demo CTA and no login when demo is enabled", () => {
    vi.stubEnv("VITE_DEMO_ENABLED", "true");
    renderPage();
    expect(
      screen.getAllByRole("button", { name: /launch/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("See it for yourself.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /log in/i }),
    ).not.toBeInTheDocument();
  });
});
