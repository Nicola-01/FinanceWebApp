import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  act,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type {
  Wallet,
  WalletDashboardData,
  Transaction,
} from "../../../utils/types";
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
