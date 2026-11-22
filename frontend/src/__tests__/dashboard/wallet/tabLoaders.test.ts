import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type Loader = () => Promise<unknown>;

// schedulePrefetch keeps a module-level "already ran" flag, so each test gets a fresh module.
const loadModule = () => import("../../../dashboard/wallet/tabLoaders.ts");

describe("schedulePrefetch", () => {
  let idle: ReturnType<typeof vi.fn>;
  let cancelIdle: ReturnType<typeof vi.fn>;
  let loaders: Loader[];

  beforeEach(() => {
    vi.resetModules();
    idle = vi.fn(() => 7);
    cancelIdle = vi.fn();
    Object.assign(window, {
      requestIdleCallback: idle,
      cancelIdleCallback: cancelIdle,
    });
    loaders = [vi.fn(() => Promise.resolve()), vi.fn(() => Promise.resolve())];
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as Partial<Window>).requestIdleCallback;
    delete (window as Partial<Window>).cancelIdleCallback;
  });

  it("calls the loaders only after the idle callback fires", async () => {
    const { schedulePrefetch } = await loadModule();
    schedulePrefetch(loaders);
    expect(idle).toHaveBeenCalledTimes(1);
    expect(loaders[0]).not.toHaveBeenCalled();

    idle.mock.calls[0][0]();
    expect(loaders[0]).toHaveBeenCalledTimes(1);
    expect(loaders[1]).toHaveBeenCalledTimes(1);
  });

  it("falls back to a 1500ms timeout without requestIdleCallback", async () => {
    vi.useFakeTimers();
    delete (window as Partial<Window>).requestIdleCallback;
    const { schedulePrefetch } = await loadModule();
    schedulePrefetch(loaders);

    vi.advanceTimersByTime(1499);
    expect(loaders[0]).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(loaders[0]).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending prefetch", async () => {
    const { schedulePrefetch } = await loadModule();
    const cancel = schedulePrefetch(loaders);
    cancel?.();
    expect(cancelIdle).toHaveBeenCalledWith(7);
  });

  it("runs once per app session", async () => {
    const { schedulePrefetch } = await loadModule();
    schedulePrefetch(loaders);
    idle.mock.calls[0][0]();

    expect(schedulePrefetch(loaders)).toBeUndefined();
    expect(idle).toHaveBeenCalledTimes(1);
    expect(loaders[0]).toHaveBeenCalledTimes(1);
  });

  it("reschedules after a cancelled attempt that never ran", async () => {
    const { schedulePrefetch } = await loadModule();
    schedulePrefetch(loaders)?.();
    schedulePrefetch(loaders);
    expect(idle).toHaveBeenCalledTimes(2);
  });
});
