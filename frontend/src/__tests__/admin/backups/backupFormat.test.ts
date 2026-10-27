import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ageColorClass,
  formatLabel,
  formatSize,
  parseKeyDate,
  relativeAge,
} from "../../../admin/backups/backupFormat";

afterEach(() => vi.useRealTimers());

describe("formatSize", () => {
  it("scales B / KB / MB", () => {
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(2048)).toBe("2.0 KB");
    expect(formatSize(3 * 1024 * 1024)).toBe("3.00 MB");
  });
});

describe("parseKeyDate / formatLabel", () => {
  it("parses the embedded local timestamp", () => {
    const d = parseKeyDate("backup_2025-04-15_02-00.sql.gz.enc");
    expect(d).toEqual(new Date(2025, 3, 15, 2, 0));
    expect(formatLabel("backup_2025-04-15_02-00.sql.gz.enc")).toBe(
      "15 Apr 2025 · 02:00",
    );
  });

  it("falls back to the raw key when no timestamp", () => {
    expect(parseKeyDate("weird.sql")).toBeNull();
    expect(formatLabel("weird.sql")).toBe("weird.sql");
  });
});

describe("relativeAge / ageColorClass", () => {
  it("buckets by elapsed time, preferring the ISO date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
    expect(relativeAge("2025-06-01T11:59:30Z", null)).toBe("just now");
    expect(relativeAge("2025-06-01T10:00:00Z", null)).toBe("2h ago");
    expect(relativeAge("2025-05-29T12:00:00Z", null)).toBe("3d ago");
    expect(relativeAge("2024-05-01T12:00:00Z", null)).toBe("1y ago");
    expect(relativeAge(null, new Date("2025-06-01T11:00:00Z"))).toBe("1h ago");
    expect(relativeAge(null, null)).toBe("—");

    expect(ageColorClass("2025-06-01T10:00:00Z", null)).toBe("text-app-green");
    expect(ageColorClass("2025-05-20T10:00:00Z", null)).toBe("text-app-muted");
    expect(ageColorClass("2025-01-01T10:00:00Z", null)).toBe(
      "text-app-muted/60",
    );
    expect(ageColorClass("not-a-date", null)).toBe("text-app-muted");
  });
});
