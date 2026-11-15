import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setUiVersion } from "../../../utils/uiVersion";
import { render, screen, act, cleanup } from "@testing-library/react";
import { ToastHost } from "../../../components/ui/ToastHost";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { toast } from "@/components/shadcn/sonner";

vi.mock("@/components/shadcn/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => <div data-testid="toaster" />,
}));

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
    localStorage.clear();
    document.getElementById("toast-root")?.remove();
  });

  it("routes success and error toasts to sonner", async () => {
    render(<ToastHost />);
    // The sonner host is lazy-loaded.
    await screen.findByTestId("toaster");

    act(() => triggerToast("Saved", true));
    expect(toast.success).toHaveBeenCalledWith("Saved");

    act(() => triggerToast("Nope", false));
    expect(toast.error).toHaveBeenCalledWith("Nope");
  });

  it("passes a toast action to sonner with a longer duration", async () => {
    render(<ToastHost />);
    await screen.findByTestId("toaster");
    const onClick = vi.fn();

    act(() =>
      triggerToast("Filed under Food", true, { label: "Create rule", onClick }),
    );

    expect(toast.success).toHaveBeenLastCalledWith("Filed under Food", {
      duration: 6000,
      action: { label: "Create rule", onClick },
    });
  });
});
