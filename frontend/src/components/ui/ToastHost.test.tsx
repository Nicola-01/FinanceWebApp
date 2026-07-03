import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastHost } from "./ToastHost";
import { triggerToast } from "./ToastNotification";

describe("ToastHost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ToastHost portals into #toast-root, so it must exist before rendering.
    const root = document.createElement("div");
    root.id = "toast-root";
    document.body.appendChild(root);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.getElementById("toast-root")?.remove();
  });

  const getToast = (message: string): HTMLElement => {
    // The message lives in a <span>; its parent is the toast container div.
    const span = screen.getByText(message);
    return span.parentElement as HTMLElement;
  };

  it("shows a success toast when triggered", () => {
    render(<ToastHost />);

    act(() => {
      triggerToast("Wallet created", true);
    });

    const toast = getToast("Wallet created");
    expect(toast.className).toContain("opacity-100");
    expect(toast.className).toContain("visible");
    // Success styling variant.
    expect(toast.className).toContain("theme-text-success");
  });

  it("uses the error variant when success is false", () => {
    render(<ToastHost />);

    act(() => {
      triggerToast("Delete failed", false);
    });

    const toast = getToast("Delete failed");
    expect(toast.className).toContain("theme-text-danger");
    expect(toast.className).not.toContain("theme-text-success");
  });

  it("auto-dismisses after the timeout elapses", () => {
    render(<ToastHost />);

    act(() => {
      triggerToast("Temporary message", true);
    });

    let toast = getToast("Temporary message");
    expect(toast.className).toContain("opacity-100");

    // Advance past the 3s auto-dismiss timer.
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    toast = getToast("Temporary message");
    expect(toast.className).toContain("opacity-0");
    expect(toast.className).toContain("invisible");
  });
});
