import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

vi.mock("../../api/axiosConfig", () => ({
  default: { post: vi.fn().mockResolvedValue({}) },
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";
import { usePushMessages } from "../../push/usePushMessages";

const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedToast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const Bridge: React.FC = () => {
  usePushMessages();
  return null;
};

let swTarget: EventTarget;

beforeEach(() => {
  mockedPost.mockClear();
  mockedToast.mockClear();
  navigateMock.mockClear();
  swTarget = new EventTarget();
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: swTarget,
  });
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("usePushMessages", () => {
  it("acks the ?notif= param on mount and strips it from the url", async () => {
    window.history.replaceState(
      null,
      "",
      "/dashboard/w1?tab=transactions&notif=abc123",
    );

    render(<Bridge />);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith("/notifications/abc123/ack"),
    );
    expect(window.location.search).not.toContain("notif=");
    expect(window.location.search).toContain("tab=transactions");
  });

  it("does not ack when there is no notif param", () => {
    window.history.replaceState(null, "", "/dashboard/w1?tab=transactions");
    render(<Bridge />);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("toasts on a PUSH_RECEIVED service-worker message", () => {
    render(<Bridge />);

    swTarget.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "PUSH_RECEIVED",
          payload: {
            title: "New transaction by @nicola",
            body: "Food · 12.50 EUR · Casa",
            url: "/dashboard/w1?tab=transactions",
            notificationId: "n1",
          },
        },
      }),
    );

    expect(mockedToast).toHaveBeenCalledWith(
      "New transaction by @nicola — Food · 12.50 EUR · Casa",
      true,
    );
  });

  it("navigates on an OPEN_NOTIFICATION service-worker message", () => {
    render(<Bridge />);

    swTarget.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "OPEN_NOTIFICATION", url: "/dashboard/w1?notif=n1" },
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/dashboard/w1?notif=n1");
  });
});
