import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Wallet, WalletDashboardData } from "../../utils/types";

vi.mock("../../api/walletDataCache", () => ({
  peek: vi.fn(),
  getWalletData: vi.fn(),
  refreshWalletData: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import { WalletProvider } from "./WalletProvider";
import { useWalletContext } from "./WalletContext";
import { peek, getWalletData } from "../../api/walletDataCache";

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
