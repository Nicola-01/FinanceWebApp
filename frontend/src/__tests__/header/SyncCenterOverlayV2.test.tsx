import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SyncCenterOverlay } from "../../header/SyncCenterOverlay";
import { SyncStatusBadge } from "../../header/SyncStatusBadge";
import type { SyncStatus } from "../../hooks/useSyncStatus";
import type { PendingOp } from "../../utils/offlineDb";
import { setUiVersion } from "../../utils/uiVersion";

vi.mock("../../hooks/useSyncStatus", () => ({ useSyncStatus: vi.fn() }));
import { useSyncStatus } from "../../hooks/useSyncStatus";

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
    counts: { pending: 1, syncing: 0, failed: 1, conflict: 1 },
    ops: [staleOp, failedOp, pendingOp],
    syncNow: vi.fn().mockResolvedValue(undefined),
    retryOp: vi.fn().mockResolvedValue(undefined),
    discardOp: vi.fn().mockResolvedValue(undefined),
    resolveConflict: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("SyncCenterOverlay (v2)", () => {
  beforeEach(() => {
    setDesktop(true);
    setUiVersion("v2");
  });
  afterEach(() => setUiVersion("v1"));

  it("renders each group as a labelled card with its rows", () => {
    render(<SyncCenterOverlay open onClose={() => {}} sync={makeSync()} />);

    expect(
      screen.getByRole("heading", { name: "Conflicts" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Failed" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Waiting to sync" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Server changed first")).toBeInTheDocument();
    expect(screen.getByText("Server said no")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("shows the deleted-on-server pill for missing conflicts", () => {
    const missing = makeOp({
      id: 2,
      status: "conflict",
      conflictKind: "missing",
      payload: { name: "Rent" },
    });
    render(
      <SyncCenterOverlay
        open
        onClose={() => {}}
        sync={makeSync({ ops: [missing] })}
      />,
    );
    expect(screen.getByText("Deleted on server")).toBeInTheDocument();
  });

  it("fires resolveConflict on Keep mine and Take theirs", () => {
    const sync = makeSync();
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    fireEvent.click(screen.getByRole("button", { name: "Keep mine" }));
    expect(sync.resolveConflict).toHaveBeenCalledWith(staleOp, "mine");

    fireEvent.click(screen.getByRole("button", { name: "Take theirs" }));
    expect(sync.resolveConflict).toHaveBeenCalledWith(staleOp, "theirs");
  });

  it("fires retryOp and discardOp on the failed row", () => {
    const sync = makeSync();
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(sync.retryOp).toHaveBeenCalledWith(failedOp);

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(sync.discardOp).toHaveBeenCalledWith(failedOp);
  });

  it("shows the muted empty state with no footer when nothing is queued", () => {
    const sync = makeSync({ ops: [] });
    render(<SyncCenterOverlay open onClose={() => {}} sync={sync} />);

    const empty = screen.getByText("All changes are synced.");
    expect(empty).toHaveClass("py-6", "text-[13px]", "text-app-muted");
    expect(
      screen.queryByRole("button", { name: "Sync now" }),
    ).not.toBeInTheDocument();
  });
});

describe("SyncStatusBadge (v2)", () => {
  beforeEach(() => {
    setDesktop(true);
    setUiVersion("v2");
  });
  afterEach(() => setUiVersion("v1"));

  it("uses semantic colour tokens and no monospace font", () => {
    vi.mocked(useSyncStatus).mockReturnValue(makeSync());
    render(<SyncStatusBadge />);

    const button = screen.getByRole("button", { name: "Open sync center" });
    expect(button).toHaveClass("text-app-danger");
    expect(button).not.toHaveClass("text-red-400");
    expect(screen.getByText("3")).not.toHaveClass("font-app-mono");
  });
});
