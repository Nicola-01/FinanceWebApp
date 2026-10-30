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
      monthlyReport: true,
      yearlyReport: true,
      wallets: [
        {
          walletId: "w1",
          walletName: "Casa",
          muted: false,
          transactions: true,
          subscriptions: false,
          recurringExecutions: true,
          budgets: true,
        },
      ],
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

  it("renders all cards", async () => {
    render(<NotificationsSection />);
    expect(await screen.findByText("This device")).toBeInTheDocument();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
    expect(screen.getByText("Periodic reports")).toBeInTheDocument();
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

  it("the invitations toggle PUTs all the global booleans", async () => {
    render(<NotificationsSection />);
    await screen.findByText("Casa");

    await userEvent.click(
      screen.getByRole("switch", { name: "Wallet invitations" }),
    );

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith(
        "/users/me/notification-preferences",
        { invites: false, monthlyReport: true, yearlyReport: true },
      ),
    );
  });

  it("a report toggle PUTs with that report flag flipped", async () => {
    render(<NotificationsSection />);
    await screen.findByText("Casa");

    await userEvent.click(
      screen.getByRole("switch", { name: "Monthly report" }),
    );

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith(
        "/users/me/notification-preferences",
        { invites: true, monthlyReport: false, yearlyReport: true },
      ),
    );
  });

  it("turning a wallet off mutes it and hides the expand button", async () => {
    render(<NotificationsSection />);
    await screen.findByText("Casa");

    await userEvent.click(
      screen.getByRole("switch", { name: "Notifications for Casa" }),
    );

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith(
        "/wallets/w1/notification-preferences",
        {
          muted: true,
          transactions: true,
          subscriptions: false,
          recurringExecutions: true,
          budgets: true,
        },
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Options for Casa" }),
    ).not.toBeInTheDocument();
  });

  it("turning a muted wallet on enables every event type and expands it", async () => {
    mockedGet.mockResolvedValue(
      preferences({
        wallets: [
          {
            walletId: "w1",
            walletName: "Casa",
            muted: true,
            transactions: false,
            subscriptions: false,
            recurringExecutions: false,
            budgets: false,
          },
        ],
      }),
    );
    render(<NotificationsSection />);
    await screen.findByText("Casa");

    await userEvent.click(
      screen.getByRole("switch", { name: "Notifications for Casa" }),
    );

    expect(mockedPut).toHaveBeenCalledWith(
      "/wallets/w1/notification-preferences",
      {
        muted: false,
        transactions: true,
        subscriptions: true,
        recurringExecutions: true,
        budgets: true,
      },
    );
    expect(screen.getByRole("switch", { name: "Subscriptions" })).toBeChecked();
  });

  it("an enabled wallet expands to its event toggles", async () => {
    render(<NotificationsSection />);
    await screen.findByText("Casa");
    expect(
      screen.queryByRole("switch", { name: "Transactions" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Options for Casa" }),
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "Recurring executions" }),
    );

    expect(mockedPut).toHaveBeenCalledWith(
      "/wallets/w1/notification-preferences",
      {
        muted: false,
        transactions: true,
        subscriptions: false,
        recurringExecutions: false,
        budgets: true,
      },
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
