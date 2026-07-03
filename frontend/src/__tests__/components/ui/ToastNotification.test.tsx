import { describe, it, expect, vi } from "vitest";
import {
  triggerToast,
  registerToastHandler,
  type ToastData,
} from "../../../components/ui/ToastNotification";

describe("ToastNotification module API", () => {
  it("forwards a success toast to the registered handler", () => {
    const handler = vi.fn<(data: ToastData) => void>();
    const unregister = registerToastHandler(handler);

    triggerToast("Saved", true);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ message: "Saved", success: true });

    unregister();
  });

  it("forwards an error toast with success = false", () => {
    const handler = vi.fn<(data: ToastData) => void>();
    const unregister = registerToastHandler(handler);

    triggerToast("Something failed", false);

    expect(handler).toHaveBeenCalledWith({
      message: "Something failed",
      success: false,
    });

    unregister();
  });

  it("does nothing (and does not throw) when no handler is registered", () => {
    // Register then immediately unregister so no handler is active.
    const handler = vi.fn<(data: ToastData) => void>();
    registerToastHandler(handler)();

    expect(() => triggerToast("Ignored", true)).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it("unregister stops future toasts from reaching the handler", () => {
    const handler = vi.fn<(data: ToastData) => void>();
    const unregister = registerToastHandler(handler);

    triggerToast("first", true);
    unregister();
    triggerToast("second", true);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("a stale unregister does not clobber a newer handler", () => {
    const first = vi.fn<(data: ToastData) => void>();
    const second = vi.fn<(data: ToastData) => void>();

    const unregisterFirst = registerToastHandler(first);
    registerToastHandler(second); // second is now the active handler

    // The first host's cleanup must NOT detach the newer handler.
    unregisterFirst();

    triggerToast("hello", true);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ message: "hello", success: true });
  });
});
