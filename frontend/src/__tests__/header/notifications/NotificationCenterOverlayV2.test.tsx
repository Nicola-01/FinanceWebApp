import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import { NotificationCenterOverlay } from "../../../header/notifications/NotificationCenterOverlay";
import type { AppNotification } from "../../../header/notifications/useNotifications";
import { setUiVersion } from "../../../utils/uiVersion";
import { stampLabel } from "../../../header/notifications/notificationStamp";

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

// Same fixtures as NotificationCenterOverlay.test.tsx.
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

describe("NotificationCenterOverlay (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    setDesktop(true);
    navigateMock.mockClear();
  });
  afterEach(() => setUiVersion("v1"));

  it("renders date/time, title and body for each row in one card", () => {
    render(
      <NotificationCenterOverlay
        open
        onClose={() => {}}
        notifications={notifications}
      />,
    );
    expect(screen.getByText("New transaction by @nicola")).toHaveClass(
      "text-[15px]",
      "text-app-text",
    );
    expect(screen.getByText("Food · 12.50 EUR · Casa")).toHaveClass(
      "line-clamp-2",
      "text-[13px]",
    );
    expect(screen.getByText("Wallet invitation")).toBeInTheDocument();
    // Old fixture dates: absolute "d MMM, HH:mm" stamp placed before the title.
    const stamps = screen.getAllByText(/^10 Jul, \d\d:\d\d$/);
    expect(stamps).toHaveLength(2);
    expect(stamps[0]).toHaveClass("text-app-faint");
    expect(
      stamps[0].compareDocumentPosition(
        screen.getByText("New transaction by @nicola"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(document.querySelector("ul")).toHaveClass(
      "divide-y",
      "bg-app-card",
      "rounded-[var(--r-card)]",
    );
  });

  it("marks only unread rows with the warn dot and a semibold title", () => {
    render(
      <NotificationCenterOverlay
        open
        onClose={() => {}}
        notifications={notifications}
      />,
    );
    expect(document.querySelectorAll(".bg-app-warn")).toHaveLength(1);
    expect(document.querySelectorAll(".bg-amber-400")).toHaveLength(0);
    expect(screen.getByText("New transaction by @nicola")).toHaveClass(
      "font-semibold",
    );
    expect(screen.getByText("Wallet invitation")).not.toHaveClass(
      "font-semibold",
    );
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

  it("shows a muted centred empty line", () => {
    render(
      <NotificationCenterOverlay open onClose={() => {}} notifications={[]} />,
    );
    expect(screen.getByText("You're all caught up.")).toHaveClass(
      "py-6",
      "text-[13px]",
      "text-app-muted",
    );
  });
});

describe("stampLabel", () => {
  it("says Today / Yesterday, else day and month, always with the time", () => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      9,
      14,
    );
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(stampLabel(today)).toBe("Today, 09:14");
    expect(stampLabel(yesterday)).toBe("Yesterday, 09:14");
    expect(stampLabel(new Date(2025, 10, 3, 18, 2))).toBe("3 Nov, 18:02");
  });
});
