import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { useBackups } from "../../../admin/backups/useBackups";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as unknown as ReturnType<typeof vi.fn>;

const entries = [
  { key: "a_2025-04-15_02-00", lastModified: null, sizeBytes: 10 },
  { key: "b_2025-04-14_02-00", lastModified: null, sizeBytes: 10 },
];

describe("useBackups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue({ data: entries });
  });

  it("loads the list on mount", async () => {
    const { result } = renderHook(() => useBackups());
    await waitFor(() => expect(result.current.entries).toEqual(entries));
    expect(mockedGet).toHaveBeenCalledWith("/admin/backup/list");
  });

  it("runs a backup and reloads", async () => {
    mockedPost.mockResolvedValue({});
    const { result } = renderHook(() => useBackups());
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    await act(() => result.current.handleRunBackup());
    expect(mockedPost).toHaveBeenCalledWith("/admin/backup");
    expect(triggerToast).toHaveBeenCalledWith(
      "Backup completed successfully!",
      true,
    );
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it("bulk-deletes the selected keys and clears the selection", async () => {
    mockedDelete.mockResolvedValue({});
    const { result } = renderHook(() => useBackups());
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    act(() => result.current.toggleAll(entries.map((e) => e.key)));
    expect(result.current.selectedCount).toBe(2);
    act(() => result.current.openConfirm("bulk-delete", ""));
    await act(() => result.current.runConfirm());
    expect(mockedDelete).toHaveBeenCalledTimes(2);
    expect(triggerToast).toHaveBeenCalledWith("Deleted 2 snapshots", true);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.confirm.open).toBe(false);
  });

  it("restores a single key", async () => {
    mockedPost.mockResolvedValue({});
    const { result } = renderHook(() => useBackups());
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    act(() => result.current.openConfirm("restore", "a b"));
    await act(() => result.current.runConfirm());
    expect(mockedPost).toHaveBeenCalledWith("/admin/restore/a%20b");
  });
});
