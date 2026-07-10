import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import api from "../../../api/axiosConfig";
import {
  useNotifications,
  PURGE_DELAY_MS,
  type AppNotification,
} from "../../../header/notifications/useNotifications";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as unknown as ReturnType<typeof vi.fn>;

function sample(): AppNotification[] {
  return [
    {
      id: "n1",
      type: "TRANSACTION_CREATED",
      title: "New transaction by @a",
      body: "b1",
      url: "/dashboard/w1",
      createdAt: "2026-07-10T10:00:00.000Z",
      read: false,
    },
    {
      id: "n2",
      type: "WALLET_INVITE",
      title: "Wallet invitation",
      body: "b2",
      url: "/dashboard",
      createdAt: "2026-07-10T09:00:00.000Z",
      read: false,
    },
  ];
}

/** Flush the mount fetch's microtasks under act (fake timers don't gate them). */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
    mockedGet.mockResolvedValue({ data: sample() });
    mockedPost.mockResolvedValue({});
    mockedDelete.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches on mount and derives the unread count", async () => {
    const { result } = renderHook(() => useNotifications());
    await flush();

    expect(mockedGet).toHaveBeenCalledWith("/notifications");
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(2);
  });

  it("openCenter marks everything read and cancels any pending purge", async () => {
    const { result } = renderHook(() => useNotifications());
    await flush();

    act(() => result.current.openCenter());

    expect(mockedPost).toHaveBeenCalledWith("/notifications/mark-read");
    expect(result.current.open).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it("closeCenter purges the read notifications after the 10s delay", async () => {
    const { result } = renderHook(() => useNotifications());
    await flush();

    act(() => result.current.openCenter());
    act(() => result.current.closeCenter());

    expect(mockedDelete).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PURGE_DELAY_MS);
    });

    expect(mockedDelete).toHaveBeenCalledWith("/notifications/read");
    expect(result.current.notifications).toHaveLength(0);
  });

  it("re-opening within the grace period cancels the purge", async () => {
    const { result } = renderHook(() => useNotifications());
    await flush();

    act(() => result.current.openCenter());
    act(() => result.current.closeCenter());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PURGE_DELAY_MS - 100);
    });
    act(() => result.current.openCenter());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(mockedDelete).not.toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(2);
  });
});
