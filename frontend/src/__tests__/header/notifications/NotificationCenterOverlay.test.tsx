import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import { NotificationCenterOverlay } from "../../../header/notifications/NotificationCenterOverlay";
import type { AppNotification } from "../../../header/notifications/useNotifications";

/** Force the desktop breakpoint so ResponsiveOverlay renders its drawer. */
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

const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "TRANSACTION_CREATED",
    title: "New transaction by @nicola",
    body: "Food · 12.50 EUR · Casa",
    url: "/dashboard/w1?tab=transactions",
    createdAt: "2026-07-10T10:00:00.000Z",
    read: false,
  },
  {
    id: "n2",
    type: "WALLET_INVITE",
    title: "Wallet invitation",
    body: '@nicola invited you to "Casa"',
    url: "/dashboard",
    createdAt: "2026-07-10T09:00:00.000Z",
    read: true,
  },
];

describe("NotificationCenterOverlay", () => {
  beforeEach(() => {
    setDesktop(true);
    navigateMock.mockClear();
  });

  it("renders each notification's title and body", () => {
    render(
      <NotificationCenterOverlay
        open
        onClose={() => {}}
        notifications={notifications}
      />,
    );
    expect(screen.getByText("New transaction by @nicola")).toBeInTheDocument();
    expect(screen.getByText("Food · 12.50 EUR · Casa")).toBeInTheDocument();
    expect(screen.getByText("Wallet invitation")).toBeInTheDocument();
  });

  it("shows an amber dot only on unread rows", () => {
    // ResponsiveOverlay portals to document.body, so query the whole document.
    render(
      <NotificationCenterOverlay
        open
        onClose={() => {}}
        notifications={notifications}
      />,
    );
    expect(document.querySelectorAll(".bg-amber-400")).toHaveLength(1);
  });

  it("navigates to the notification url and closes on row click", () => {
    const onClose = vi.fn();
    render(
      <NotificationCenterOverlay
        open
        onClose={onClose}
        notifications={notifications}
      />,
    );

    fireEvent.click(screen.getByText("New transaction by @nicola"));

    expect(navigateMock).toHaveBeenCalledWith("/dashboard/w1?tab=transactions");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when there are no notifications", () => {
    render(
      <NotificationCenterOverlay open onClose={() => {}} notifications={[]} />,
    );
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
  });
});
