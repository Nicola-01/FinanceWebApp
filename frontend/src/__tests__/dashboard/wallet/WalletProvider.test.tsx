import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEffect } from "react";
import {
  render,
  screen,
  act,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type {
  Wallet,
  WalletDashboardData,
  Transaction,
} from "../../../utils/types";
import type { PendingOp } from "../../../utils/offlineDb";
import type { DateRangeValue } from "../../../components/DataPicker/CustomDatePicker";

vi.mock("../../../api/walletDataCache", () => ({
  peek: vi.fn(),
  getWalletData: vi.fn(),
  refreshWalletData: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

// Offline-ops queue: WalletProvider loads the pending queue (listOps) and
// re-reads it on SYNC_QUEUE_CHANGED. Default: empty queue (identity overlay).
const { listOps } = vi.hoisted(() => ({
  listOps: vi.fn(() => Promise.resolve([])),
}));
vi.mock("../../../sync/opsQueue", () => ({
  listOps,
  SYNC_QUEUE_CHANGED: "sync-queue-changed",
  enqueueOp: vi.fn(),
}));

import { WalletProvider } from "../../../dashboard/wallet/WalletProvider";
import { useWalletContext } from "../../../dashboard/wallet/WalletContext";
import { peek, getWalletData } from "../../../api/walletDataCache";

const mockedPeek = peek as unknown as ReturnType<typeof vi.fn>;
const mockedGet = getWalletData as unknown as ReturnType<typeof vi.fn>;

const wallet: Wallet = {
  id: "w1",
  name: "Wallet One",
  icon: "",
  color: "#fff",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};
const cachedData = {
  wallet: { ...wallet, name: "Cached Wallet One" },
  transactions: [],
  subscriptions: [],
  tags: [],
} as unknown as WalletDashboardData;

function Consumer() {
  const { wallet } = useWalletContext();
  return <span data-testid="name">{wallet.name}</span>;
}
function renderProvider() {
  return render(
    <MemoryRouter>
      <WalletProvider
        _wallet={wallet}
        onWalletDelete={() => {}}
        onWalletUpdate={() => {}}
      >
        <Consumer />
      </WalletProvider>
    </MemoryRouter>,
  );
}

describe("WalletProvider data loading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedPeek.mockReset();
    mockedGet.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("cache hit: renders cached data instantly with zero fetches", () => {
    mockedPeek.mockReturnValue(cachedData);
    renderProvider();
    expect(screen.getByTestId("name").textContent).toBe("Cached Wallet One");
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("cache miss + skipped before 250ms: never fetches (debounce)", () => {
    mockedPeek.mockReturnValue(null);
    mockedGet.mockResolvedValue(cachedData);
    const { unmount } = renderProvider();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("cache miss + settled 250ms: fetches exactly once", async () => {
    mockedPeek.mockReturnValue(null);
    mockedGet.mockResolvedValue(cachedData);
    renderProvider();
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith("w1", expect.anything());
  });
});

const tx = (id: string, tagName: string, date: string): Transaction =>
  ({
    id,
    tag: { name: tagName },
    transactionDate: date,
    name: `n-${id}`,
  }) as unknown as Transaction;

const richData = {
  wallet,
  transactions: [tx("1", "A", "2025-06-15"), tx("2", "B", "2025-01-15")],
  subscriptions: [],
  tags: [{ name: "A" }, { name: "B" }],
} as unknown as WalletDashboardData;

function FilterConsumer() {
  const {
    filteredTransactions,
    setSelectedTags,
    setSearchQuery,
    setDateRange,
  } = useWalletContext();
  return (
    <div>
      <span data-testid="count">{filteredTransactions.length}</span>
      <span data-testid="ids">
        {filteredTransactions.map((t) => t.id).join(",")}
      </span>
      <button onClick={() => setSelectedTags(["A"])}>only-a</button>
      <button onClick={() => setSearchQuery("n-1")}>search</button>
      <button
        onClick={() =>
          setDateRange({
            start: new Date("2025-06-01"),
            end: new Date("2025-06-30"),
          } as DateRangeValue)
        }
      >
        june
      </button>
    </div>
  );
}

function renderFilterProvider() {
  return render(
    <MemoryRouter>
      <WalletProvider
        _wallet={wallet}
        onWalletDelete={() => {}}
        onWalletUpdate={() => {}}
      >
        <FilterConsumer />
      </WalletProvider>
    </MemoryRouter>,
  );
}

describe("WalletProvider filtering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedPeek.mockReset();
    mockedGet.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("filters transactions by selected tags", () => {
    mockedPeek.mockReturnValue(richData);
    renderFilterProvider();
    expect(screen.getByTestId("count").textContent).toBe("2");

    fireEvent.click(screen.getByText("only-a"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("ids").textContent).toBe("1");
  });

  it("filters transactions by date range", () => {
    mockedPeek.mockReturnValue(richData);
    renderFilterProvider();
    expect(screen.getByTestId("count").textContent).toBe("2");

    fireEvent.click(screen.getByText("june"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("ids").textContent).toBe("1");
  });

  it("filters transactions by search query (name match)", () => {
    mockedPeek.mockReturnValue(richData);
    renderFilterProvider();
    expect(screen.getByTestId("count").textContent).toBe("2");

    fireEvent.click(screen.getByText("search"));
    // Filtering runs on a 200ms-debounced copy of the query.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("ids").textContent).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// Offline overlay: the served lists are overlaid with the pending-ops queue so
// unsynced changes render (flagged with syncState). With an empty queue the
// overlay is identity, so online behavior is unchanged.
// ---------------------------------------------------------------------------

const createTxOp: PendingOp = {
  id: 1,
  walletId: "w1",
  entityType: "transaction",
  entityKey: "tmp-1",
  op: "create",
  payload: {
    name: "Offline coffee",
    amount: 2,
    type: "EXPENSE",
    tag: "Food",
    transactionDate: "2026-07-08",
  },
  baseUpdatedAt: null,
  status: "pending",
  attempts: 0,
  createdAt: 1,
};

function OverlayConsumer() {
  const { transactions } = useWalletContext();
  return (
    <div>
      {transactions.map((t) => (
        <span
          key={t.id}
          data-testid={`tx-${t.id}`}
          data-sync={t.syncState ?? ""}
        >
          {t.name}
        </span>
      ))}
    </div>
  );
}

type WalletCtx = ReturnType<typeof useWalletContext>;
function CaptureConsumer({ sink }: { sink: (ctx: WalletCtx) => void }) {
  const ctx = useWalletContext();
  // Emit from an effect (never reassign outer state during render).
  useEffect(() => {
    sink(ctx);
  });
  return null;
}

describe("WalletProvider offline overlay", () => {
  beforeEach(() => {
    mockedPeek.mockReset();
    mockedGet.mockReset();
    listOps.mockReset();
    listOps.mockResolvedValue([]);
  });
  afterEach(() => {
    cleanup();
  });

  it("overlays a pending create op onto served data and refreshes on queue events", async () => {
    mockedPeek.mockReturnValue(richData);
    listOps.mockResolvedValue([createTxOp]);

    render(
      <MemoryRouter>
        <WalletProvider
          _wallet={wallet}
          onWalletDelete={() => {}}
          onWalletUpdate={() => {}}
        >
          <OverlayConsumer />
        </WalletProvider>
      </MemoryRouter>,
    );

    // The queued create surfaces on context.transactions, flagged "pending".
    const offline = await screen.findByTestId("tx-tmp-1");
    expect(offline.textContent).toBe("Offline coffee");
    expect(offline.getAttribute("data-sync")).toBe("pending");
    // Server rows are still present.
    expect(screen.getByTestId("tx-1")).toBeInTheDocument();

    // Draining the queue and firing SYNC_QUEUE_CHANGED re-reads it.
    listOps.mockResolvedValue([]);
    act(() => {
      window.dispatchEvent(new Event("sync-queue-changed"));
    });
    await waitFor(() =>
      expect(screen.queryByTestId("tx-tmp-1")).not.toBeInTheDocument(),
    );
  });

  it("keeps identical arrays when the queue is empty", async () => {
    mockedPeek.mockReturnValue(richData);
    listOps.mockResolvedValue([]);

    let captured: WalletCtx | null = null;
    render(
      <MemoryRouter>
        <WalletProvider
          _wallet={wallet}
          onWalletDelete={() => {}}
          onWalletUpdate={() => {}}
        >
          <CaptureConsumer sink={(ctx) => (captured = ctx)} />
        </WalletProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(listOps).toHaveBeenCalled());

    // Empty queue → overlay returns the very same references (Task 7 identity),
    // so the context lists are the served arrays unchanged.
    expect(captured).not.toBeNull();
    expect(captured!.transactions).toBe(richData.transactions);
    expect(captured!.subscriptions).toBe(richData.subscriptions);
    expect(captured!.tags).toBe(richData.tags);
    expect(captured!.wallet).toBe(richData.wallet);
  });
});
