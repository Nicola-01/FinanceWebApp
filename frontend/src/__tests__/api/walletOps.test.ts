import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../sync/opsQueue", () => ({
  enqueueOp: vi.fn(),
}));

import api from "../../api/axiosConfig";
import { enqueueOp } from "../../sync/opsQueue";
import {
  createTransaction,
  updateTransaction,
  deleteTag,
} from "../../api/walletOps";

const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedPut = api.put as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as unknown as ReturnType<typeof vi.fn>;
const mockedEnqueueOp = enqueueOp as unknown as ReturnType<typeof vi.fn>;

describe("walletOps", () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPut.mockReset();
    mockedDelete.mockReset();
    mockedEnqueueOp.mockReset();
    mockedEnqueueOp.mockResolvedValue(undefined);
  });

  it("online create passes through and does not enqueue", async () => {
    mockedPost.mockResolvedValue({ data: { id: "server-1", name: "Rent" } });

    const result = await createTransaction("w1", { name: "Rent" });

    expect(mockedPost).toHaveBeenCalledWith("/transactions/w1", {
      name: "Rent",
    });
    expect(result).toEqual({
      queued: false,
      data: { id: "server-1", name: "Rent" },
    });
    expect(mockedEnqueueOp).not.toHaveBeenCalled();
  });

  it("offline create enqueues with a UUID entityKey mirrored into payload.id", async () => {
    mockedPost.mockRejectedValue({ code: "ERR_NETWORK" });

    const result = await createTransaction("w1", { name: "Rent" });

    expect(result).toEqual({ queued: true, data: null });
    expect(mockedEnqueueOp).toHaveBeenCalledTimes(1);
    const call = mockedEnqueueOp.mock.calls[0][0];
    expect(call.walletId).toBe("w1");
    expect(call.entityType).toBe("transaction");
    expect(call.op).toBe("create");
    expect(typeof call.entityKey).toBe("string");
    expect(call.entityKey.length).toBeGreaterThan(0);
    expect(call.payload).toEqual({ name: "Rent", id: call.entityKey });
    expect(call.baseUpdatedAt).toBeNull();
  });

  it("offline update stores baseUpdatedAt", async () => {
    mockedPut.mockRejectedValue({ code: "ERR_NETWORK" });

    const result = await updateTransaction(
      "w1",
      "tx-1",
      { name: "Rent 2" },
      "2026-07-08T10:00:00Z",
    );

    expect(result).toEqual({ queued: true, data: null });
    expect(mockedEnqueueOp).toHaveBeenCalledWith({
      walletId: "w1",
      entityType: "transaction",
      entityKey: "tx-1",
      op: "update",
      payload: { name: "Rent 2" },
      baseUpdatedAt: "2026-07-08T10:00:00Z",
    });
  });

  it("offline delete of a tag keys on name", async () => {
    mockedDelete.mockRejectedValue({ code: "ERR_NETWORK" });

    const result = await deleteTag("w1", "Groceries", null);

    expect(mockedDelete).toHaveBeenCalledWith("/tags/w1/Groceries");
    expect(result).toEqual({ queued: true, data: null });
    expect(mockedEnqueueOp).toHaveBeenCalledWith({
      walletId: "w1",
      entityType: "tag",
      entityKey: "Groceries",
      op: "delete",
      payload: {},
      baseUpdatedAt: null,
    });
  });

  it("a 400 response rethrows without enqueueing", async () => {
    const error = { response: { status: 400, data: "Bad request" } };
    mockedPost.mockRejectedValue(error);

    await expect(createTransaction("w1", { name: "Rent" })).rejects.toBe(error);
    expect(mockedEnqueueOp).not.toHaveBeenCalled();
  });
});
