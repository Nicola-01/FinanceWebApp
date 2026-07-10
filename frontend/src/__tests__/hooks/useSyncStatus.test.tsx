import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../sync/opsQueue", () => ({
  SYNC_QUEUE_CHANGED: "sync-queue-changed",
  listOps: vi.fn(),
  countByStatus: vi.fn(),
  updateOp: vi.fn(),
  removeOp: vi.fn(),
}));
vi.mock("../../sync/replay", () => ({
  OFFLINE_SYNC_COMPLETE: "offline-sync-complete",
  replaySync: vi.fn(),
}));
vi.mock("../../api/walletDataCache", () => ({
  invalidate: vi.fn(),
}));

import { useSyncStatus } from "../../hooks/useSyncStatus";
import {
  listOps,
  countByStatus,
  updateOp,
  removeOp,
} from "../../sync/opsQueue";
import { replaySync } from "../../sync/replay";
import { invalidate } from "../../api/walletDataCache";
import { setOnline } from "../../test/testUtils";
import type { PendingOp } from "../../utils/offlineDb";

const mockedListOps = listOps as unknown as ReturnType<typeof vi.fn>;
const mockedCountByStatus = countByStatus as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUpdateOp = updateOp as unknown as ReturnType<typeof vi.fn>;
const mockedRemoveOp = removeOp as unknown as ReturnType<typeof vi.fn>;
const mockedReplaySync = replaySync as unknown as ReturnType<typeof vi.fn>;
const mockedInvalidate = invalidate as unknown as ReturnType<typeof vi.fn>;

function makeOp(overrides: Partial<PendingOp>): PendingOp {
  return {
    id: 7,
    walletId: "w1",
    entityType: "transaction",
    entityKey: "tx-1",
    op: "update",
    payload: { name: "Lunch" },
    baseUpdatedAt: "2026-07-10T00:00:00Z",
    status: "conflict",
    attempts: 1,
    createdAt: 0,
    ...overrides,
  };
}

describe("useSyncStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
    mockedListOps.mockResolvedValue([]);
    mockedCountByStatus.mockResolvedValue({
      pending: 0,
      syncing: 0,
      failed: 0,
      conflict: 0,
    });
    mockedUpdateOp.mockResolvedValue(undefined);
    mockedRemoveOp.mockResolvedValue(undefined);
    mockedReplaySync.mockResolvedValue(undefined);
  });
  afterEach(() => setOnline(true));

  it("loads ops and counts on mount", async () => {
    const op = makeOp({ status: "pending" });
    mockedListOps.mockResolvedValue([op]);
    mockedCountByStatus.mockResolvedValue({
      pending: 1,
      syncing: 0,
      failed: 0,
      conflict: 0,
    });

    const { result } = renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.ops).toHaveLength(1));
    expect(result.current.counts.pending).toBe(1);
    expect(result.current.online).toBe(true);
  });

  it("resolveConflict('mine', stale) clears baseUpdatedAt and replays", async () => {
    const op = makeOp({ conflictKind: "stale" });
    const { result } = renderHook(() => useSyncStatus());

    await act(async () => {
      await result.current.resolveConflict(op, "mine");
    });

    expect(mockedUpdateOp).toHaveBeenCalledWith(7, {
      baseUpdatedAt: null,
      status: "pending",
      conflictKind: undefined,
    });
    expect(mockedReplaySync).toHaveBeenCalledTimes(1);
  });

  it("resolveConflict('mine', missing) turns the op into a create and replays", async () => {
    const op = makeOp({ conflictKind: "missing" });
    const { result } = renderHook(() => useSyncStatus());

    await act(async () => {
      await result.current.resolveConflict(op, "mine");
    });

    expect(mockedUpdateOp).toHaveBeenCalledWith(7, {
      op: "create",
      status: "pending",
      conflictKind: undefined,
    });
    expect(mockedReplaySync).toHaveBeenCalledTimes(1);
  });

  it("resolveConflict('theirs') removes the op, invalidates, and does not replay", async () => {
    const op = makeOp({ conflictKind: "stale" });
    const { result } = renderHook(() => useSyncStatus());

    await act(async () => {
      await result.current.resolveConflict(op, "theirs");
    });

    expect(mockedRemoveOp).toHaveBeenCalledWith(7);
    expect(mockedInvalidate).toHaveBeenCalledWith("w1");
    expect(mockedReplaySync).not.toHaveBeenCalled();
  });

  it("retryOp resets the op to pending then replays", async () => {
    const op = makeOp({ status: "failed" });
    const { result } = renderHook(() => useSyncStatus());

    await act(async () => {
      await result.current.retryOp(op);
    });

    expect(mockedUpdateOp).toHaveBeenCalledWith(7, { status: "pending" });
    expect(mockedReplaySync).toHaveBeenCalledTimes(1);
  });

  it("syncNow delegates to replaySync", async () => {
    const { result } = renderHook(() => useSyncStatus());
    await act(async () => {
      await result.current.syncNow();
    });
    expect(mockedReplaySync).toHaveBeenCalledTimes(1);
  });
});
