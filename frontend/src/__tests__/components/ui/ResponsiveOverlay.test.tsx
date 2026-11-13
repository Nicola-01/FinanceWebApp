import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveOverlay } from "../../../components/ui/ResponsiveOverlay";
import { setUiVersion } from "../../../utils/uiVersion";

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

describe("ResponsiveOverlay — v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("desktop: flat card drawer rounding only its inner edge, over a plain backdrop", () => {
    setDesktop(true);
    const onClose = vi.fn();
    render(
      <ResponsiveOverlay open onClose={onClose} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("bg-app-card", "rounded-l-[var(--r-card)]");
    expect(panel).not.toHaveClass("border-l");
    expect(panel.previousElementSibling).toHaveClass("bg-black/50");
    expect(panel.previousElementSibling).not.toHaveClass("backdrop-blur-sm");
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "w-9",
      "hover:bg-app-raised",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mobile: full-screen card with no rounding and the back arrow still closes", () => {
    setDesktop(false);
    const onClose = vi.fn();
    render(
      <ResponsiveOverlay open onClose={onClose} title="Editor">
        <p>Body</p>
      </ResponsiveOverlay>,
    );
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("bg-app-card");
    expect(panel.className).not.toContain("rounded-l");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
