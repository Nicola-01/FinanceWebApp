import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type React from "react";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { id: "w1" },
    tags: [],
    transactions: [],
    subscriptions: [],
    fetchData: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock("../../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import {
  toRecap,
  useCsvImport,
} from "../../../dashboard/settings/useCsvImport";
import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";

const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;

const changeEvent = (file: File | undefined) =>
  ({
    target: { files: file ? [file] : [], value: "x" },
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

beforeEach(() => {
  apiPost.mockReset();
  vi.mocked(triggerToast).mockReset();
});

describe("toRecap", () => {
  it("counts created/updated and lists auto-created tag names", () => {
    expect(
      toRecap({
        created: [1, 2],
        autoCreatedTags: [{ name: "Food" }],
      }),
    ).toEqual({ created: 2, updated: 0, autoCreatedTags: ["Food"] });
  });
});

describe("useCsvImport", () => {
  it("ignores a file selection made without a requested target", async () => {
    const { result } = renderHook(() => useCsvImport());
    await act(() =>
      result.current.handleFileSelected(
        changeEvent(new File(["Name\n"], "t.csv")),
      ),
    );
    expect(apiPost).not.toHaveBeenCalled();
    expect(result.current.review).toBeNull();
  });

  it("blocks an invalid file with a row-error toast and never POSTs", async () => {
    const { result } = renderHook(() => useCsvImport());
    act(() => result.current.requestImport("tags"));
    // Missing icon/colour → client-side validation error.
    const csv = "Name,Icon,ColorHex,ParentName\nFood,,,";
    await act(() =>
      result.current.handleFileSelected(changeEvent(new File([csv], "t.csv"))),
    );
    expect(apiPost).not.toHaveBeenCalled();
    expect(vi.mocked(triggerToast).mock.calls[0][0]).toMatch(/^Row \d+: /);
  });

  it("posts a clean file and lands in the recap phase", async () => {
    apiPost.mockResolvedValue({ data: { created: [{}] } });
    const { result } = renderHook(() => useCsvImport());
    act(() => result.current.requestImport("tags"));
    const csv = "Name,Icon,ColorHex,ParentName\nFood,utensils,#112233,";
    await act(() =>
      result.current.handleFileSelected(changeEvent(new File([csv], "t.csv"))),
    );
    expect(apiPost).toHaveBeenCalledWith("/tags/w1/bulk", expect.any(Array));
    expect(result.current.review?.phase).toBe("recap");
    expect(result.current.review?.recap?.created).toBe(1);

    act(() => result.current.closeReview());
    expect(result.current.review).toBeNull();
  });
});
