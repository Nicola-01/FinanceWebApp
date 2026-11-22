import { describe, it, expect, vi } from "vitest";

vi.mock("../../api/axiosConfig", () => ({ default: { put: vi.fn() } }));

import api from "../../api/axiosConfig";
import {
  saveWalletNotificationPrefs,
  setWalletEnabled,
  withReportDefaults,
} from "../../push/walletNotifications";

const entry = {
  walletId: "w1",
  walletName: "Casa",
  muted: true,
  transactions: false,
  subscriptions: false,
  recurringExecutions: true,
  budgets: true,
  monthlyReport: true,
  yearlyReport: true,
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

  it("leaves the report opt-ins untouched in both directions", () => {
    const excluded = {
      ...entry,
      muted: false,
      monthlyReport: false,
      yearlyReport: false,
    };
    for (const enabled of [true, false]) {
      const next = setWalletEnabled(excluded, enabled);
      expect(next.monthlyReport).toBe(false);
      expect(next.yearlyReport).toBe(false);
    }
  });

  it("withReportDefaults treats missing report flags as included", () => {
    const legacy = {
      ...entry,
      monthlyReport: undefined,
      yearlyReport: undefined,
    };
    expect(withReportDefaults(legacy as never)).toMatchObject({
      monthlyReport: true,
      yearlyReport: true,
    });
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
        monthlyReport: true,
        yearlyReport: true,
      },
    );
  });
});
