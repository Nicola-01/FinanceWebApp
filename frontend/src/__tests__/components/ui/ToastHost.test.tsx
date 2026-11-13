import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setUiVersion } from "../../../utils/uiVersion";
import { render, screen, act, cleanup } from "@testing-library/react";
import { ToastHost } from "../../../components/ui/ToastHost";
import { triggerToast } from "../../../components/ui/ToastNotification";

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
    // Success styling variant (green accent border, no coloured glow).
    expect(toast.className).toContain("border-app-green/30");
  });

  it("uses the error variant when success is false", () => {
    render(<ToastHost />);

    act(() => {
      triggerToast("Delete failed", false);
    });

    const toast = getToast("Delete failed");
    expect(toast.className).toContain("border-app-red/30");
    expect(toast.className).not.toContain("border-app-green/30");
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

describe("ToastHost v2", () => {
  beforeEach(() => {
    setUiVersion("v2");
    const root = document.createElement("div");
    root.id = "toast-root";
    document.body.appendChild(root);
  });

  afterEach(() => {
    // Unmount before removing the portal target, or a late re-render throws.
    cleanup();
    setUiVersion("v1");
    document.getElementById("toast-root")?.remove();
  });

  it("drops the border and blur, and tints the status chip with its colour", () => {
    render(<ToastHost />);
    act(() => triggerToast("Saved", true));
    const toast = screen.getByText("Saved").parentElement as HTMLElement;
    expect(toast.className).toContain("bg-app-card");
    expect(toast.className).not.toContain("backdrop-blur-md");
    expect(toast.className).not.toContain("border-app-green");
    const chip = toast.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(chip.className).toContain("text-app-income");
  });

  it("uses the danger status for failures", () => {
    render(<ToastHost />);
    act(() => triggerToast("Failed", false));
    const toast = screen.getByText("Failed").parentElement as HTMLElement;
    const chip = toast.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(chip.className).toContain("text-app-danger");
  });
});
