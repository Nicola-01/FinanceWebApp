import { describe, it, expect } from "vitest";
import { applyPendingOps } from "../../sync/overlay";
import type { PendingOp } from "../../utils/offlineDb";
import type {
  Subscription,
  Tag,
  Transaction,
  Wallet,
  WalletDashboardData,
} from "../../utils/types";

const wallet: Wallet = {
  id: "w1",
  name: "Main Wallet",
  icon: "faWallet",
  color: "#123456",
  currency: "EUR",
  createdAt: "2026-01-01T00:00:00Z",
  userRole: "OWNER",
};

const foodTag: Tag = {
  id: "tag-food",
  name: "Food",
  icon: "faUtensils",
  colorHex: "#ff5533",
  parentName: null,
};

const snacksTag: Tag = {
  id: "tag-snacks",
  name: "Snacks",
  icon: "faCookie",
  colorHex: "#33ff55",
  parentName: "Food",
};

const tx1: Transaction = {
  id: "tx1",
  name: "Lunch",
  tag: foodTag,
  amount: 12,
  type: "EXPENSE",
  transactionDate: "2026-01-02",
};

const tx2: Transaction = {
  id: "tx2",
  name: "Coffee",
  tag: snacksTag,
  amount: 4,
  type: "EXPENSE",
  transactionDate: "2026-01-03",
};

const sub1: Subscription = {
  id: "sub1",
  name: "Netflix",
  tag: foodTag,
  amount: 15,
  originalAmount: 15,
  originalCurrency: "EUR",
  exchangeValue: 1,
  autoExchangeRate: false,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  nextExecutionDate: "2026-02-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 0,
};

function buildData(): WalletDashboardData {
  return {
    wallet,
    transactions: [tx1, tx2],
    subscriptions: [sub1],
    tags: [foodTag, snacksTag],
  };
}

function makeOp(
  partial: Partial<PendingOp> &
    Pick<PendingOp, "entityType" | "entityKey" | "op" | "payload">,
): PendingOp {
  return {
    walletId: "w1",
    baseUpdatedAt: null,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
    ...partial,
  };
}

describe("applyPendingOps", () => {
  it("1. returns the same array/object references when there are no pending ops", () => {
    const data = buildData();
    const result = applyPendingOps(data, []);

    expect(result).toBe(data);
    expect(result.transactions).toBe(data.transactions);
    expect(result.subscriptions).toBe(data.subscriptions);
    expect(result.tags).toBe(data.tags);
    expect(result.wallet).toBe(data.wallet);
  });

  it("2. transaction create appends an entity with id=entityKey, resolved tag, and syncState 'pending'", () => {
    const data = buildData();
    const op = makeOp({
      entityType: "transaction",
      entityKey: "tx-new",
      op: "create",
      payload: {
        name: "Taxi",
        tag: "Food",
        amount: 20,
        type: "EXPENSE",
        transactionDate: "2026-01-04",
      },
    });

    const result = applyPendingOps(data, [op]);

    expect(result.transactions).toHaveLength(3);
    const created = result.transactions[2];
    expect(created.id).toBe("tx-new");
    expect(created.name).toBe("Taxi");
    expect(created.tag).toEqual(foodTag);
    expect(created.syncState).toBe("pending");
    // input untouched
    expect(data.transactions).toHaveLength(2);
  });

  it("3. transaction update merges payload onto the matching id and flags syncState", () => {
    const data = buildData();
    const op = makeOp({
      entityType: "transaction",
      entityKey: "tx1",
      op: "update",
      payload: { amount: 99 },
    });

    const result = applyPendingOps(data, [op]);

    const updated = result.transactions.find((t) => t.id === "tx1");
    expect(updated?.amount).toBe(99);
    expect(updated?.syncState).toBe("pending");
    expect(updated?.name).toBe("Lunch");
    // no payload.tag → tag not re-resolved
    expect(updated?.tag).toBe(foodTag);
    // untouched row keeps its identity
    expect(result.transactions.find((t) => t.id === "tx2")).toBe(tx2);
  });

  it("4. transaction delete removes the row", () => {
    const data = buildData();
    const op = makeOp({
      entityType: "transaction",
      entityKey: "tx2",
      op: "delete",
      payload: {},
    });

    const result = applyPendingOps(data, [op]);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions.find((t) => t.id === "tx2")).toBeUndefined();
  });

  it("5. tag create appends; a transaction create referencing that pending tag resolves it (FIFO)", () => {
    const data = buildData();
    const tagOp = makeOp({
      entityType: "tag",
      entityKey: "Travel",
      op: "create",
      payload: { name: "Travel", icon: "faPlane", colorHex: "#0000ff" },
    });
    const txOp = makeOp({
      entityType: "transaction",
      entityKey: "tx-travel",
      op: "create",
      payload: {
        name: "Flight",
        tag: "Travel",
        amount: 300,
        type: "EXPENSE",
        transactionDate: "2026-01-05",
      },
    });

    const result = applyPendingOps(data, [tagOp, txOp]);

    expect(result.tags.some((t) => t.name === "Travel")).toBe(true);
    const created = result.transactions.find((t) => t.id === "tx-travel");
    expect(created?.tag.name).toBe("Travel");
    expect(created?.tag.icon).toBe("faPlane");
    expect(created?.tag.colorHex).toBe("#0000ff");
  });

  it("6. tag rename renames the tag and leaves transactions' embedded tag objects untouched", () => {
    const data = buildData();
    const op = makeOp({
      entityType: "tag",
      entityKey: "Food",
      op: "update",
      payload: { name: "Meals" },
    });

    const result = applyPendingOps(data, [op]);

    const renamed = result.tags.find((t) => t.name === "Meals");
    expect(renamed).toBeDefined();
    expect(renamed?.icon).toBe(foodTag.icon);
    expect(result.tags.find((t) => t.name === "Food")).toBeUndefined();

    // no transaction op was applied → same array reference, embedded tag untouched
    expect(result.transactions).toBe(data.transactions);
    expect(result.transactions[0].tag).toBe(foodTag);
    expect(result.transactions[0].tag.name).toBe("Food");
  });

  it("7. tag delete drops the tag and its children (parentName match)", () => {
    const data = buildData();
    const op = makeOp({
      entityType: "tag",
      entityKey: "Food",
      op: "delete",
      payload: {},
    });

    const result = applyPendingOps(data, [op]);

    expect(result.tags).toHaveLength(0);
  });

  it("8. wallet update overrides wallet fields", () => {
    const data = buildData();
    const op = makeOp({
      entityType: "wallet",
      entityKey: "w1",
      op: "update",
      payload: { name: "Renamed Wallet", color: "#abcdef" },
    });

    const result = applyPendingOps(data, [op]);

    expect(result.wallet.name).toBe("Renamed Wallet");
    expect(result.wallet.color).toBe("#abcdef");
    expect(result.wallet.id).toBe("w1");
    expect(result.wallet.currency).toBe("EUR");
    expect(data.wallet.name).toBe("Main Wallet");
  });

  it("9. op status 'conflict'/'failed' flags syncState accordingly", () => {
    const data = buildData();
    const conflictOp = makeOp({
      entityType: "transaction",
      entityKey: "tx1",
      op: "update",
      payload: { amount: 1 },
      status: "conflict",
    });
    const failedOp = makeOp({
      entityType: "transaction",
      entityKey: "tx2",
      op: "update",
      payload: { amount: 2 },
      status: "failed",
    });

    const result = applyPendingOps(data, [conflictOp, failedOp]);

    expect(result.transactions.find((t) => t.id === "tx1")?.syncState).toBe(
      "conflict",
    );
    expect(result.transactions.find((t) => t.id === "tx2")?.syncState).toBe(
      "failed",
    );
  });
});
