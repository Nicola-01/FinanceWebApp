import { describe, it, expect, vi } from "vitest";

vi.mock("../../api/axiosConfig", () => ({ default: { put: vi.fn() } }));

import api from "../../api/axiosConfig";
import {
  saveWalletNotificationPrefs,
  setWalletEnabled,
} from "../../push/walletNotifications";

const entry = {
  walletId: "w1",
  walletName: "Casa",
  muted: true,
  transactions: false,
  subscriptions: false,
  recurringExecutions: true,
  budgets: true,
};

describe("setWalletEnabled", () => {
  it("enabling unmutes and turns every event type back on", () => {
    expect(setWalletEnabled(entry, true)).toEqual({
      ...entry,
      muted: false,
      transactions: true,
      subscriptions: true,
      recurringExecutions: true,
      budgets: true,
    });
  });

  it("disabling only mutes, keeping the event types", () => {
    const on = { ...entry, muted: false };
    expect(setWalletEnabled(on, false)).toEqual({ ...on, muted: true });
  });
});

describe("saveWalletNotificationPrefs", () => {
  it("PUTs only the preference fields", async () => {
    await saveWalletNotificationPrefs("w1", entry);
    expect(api.put).toHaveBeenCalledWith(
      "/wallets/w1/notification-preferences",
      {
        muted: true,
        transactions: false,
        subscriptions: false,
        recurringExecutions: true,
        budgets: true,
      },
    );
  });
});
