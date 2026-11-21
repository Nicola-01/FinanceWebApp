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

  it("renders title, body and relative time for each row in one card", () => {
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
    expect(screen.getAllByText(/ago$/)).toHaveLength(2);
    expect(screen.getAllByText(/ago$/)[0]).toHaveClass(
      "text-app-faint",
      "tabular-nums",
    );
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
