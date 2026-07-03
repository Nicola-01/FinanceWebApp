import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveOverlay } from "./ResponsiveOverlay";

/** Force the desktop/mobile breakpoint by stubbing matchMedia (single query). */
function setDesktop(isDesktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const noop = () => {};

describe("ResponsiveOverlay", () => {
  beforeEach(() => setDesktop(true));

  it("renders nothing while closed", () => {
    render(
      <ResponsiveOverlay open={false} onClose={noop} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("desktop: shows title + Close, no Back arrow", () => {
    setDesktop(true);
    render(
      <ResponsiveOverlay open onClose={noop} title="Editor" subtitle="sub">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("mobile: shows Back arrow, no Close", () => {
    setDesktop(false);
    render(
      <ResponsiveOverlay open onClose={noop} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
  });

  it("closes on the header control (desktop Close)", () => {
    const onClose = vi.fn();
    render(
      <ResponsiveOverlay open onClose={onClose} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <ResponsiveOverlay open onClose={onClose} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on browser Back (popstate)", () => {
    const onClose = vi.fn();
    render(
      <ResponsiveOverlay open onClose={onClose} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders header actions", () => {
    render(
      <ResponsiveOverlay
        open
        onClose={noop}
        title="Editor"
        headerActions={<button type="button">Edit</button>}
      >
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
