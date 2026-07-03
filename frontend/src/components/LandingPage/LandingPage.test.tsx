import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Light framer-motion stub (BackgroundBlobs -> Sphere uses motion.div).
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
      { get: (_target, tag: string) => make(tag) },
    ) as unknown as Record<string, React.FC>,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});

// Features pulls in MUI x-charts / x-charts-pro (heavy SVG); stub it out.
vi.mock("./Features", () => ({
  default: () => <div data-testid="features" />,
}));

// Avoid the real axios instance and toast side effects.
vi.mock("../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));
vi.mock("../ui/ToastNotification.tsx", () => ({ triggerToast: vi.fn() }));

import LandingPage from "./LandingPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe("LandingPage (smoke)", () => {
  it("renders the hero headline and primary CTA", () => {
    renderPage();
    expect(screen.getByText(/Own Your Wealth/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();
  });

  it("renders the closing CTA section", () => {
    renderPage();
    expect(screen.getByText("Want to Try It Out?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create an account/i }),
    ).toBeInTheDocument();
  });

  it("renders the navbar wordmark", () => {
    renderPage();
    expect(screen.getByText("FinanceWebApp")).toBeInTheDocument();
  });
});
