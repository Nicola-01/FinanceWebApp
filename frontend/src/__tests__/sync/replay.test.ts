import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError } from "axios";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../sync/opsQueue", () => ({
  enqueueOp: vi.fn(),
  listOps: vi.fn(),
  updateOp: vi.fn(),
  removeOp: vi.fn(),
}));
vi.mock("../../api/walletDataCache", () => ({
  invalidate: vi.fn(),
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../api/axiosConfig";
import { listOps, updateOp, removeOp } from "../../sync/opsQueue";
import { invalidate } from "../../api/walletDataCache";
import { triggerToast } from "../../components/ui/ToastNotification";
import {
  replaySync,
  classifyReplayError,
  OFFLINE_SYNC_COMPLETE,
} from "../../sync/replay";
import type { PendingOp } from "../../utils/offlineDb";

const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedPut = api.put as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as unknown as ReturnType<typeof vi.fn>;
const mockedListOps = listOps as unknown as ReturnType<typeof vi.fn>;
const mockedUpdateOp = updateOp as unknown as ReturnType<typeof vi.fn>;
const mockedRemoveOp = removeOp as unknown as ReturnType<typeof vi.fn>;
const mockedInvalidate = invalidate as unknown as ReturnType<typeof vi.fn>;
const mockedToast = triggerToast as unknown as ReturnType<typeof vi.fn>;

function makeOp(overrides: Partial<PendingOp>): PendingOp {
  return {
    id: 1,
    walletId: "w1",
    entityType: "transaction",
    entityKey: "tx-1",
    op: "create",
    payload: {},
    baseUpdatedAt: null,
    status: "pending",
    attempts: 0,
    createdAt: 0,
    ...overrides,
  };
}

/** Real AxiosError carrying an HTTP response so the apiError helpers parse it. */
function httpErr(status: number, data: unknown): AxiosError {
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    { headers: {} } as never,
    {},
    {
      status,
      data,
      statusText: "",
      headers: {},
      config: { headers: {} } as never,
    } as never,
  );
}

/** Real AxiosError with no response — a request that never reached the server. */
function networkErr(): AxiosError {
  return new AxiosError(
    "Network Error",
    "ERR_NETWORK",
    { headers: {} } as never,
    {},
  );
}

describe("replaySync", () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPut.mockReset();
    mockedDelete.mockReset();
    mockedListOps.mockReset();
    mockedUpdateOp.mockReset().mockResolvedValue(undefined);
    mockedRemoveOp.mockReset().mockResolvedValue(undefined);
    mockedInvalidate.mockReset();
    mockedToast.mockReset();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("replays a create via POST to /transactions/w1 and removes the op", async () => {
    mockedListOps.mockResolvedValue([
      makeOp({ id: 7, op: "create", payload: { id: "tx-1", name: "Rent" } }),
    ]);
    mockedPost.mockResolvedValue({ data: {} });

    await replaySync();

    expect(mockedPost).toHaveBeenCalledWith("/transactions/w1", {
      id: "tx-1",
      name: "Rent",
    });
    expect(mockedRemoveOp).toHaveBeenCalledWith(7);
    expect(mockedInvalidate).toHaveBeenCalledWith("w1");
  });

  it("update sends baseUpdatedAt in the body; delete sends it as a query param", async () => {
    const upd = makeOp({
      id: 1,
      op: "update",
      entityKey: "tx-1",
      payload: { name: "New" },
      baseUpdatedAt: "2026-07-08T10:00:00Z",
    });
    const del = makeOp({
      id: 2,
      op: "delete",
      entityKey: "tx-2",
      payload: {},
      baseUpdatedAt: "2026-07-09T10:00:00Z",
    });
    mockedListOps.mockResolvedValue([upd, del]);
    mockedPut.mockResolvedValue({ data: {} });
    mockedDelete.mockResolvedValue({ data: {} });

    await replaySync();

    expect(mockedPut).toHaveBeenCalledWith("/transactions/w1/tx-1", {
      name: "New",
      baseUpdatedAt: "2026-07-08T10:00:00Z",
    });
    expect(mockedDelete).toHaveBeenCalledWith("/transactions/w1/tx-2", {
      params: { baseUpdatedAt: "2026-07-09T10:00:00Z" },
    });
  });

  it("classifies a 409 Stale Write as a stale conflict and continues to the next op", async () => {
    const staleOp = makeOp({
      id: 1,
      op: "update",
      entityKey: "tx-1",
      payload: { name: "A" },
      baseUpdatedAt: "t",
      attempts: 2,
    });
    const okOp = makeOp({ id: 2, op: "create", payload: { id: "tx-2" } });
    mockedListOps.mockResolvedValue([staleOp, okOp]);
    mockedPut.mockRejectedValue(
      httpErr(409, { title: "Stale Write", detail: "changed on the server" }),
    );
    mockedPost.mockResolvedValue({ data: {} });

    await replaySync();

    expect(mockedUpdateOp).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: "conflict",
        conflictKind: "stale",
        attempts: 3,
      }),
    );
    // Loop continued to the second op.
    expect(mockedPost).toHaveBeenCalledWith("/transactions/w1", { id: "tx-2" });
    expect(mockedRemoveOp).toHaveBeenCalledWith(2);
  });

  it("classifies an update that 404s as a missing conflict", async () => {
    mockedListOps.mockResolvedValue([
      makeOp({
        id: 1,
        op: "update",
        entityKey: "tx-1",
        payload: { name: "A" },
        baseUpdatedAt: "t",
      }),
    ]);
    mockedPut.mockRejectedValue(
      httpErr(404, { title: "Not Found", detail: "Transaction not found" }),
    );

    await replaySync();

    expect(mockedUpdateOp).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: "conflict", conflictKind: "missing" }),
    );
    expect(mockedRemoveOp).not.toHaveBeenCalled();
  });

  it("treats a delete that 409s (non-stale) as already gone and removes the op", async () => {
    mockedListOps.mockResolvedValue([
      makeOp({
        id: 1,
        op: "delete",
        entityKey: "tx-1",
        payload: {},
        baseUpdatedAt: "t",
      }),
    ]);
    mockedDelete.mockRejectedValue(
      httpErr(409, { title: "Conflict", detail: "already deleted" }),
    );

    await replaySync();

    expect(mockedRemoveOp).toHaveBeenCalledWith(1);
  });

  it("stops on a network error mid-loop, reverting the current op and leaving later ops untouched", async () => {
    mockedListOps.mockResolvedValue([
      makeOp({ id: 1, op: "create", payload: { id: "a" } }),
      makeOp({ id: 2, op: "create", payload: { id: "b" } }),
      makeOp({ id: 3, op: "create", payload: { id: "c" } }),
    ]);
    mockedPost
      .mockResolvedValueOnce({ data: {} }) // op 1 succeeds
      .mockRejectedValueOnce(networkErr()); // op 2 fails offline

    const events: Array<{ synced: number; failed: number; conflicts: number }> =
      [];
    const handler = (e: Event) =>
      events.push(
        (
          e as CustomEvent<{
            synced: number;
            failed: number;
            conflicts: number;
          }>
        ).detail,
      );
    window.addEventListener(OFFLINE_SYNC_COMPLETE, handler);

    await replaySync();

    window.removeEventListener(OFFLINE_SYNC_COMPLETE, handler);

    // op 3 was never attempted.
    expect(mockedPost).toHaveBeenCalledTimes(2);
    // op 1 removed, op 2 reverted to pending, op 3 untouched.
    expect(mockedRemoveOp).toHaveBeenCalledWith(1);
    expect(mockedRemoveOp).toHaveBeenCalledTimes(1);
    expect(mockedUpdateOp).toHaveBeenCalledWith(2, { status: "pending" });
    expect(mockedUpdateOp).not.toHaveBeenCalledWith(3, expect.anything());
    // Event dispatched with the PARTIAL synced count.
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ synced: 1 });
  });

  it("fires a single toast summarizing the synced changes", async () => {
    mockedListOps.mockResolvedValue([
      makeOp({ id: 1, op: "create", payload: { id: "a" } }),
      makeOp({ id: 2, op: "create", payload: { id: "b" } }),
    ]);
    mockedPost.mockResolvedValue({ data: {} });

    await replaySync();

    expect(mockedToast).toHaveBeenCalledTimes(1);
    expect(mockedToast).toHaveBeenCalledWith("2 offline changes synced", true);
  });

  it("ignores a concurrent replaySync while one is already running", async () => {
    let resolveList!: (v: PendingOp[]) => void;
    mockedListOps.mockReturnValue(
      new Promise<PendingOp[]>((r) => {
        resolveList = r;
      }),
    );

    const p1 = replaySync();
    const p2 = replaySync();
    resolveList([]);
    await Promise.all([p1, p2]);

    // The second call returned immediately without draining the queue again.
    expect(mockedListOps).toHaveBeenCalledTimes(1);
  });
});

describe("classifyReplayError", () => {
  it("maps a network error to offline", () => {
    expect(classifyReplayError(makeOp({ op: "update" }), networkErr())).toEqual(
      { kind: "offline" },
    );
  });

  it("maps a Stale Write title to a stale conflict", () => {
    expect(
      classifyReplayError(
        makeOp({ op: "update" }),
        httpErr(409, { title: "Stale Write" }),
      ),
    ).toEqual({ kind: "conflict", conflictKind: "stale" });
  });

  it("maps an unrelated 4xx to failed", () => {
    const result = classifyReplayError(
      makeOp({ op: "update" }),
      httpErr(422, { title: "Bad", detail: "invalid amount" }),
    );
    expect(result).toEqual({ kind: "failed", message: "invalid amount" });
  });
});
