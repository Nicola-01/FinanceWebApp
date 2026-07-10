import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SyncCenterOverlay } from "../../header/SyncCenterOverlay";
import type { SyncStatus } from "../../hooks/useSyncStatus";
import type { PendingOp } from "../../utils/offlineDb";

/** Force the desktop breakpoint so ResponsiveOverlay renders its drawer. */
function setDesktop(isDesktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function makeOp(overrides: Partial<PendingOp>): PendingOp {
  return {
    id: 1,
    walletId: "w1",
    entityType: "transaction",
    entityKey: "tx-1",
    op: "update",
    payload: {},
    baseUpdatedAt: null,
    status: "pending",
    attempts: 0,
    createdAt: 0,
    ...overrides,
  };
}

const staleOp = makeOp({
  id: 1,
  status: "conflict",
  conflictKind: "stale",
  payload: { name: "Groceries" },
});
const missingOp = makeOp({
  id: 2,
  status: "conflict",
  conflictKind: "missing",
  payload: { name: "Rent" },
});
const failedOp = makeOp({
  id: 3,
  status: "failed",
  lastError: "Server said no",
  payload: { name: "Salary" },
});
const pendingOp = makeOp({
  id: 4,
  status: "pending",
  op: "create",
  payload: { name: "Coffee" },
});

function makeSync(overrides: Partial<SyncStatus> = {}): SyncStatus {
  return {
    online: true,
    syncing: false,
    counts: { pending: 1, syncing: 0, failed: 1, conflict: 2 },
    ops: [staleOp, missingOp, failedOp, pendingOp],
    syncNow: vi.fn().mockResolvedValue(undefined),
    retryOp: vi.fn().mockResolvedValue(undefined),
    discardOp: vi.fn().mockResolvedValue(undefined),
    resolveConflict: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("SyncCenterOverlay", () => {
  beforeEach(() => setDesktop(true));

  it("renders the three sections from the ops array", () => {
    render(<SyncCenterOverlay open onClose={() => {}} sync={makeSync()} />);

    expect(screen.getByText("Conflicts")).toBeInTheDocument();
    expect(screen.getByText("Server changed first")).toBeInTheDocument();
    expect(screen.getByText("Deleted on server")).toBeInTheDocument();

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Server said no")).toBeInTheDocument();

    expect(screen.getByText("Waiting to sync")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });

  it("fires resolveConflict('mine') on Keep mine", () => {
    const sync = makeSync();
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Keep mine" })[0]);
    expect(sync.resolveConflict).toHaveBeenCalledWith(staleOp, "mine");
  });

  it("fires resolveConflict('theirs') on Take theirs", () => {
    const sync = makeSync();
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Take theirs" })[0]);
    expect(sync.resolveConflict).toHaveBeenCalledWith(staleOp, "theirs");
  });

  it("fires retryOp / discardOp on the Failed row", () => {
    const sync = makeSync();
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(sync.retryOp).toHaveBeenCalledWith(failedOp);

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(sync.discardOp).toHaveBeenCalledWith(failedOp);
  });

  it("fires syncNow from the footer button", () => {
    const sync = makeSync();
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    expect(sync.syncNow).toHaveBeenCalledTimes(1);
  });

  it("disables the footer button while offline", () => {
    const sync = makeSync({ online: false });
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);
    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
  });

  it("shows the synced-empty state when there are no ops", () => {
    const sync = makeSync({ ops: [] });
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);
    expect(screen.getByText("All changes are synced.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sync now" }),
    ).not.toBeInTheDocument();
  });
});
