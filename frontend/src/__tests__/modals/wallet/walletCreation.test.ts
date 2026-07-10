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

const bulkBody = (created = 0, updated = 0, autoTags: string[] = []) => ({
  created: Array(created).fill({}),
  updated: Array(updated).fill({}),
  autoCreatedTags: autoTags.map((name) => ({ name })),
});

/** Composite endpoint response; every section is always present. */
const fullOk = (o: Record<string, unknown> = {}) => ({
  data: {
    wallet: { id: "w1" },
    tags: bulkBody(),
    subscriptions: bulkBody(),
    transactions: bulkBody(),
    ...o,
  },
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

// Block body on purpose: mockReset() returns the mock, and a function returned
// from beforeEach would be run by Vitest as a no-arg cleanup hook.
beforeEach(() => {
  post.mockReset();
});

describe("createWalletFromDraft", () => {
  it("sends the whole draft to the composite endpoint in one call", async () => {
    post.mockResolvedValueOnce(fullOk());
    const res = await createWalletFromDraft(
      draft({ tags: [{ name: "Food", icon: "tag", colorHex: "#22c55e" }] }),
    );
    expect(res.walletId).toBe("w1");
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/wallets/full", {
      wallet: expect.objectContaining({ name: "Main", currency: "EUR" }),
      tags: [{ name: "Food", icon: "tag", colorHex: "#22c55e" }],
      subscriptions: [],
      transactions: [],
    });
  });

  it("skips outcomes for resources with no staged data", async () => {
    post.mockResolvedValueOnce(fullOk());
    const res = await createWalletFromDraft(draft());
    expect(res.outcomes).toEqual([]);
    expect(res.anyFailed).toBe(false);
  });

  it("maps the per-resource response counts into outcomes", async () => {
    post.mockResolvedValueOnce(
      fullOk({
        tags: bulkBody(2, 1),
        subscriptions: bulkBody(1, 0, ["Streaming"]),
        transactions: bulkBody(3),
      }),
    );
    const res = await createWalletFromDraft(
      draft({
        tags: [{ name: "Food", icon: "tag", colorHex: "#22c55e" }],
        subscriptions: [sub()],
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
    expect(byRes.tags).toMatchObject({ ok: true, created: 2, updated: 1 });
    expect(byRes.subscriptions).toMatchObject({
      ok: true,
      created: 1,
      autoCreatedTags: ["Streaming"],
    });
    expect(byRes.transactions).toMatchObject({ ok: true, created: 3 });
  });

  it("throws WalletCreateError with the resource-prefixed detail and sends no invites", async () => {
    post.mockRejectedValueOnce(conflict("Transactions: Row 3: bad"));
    await expect(
      createWalletFromDraft(
        draft({
          transactions: [
            {
              transactionDate: "2026-01-01",
              name: "x",
              amount: 1,
              type: "NOPE",
            },
          ],
          invites: [{ user: "a@x.com", role: "EDITOR" }],
        }),
      ),
    ).rejects.toThrow("Transactions: Row 3: bad");
    // The backend rolled everything back — no wallet exists to invite people to.
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("throws WalletCreateError on failure", async () => {
    post.mockRejectedValueOnce(conflict("Tags: Row 0: bad"));
    await expect(createWalletFromDraft(draft())).rejects.toBeInstanceOf(
      WalletCreateError,
    );
  });

  it("reports an offline-specific error when the request never reached the backend", async () => {
    post.mockRejectedValueOnce(new AxiosError("Network Error")); // no response
    await expect(createWalletFromDraft(draft())).rejects.toThrow(/offline/);
  });

  it("loops invites best-effort after the atomic create and reports counts", async () => {
    post.mockImplementation((url: string) => {
      if (url === "/wallets/full") return Promise.resolve(fullOk());
      if (url === "/invitations/w1") {
        const nth = post.mock.calls.filter(
          (c) => c[0] === "/invitations/w1",
        ).length;
        return nth === 1
          ? Promise.resolve({ data: {} })
          : Promise.reject(new AxiosError("x"));
      }
      throw new Error(`unexpected call: ${url}`);
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
    // Invites are the only resource that can partially fail with the wallet kept.
    expect(res.anyFailed).toBe(true);
    expect(res.walletId).toBe("w1");
  });
});
