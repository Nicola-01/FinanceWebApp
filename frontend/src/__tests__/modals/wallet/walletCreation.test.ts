import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError } from "axios";

vi.mock("../../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));

import api from "../../../api/axiosConfig";
import {
  createWalletFromDraft,
  WalletCreateError,
  type WalletDraft,
} from "../../../modals/wallet/walletCreation";
import type { SubscriptionRequest } from "../../../dashboard/settings/csvImport";

const post = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;

const sub = (): SubscriptionRequest => ({
  name: "Netflix",
  tag: "Entertainment",
  amount: 9.99,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
});

const draft = (o: Partial<WalletDraft> = {}): WalletDraft => ({
  basics: {
    name: "Main",
    description: "",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
  },
  tags: [],
  subscriptions: [],
  transactions: [],
  invites: [],
  ...o,
});

const bulkOk = (created = 1) => ({
  data: { created: Array(created).fill({}), updated: [], autoCreatedTags: [] },
});

const conflict = (detail: string) => {
  const err = new AxiosError("conflict");
  err.response = {
    data: { detail },
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: {} } as never,
  };
  return err;
};

beforeEach(() => post.mockReset());

describe("createWalletFromDraft", () => {
  it("creates the wallet and skips resources with no staged data", async () => {
    post.mockResolvedValueOnce({ data: { id: "w1" } });
    const res = await createWalletFromDraft(draft());
    expect(res.walletId).toBe("w1");
    expect(res.outcomes).toEqual([]);
    expect(res.anyFailed).toBe(false);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      "/wallets",
      expect.objectContaining({ name: "Main", currency: "EUR" }),
    );
  });

  it("fires only the staged bulk imports and reports per-resource outcomes", async () => {
    post.mockImplementation((url: string) =>
      url === "/wallets"
        ? Promise.resolve({ data: { id: "w1" } })
        : Promise.resolve(bulkOk(2)),
    );
    const res = await createWalletFromDraft(
      draft({
        tags: [{ name: "Food", icon: "tag", colorHex: "#22c55e" }],
        transactions: [
          {
            transactionDate: "2026-01-01",
            name: "x",
            tag: "Food",
            amount: 1,
            type: "EXPENSE",
          },
        ],
      }),
    );
    expect(res.anyFailed).toBe(false);
    const byRes = Object.fromEntries(res.outcomes.map((o) => [o.resource, o]));
    expect(byRes.tags.ok).toBe(true);
    expect(byRes.tags.created).toBe(2);
    expect(byRes.transactions.ok).toBe(true);
    expect(post).toHaveBeenCalledWith("/tags/w1/bulk", expect.any(Array));
    expect(post).toHaveBeenCalledWith(
      "/transactions/w1/bulk",
      expect.any(Array),
    );
    expect(post).not.toHaveBeenCalledWith(
      "/subscription/w1/bulk",
      expect.anything(),
    );
  });

  it("keeps the wallet and marks only the failing resource on a bulk 409", async () => {
    post.mockImplementation((url: string) => {
      if (url === "/wallets") return Promise.resolve({ data: { id: "w1" } });
      if (url === "/subscription/w1/bulk")
        return Promise.reject(conflict("Row 3: bad"));
      return Promise.resolve(bulkOk(1));
    });
    const res = await createWalletFromDraft(
      draft({
        tags: [{ name: "Food", icon: "tag", colorHex: "#22c55e" }],
        subscriptions: [sub()],
      }),
    );
    expect(res.walletId).toBe("w1");
    expect(res.anyFailed).toBe(true);
    const subs = res.outcomes.find((o) => o.resource === "subscriptions")!;
    expect(subs.ok).toBe(false);
    expect(subs.error).toMatch(/Row 3/);
    expect(res.outcomes.find((o) => o.resource === "tags")!.ok).toBe(true);
  });

  it("throws WalletCreateError and fires no imports when wallet creation fails", async () => {
    post.mockRejectedValueOnce(new AxiosError("boom"));
    await expect(
      createWalletFromDraft(
        draft({ tags: [{ name: "Food", icon: "tag", colorHex: "#22c55e" }] }),
      ),
    ).rejects.toBeInstanceOf(WalletCreateError);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("loops invites and reports sent/failed counts", async () => {
    post.mockImplementation((url: string) => {
      if (url === "/wallets") return Promise.resolve({ data: { id: "w1" } });
      if (url === "/invitations/w1") {
        const nth = post.mock.calls.filter(
          (c) => c[0] === "/invitations/w1",
        ).length;
        return nth === 1
          ? Promise.resolve({ data: {} })
          : Promise.reject(new AxiosError("x"));
      }
      return Promise.resolve(bulkOk());
    });
    const res = await createWalletFromDraft(
      draft({
        invites: [
          { user: "a@x.com", role: "EDITOR" },
          { user: "b@x.com", role: "VIEWER" },
        ],
      }),
    );
    const inv = res.outcomes.find((o) => o.resource === "invites")!;
    expect(inv.sent).toBe(1);
    expect(inv.failed).toBe(1);
    expect(inv.ok).toBe(false);
    expect(res.anyFailed).toBe(true);
  });
});
