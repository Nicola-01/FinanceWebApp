import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { useBudgets } from "../../../dashboard/budget/useBudgets";

const mocked = vi.mocked(api);

describe("useBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.get.mockResolvedValue({ data: [{ id: "b1", name: "Food budget" }] });
  });

  it("fetches budgets on mount", async () => {
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mocked.get).toHaveBeenCalledWith("/budgets/w1");
    expect(result.current.budgets).toHaveLength(1);
  });

  it("createBudget posts then refreshes", async () => {
    mocked.post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.createBudget({
        name: "Food budget",
        limitAmount: 300,
        periodType: "MONTHLY",
      });
    });
    expect(ok).toBe(true);
    expect(mocked.post).toHaveBeenCalledWith("/budgets/w1", expect.any(Object));
    expect(mocked.get).toHaveBeenCalledTimes(2); // mount + refresh
  });

  it("deleteBudget failure returns false and does not refresh", async () => {
    mocked.delete.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.deleteBudget("b1");
    });
    expect(ok).toBe(false);
    expect(mocked.get).toHaveBeenCalledTimes(1);
  });

  it("updateBudget puts then refreshes", async () => {
    mocked.put.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.updateBudget("b1", {
        name: "X",
        limitAmount: 200,
        periodType: "MONTHLY",
      });
    });
    expect(ok).toBe(true);
    expect(mocked.put).toHaveBeenCalledWith(
      "/budgets/w1/b1",
      expect.any(Object),
    );
    expect(mocked.get).toHaveBeenCalledTimes(2); // mount + refresh
  });

  it("mount fetch failure leaves budgets empty and toasts an error", async () => {
    mocked.get.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.budgets).toEqual([]);
    expect(triggerToast).toHaveBeenCalled();
  });
});
