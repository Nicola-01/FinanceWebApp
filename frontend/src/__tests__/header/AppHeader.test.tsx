import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { UseNotifications } from "../../header/notifications/useNotifications";

let hookState: UseNotifications;
vi.mock("../../header/notifications/useNotifications", () => ({
  useNotifications: () => hookState,
}));
vi.mock("../../header/notifications/NotificationCenterOverlay", () => ({
  NotificationCenterOverlay: () => null,
}));
vi.mock("../../utils/PWAContext.tsx", () => ({
  usePWA: () => ({ installPrompt: null, installApp: vi.fn() }),
}));
vi.mock("../../components/selectors/ThemeSelector", () => ({
  ThemeSelector: () => null,
}));
vi.mock("../../header/SyncStatusBadge.tsx", () => ({
  SyncStatusBadge: () => null,
}));
vi.mock("../../components/ui/OfflineBanner.tsx", () => ({
  OfflineBanner: () => null,
}));

import { AppHeader } from "../../header/AppHeader";

const renderHeader = () =>
  render(
    <MemoryRouter>
      <AppHeader page={{ text: "My", accent: "Wallet" }} />
    </MemoryRouter>,
  );

beforeEach(() => {
  hookState = {
    notifications: [],
    unreadCount: 0,
    open: false,
    openCenter: vi.fn(),
    closeCenter: vi.fn(),
    refresh: vi.fn(),
  };
});

describe("AppHeader", () => {
  it("the profile menu's Notifications item opens the center", () => {
    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Notification center" }),
    );
    expect(hookState.openCenter).toHaveBeenCalledTimes(1);
  });

  it("flags unread notifications on the profile avatar", () => {
    const { rerender } = renderHeader();
    expect(screen.queryByTestId("profile-unread-dot")).toBeNull();

    hookState = { ...hookState, unreadCount: 2 };
    rerender(
      <MemoryRouter>
        <AppHeader page={{ text: "My", accent: "Wallet" }} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("profile-unread-dot")).toBeInTheDocument();
  });
});
