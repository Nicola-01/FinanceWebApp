import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { put: vi.fn(), post: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { useJobSchedule } from "../../../admin/system/useJobSchedule";
import type { ScheduledJobDTO } from "../../../admin/system/types";

const mockedPut = api.put as unknown as ReturnType<typeof vi.fn>;

const job: ScheduledJobDTO = {
  key: "backup",
  displayName: "Backup",
  enabled: true,
  frequency: "DAILY",
  hourOfDay: 2,
  minuteOfHour: 0,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  nextRunAt: null,
  recentRuns: [],
};

describe("useJobSchedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tracks dirty state and discards back to the server schedule", () => {
    const { result } = renderHook(() => useJobSchedule(job, vi.fn()));
    expect(result.current.dirty).toBe(false);
    act(() => result.current.setHourOfDay(5));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.handleReset());
    expect(result.current.dirty).toBe(false);
  });

  it("re-syncs the draft when the server job changes", () => {
    const { result, rerender } = renderHook(
      ({ j }) => useJobSchedule(j, vi.fn()),
      { initialProps: { j: job } },
    );
    act(() => result.current.setHourOfDay(5));
    rerender({ j: { ...job, hourOfDay: 7 } });
    expect(result.current.hourOfDay).toBe(7);
    expect(result.current.dirty).toBe(false);
  });

  it("saves the normalized payload and reloads", async () => {
    mockedPut.mockResolvedValue({});
    const onReload = vi.fn();
    const { result } = renderHook(() => useJobSchedule(job, onReload));
    act(() => {
      result.current.setFrequency("WEEKLY");
      result.current.toggleDay("MON");
    });
    await act(() => result.current.handleSave());
    expect(mockedPut).toHaveBeenCalledWith("/admin/jobs/backup/schedule", {
      frequency: "WEEKLY",
      hourOfDay: 2,
      minuteOfHour: 0,
      daysOfWeek: ["MON"],
      dayOfMonth: null,
      monthOfYear: null,
    });
    expect(onReload).toHaveBeenCalled();
  });
});
