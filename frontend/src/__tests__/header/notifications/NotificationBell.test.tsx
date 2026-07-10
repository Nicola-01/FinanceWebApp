import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { UseNotifications } from "../../../header/notifications/useNotifications";

const { openCenterMock } = vi.hoisted(() => ({ openCenterMock: vi.fn() }));

let hookState: UseNotifications;
vi.mock("../../../header/notifications/useNotifications", () => ({
  useNotifications: () => hookState,
  PURGE_DELAY_MS: 10_000,
}));
// Stub the overlay so the bell test doesn't need Router/portal context.
vi.mock("../../../header/notifications/NotificationCenterOverlay", () => ({
  NotificationCenterOverlay: () => null,
}));

import { NotificationBell } from "../../../header/notifications/NotificationBell";

beforeEach(() => {
  openCenterMock.mockClear();
  hookState = {
    notifications: [],
    unreadCount: 0,
    open: false,
    openCenter: openCenterMock,
    closeCenter: vi.fn(),
    refresh: vi.fn(),
  };
});

describe("NotificationBell", () => {
  it("renders no amber dot when there are no unread notifications", () => {
    const { container } = render(<NotificationBell />);
    expect(container.querySelector(".bg-amber-400")).toBeNull();
  });

  it("renders an amber dot when there are unread notifications", () => {
    hookState.unreadCount = 3;
    const { container } = render(<NotificationBell />);
    expect(container.querySelector(".bg-amber-400")).not.toBeNull();
  });

  it("opens the center on click", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(openCenterMock).toHaveBeenCalledTimes(1);
  });
});
