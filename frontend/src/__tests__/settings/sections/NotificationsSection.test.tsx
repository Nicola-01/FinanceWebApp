import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));
vi.mock("../../../push/pushClient", () => ({
  getEnrollment: vi.fn(),
  subscribeThisDevice: vi.fn(),
  unsubscribeThisDevice: vi.fn(),
}));
vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import {
  getEnrollment,
  subscribeThisDevice,
  unsubscribeThisDevice,
} from "../../../push/pushClient";
import { NotificationsSection } from "../../../settings/sections/NotificationsSection";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPut = api.put as unknown as ReturnType<typeof vi.fn>;
const mockedGetEnrollment = getEnrollment as unknown as ReturnType<
  typeof vi.fn
>;
const mockedSubscribe = subscribeThisDevice as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUnsubscribe = unsubscribeThisDevice as unknown as ReturnType<
  typeof vi.fn
>;

function preferences(overrides = {}) {
  return {
    data: {
      invites: true,
      transactions: true,
      subscriptions: false,
      recurringExecutions: true,
      walletMutes: [{ walletId: "w1", walletName: "Casa", muted: false }],
      ...overrides,
    },
  };
}

describe("NotificationsSection", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPut.mockReset();
    mockedGetEnrollment.mockReset();
    mockedSubscribe.mockReset();
    mockedUnsubscribe.mockReset();

    mockedGet.mockResolvedValue(preferences());
    mockedPut.mockResolvedValue({ data: {} });
    mockedGetEnrollment.mockResolvedValue("unsubscribed");
  });

  it("renders the three cards", async () => {
    render(<NotificationsSection />);
    expect(await screen.findByText("This device")).toBeInTheDocument();
    expect(screen.getByText("What you get notified about")).toBeInTheDocument();
    expect(screen.getByText("Per-wallet")).toBeInTheDocument();
  });

  it("device toggle calls subscribeThisDevice when enabling", async () => {
    mockedGetEnrollment.mockResolvedValue("unsubscribed");
    mockedSubscribe.mockResolvedValue("subscribed");
    render(<NotificationsSection />);

    const toggle = await screen.findByRole("switch", {
      name: "Enable push notifications on this device",
    });
    await userEvent.click(toggle);

    expect(mockedSubscribe).toHaveBeenCalledTimes(1);
  });

  it("device toggle calls unsubscribeThisDevice when disabling", async () => {
    mockedGetEnrollment.mockResolvedValue("subscribed");
    mockedUnsubscribe.mockResolvedValue(undefined);
    render(<NotificationsSection />);

    const toggle = await screen.findByRole("switch", {
      name: "Enable push notifications on this device",
    });
    await waitFor(() => expect(toggle).toBeChecked());
    await userEvent.click(toggle);

    expect(mockedUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("a global toggle PUTs the four booleans", async () => {
    render(<NotificationsSection />);
    await screen.findByText("Casa");

    await userEvent.click(
      screen.getByRole("switch", { name: "Subscriptions in shared wallets" }),
    );

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith(
        "/users/me/notification-preferences",
        {
          invites: true,
          transactions: true,
          subscriptions: true,
          recurringExecutions: true,
        },
      ),
    );
  });

  it("a wallet-mute toggle PUTs the mute state for that wallet", async () => {
    render(<NotificationsSection />);
    await screen.findByText("Casa");

    await userEvent.click(
      screen.getByRole("switch", { name: "Mute this wallet" }),
    );

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith("/wallets/w1/notification-mute", {
        muted: true,
      }),
    );
  });

  it("renders the fallback copy instead of a toggle when unsupported", async () => {
    mockedGetEnrollment.mockResolvedValue("unsupported");
    render(<NotificationsSection />);

    expect(
      await screen.findByText("Push is not supported in this browser."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("switch", {
        name: "Enable push notifications on this device",
      }),
    ).not.toBeInTheDocument();
  });
});
