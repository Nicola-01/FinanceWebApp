import { describe, it, expect, vi, afterEach } from "vitest";
import {
  downloadCsv,
  sortTagsForExport,
  subscriptionsCsvRows,
  tagsCsvRows,
  toCsv,
  transactionsCsvRows,
} from "../../../dashboard/settings/csvExport";
import type { Subscription, Tag, Transaction } from "../../../types/domain";

const tag = (name: string, parentName?: string): Tag =>
  ({ name, icon: "tag", colorHex: "#111111", parentName }) as Tag;

describe("toCsv", () => {
  it("quotes every cell, doubles inner quotes, joins rows with LF", () => {
    expect(
      toCsv([
        ["a", 1],
        ['say "hi"', ""],
      ]),
    ).toBe('"a","1"\n"say ""hi""",""');
  });
});

describe("downloadCsv", () => {
  afterEach(() => vi.restoreAllMocks());

  it("downloads a text/csv blob under the given filename and revokes the URL", async () => {
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    let downloadName: string | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.getAttribute("download");
    });

    downloadCsv([["H"], ["v"]], "out.csv");

    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");
    expect(await blob.text()).toBe('"H"\n"v"');
    expect(downloadName).toBe("out.csv");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});

describe("sortTagsForExport", () => {
  it("groups children right after their parent, alphabetically, case-insensitive", () => {
    const sorted = sortTagsForExport([
      tag("rent", "Home"),
      tag("Food"),
      tag("Home"),
      tag("bills", "Home"),
    ]);
    expect(sorted.map((t) => t.name)).toEqual([
      "Food",
      "Home",
      "bills",
      "rent",
    ]);
  });
});

describe("row builders", () => {
  it("transactionsCsvRows: header + chronological rows with blank optionals", () => {
    const tx = (date: string, name: string) =>
      ({
        transactionDate: date,
        name,
        tag: { name: "T" },
        amount: 5,
        type: "EXPENSE",
      }) as unknown as Transaction;
    const rows = transactionsCsvRows([
      tx("2026-02-01", "b"),
      tx("2026-01-01", "a"),
    ]);
    expect(rows[0][0]).toBe("Date");
    expect(rows.slice(1)).toEqual([
      ["2026-01-01", "a", "T", 5, "EXPENSE", "", "", "", ""],
      ["2026-02-01", "b", "T", 5, "EXPENSE", "", "", "", ""],
    ]);
  });

  it("tagsCsvRows: header + sorted rows", () => {
    expect(tagsCsvRows([tag("Kid", "Par"), tag("Par")])).toEqual([
      ["Name", "Icon", "ColorHex", "ParentName"],
      ["Par", "tag", "#111111", ""],
      ["Kid", "tag", "#111111", "Par"],
    ]);
  });

  it("subscriptionsCsvRows: booleans as strings, missing optionals blank", () => {
    const sub = {
      name: "Netflix",
      amount: 12,
      type: "EXPENSE",
      status: "ACTIVE",
      startDate: "2026-01-01",
      frequencyType: "MONTHLY",
      frequencyInterval: 1,
      lastWorkingDayOfMonth: false,
      duration: "FOREVER",
      autoExchangeRate: true,
    } as unknown as Subscription;
    const [header, row] = subscriptionsCsvRows([sub]);
    expect(header).toHaveLength(18);
    expect(row).toEqual([
      "Netflix",
      "",
      12,
      "EXPENSE",
      "ACTIVE",
      "2026-01-01",
      "MONTHLY",
      1,
      "",
      "false",
      "FOREVER",
      "",
      "",
      "",
      "",
      "",
      "true",
      "",
    ]);
  });
});
