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

import { HeaderActions } from "../../header/HeaderActions";

const renderActions = () =>
  render(
    <MemoryRouter>
      <HeaderActions />
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

describe("HeaderActions", () => {
  it("renders the profile menu trigger and the notification bell", () => {
    renderActions();
    expect(
      screen.getByRole("button", { name: "Profile menu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /notification/i }),
    ).toBeInTheDocument();
  });

  it("opens the profile menu and shows Logout", () => {
    renderActions();
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }));
    expect(
      screen.getByRole("menuitem", { name: "Logout" }),
    ).toBeInTheDocument();
  });
});
