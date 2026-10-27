// Pure CSV export helpers shared by the Data-management tab (wallet exports)
// and the CSV format modal (sample downloads): one source for cell quoting,
// row building and the Blob download.

import type { Subscription, Tag, Transaction } from "../../types/domain";
import {
  SUBSCRIPTION_COLUMNS,
  TAG_COLUMNS,
  TRANSACTION_COLUMNS,
} from "./csvImport.ts";

type CsvRow = (string | number)[];

/** Every field double-quoted (inner quotes doubled), comma-joined, LF rows. */
export const toCsv = (rows: CsvRow[]): string =>
  rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

/** Serialises `rows` and triggers a browser download named `filename`. */
export const downloadCsv = (rows: CsvRow[], filename: string) => {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export order: alphabetical, grouped by parent — each parent immediately
 * followed by its own children (children alphabetical within the parent).
 */
export const sortTagsForExport = (tags: Tag[]): Tag[] =>
  [...tags].sort((a, b) => {
    const groupA = a.parentName || a.name;
    const groupB = b.parentName || b.name;
    const byGroup = groupA.localeCompare(groupB, undefined, {
      sensitivity: "base",
    });
    if (byGroup !== 0) return byGroup;
    // Same group: the parent (no parentName) comes before its children.
    const childA = a.parentName ? 1 : 0;
    const childB = b.parentName ? 1 : 0;
    if (childA !== childB) return childA - childB;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

/** Header + one row per transaction, chronological (oldest first). */
export const transactionsCsvRows = (transactions: Transaction[]): CsvRow[] => {
  const ordered = [...transactions].sort(
    (a, b) =>
      new Date(a.transactionDate).getTime() -
      new Date(b.transactionDate).getTime(),
  );
  return [
    TRANSACTION_COLUMNS.map((c) => c.key),
    ...ordered.map((tx) => [
      tx.transactionDate,
      tx.name,
      tx.tag.name,
      tx.amount,
      tx.type,
      tx.notes || "",
      tx.originalAmount || "",
      tx.originalCurrency || "",
      tx.exchangeValue || "",
    ]),
  ];
};

/** Header + one row per tag, in {@link sortTagsForExport} order. */
export const tagsCsvRows = (tags: Tag[]): CsvRow[] => [
  TAG_COLUMNS.map((c) => c.key),
  ...sortTagsForExport(tags).map((tag) => [
    tag.name,
    tag.icon,
    tag.colorHex,
    tag.parentName || "",
  ]),
];

/** Header + one row per subscription (booleans as "true"/"false"). */
export const subscriptionsCsvRows = (
  subscriptions: Subscription[],
): CsvRow[] => [
  SUBSCRIPTION_COLUMNS.map((c) => c.key),
  ...subscriptions.map((sub) => [
    sub.name,
    sub.tag?.name ?? "",
    sub.amount,
    sub.type,
    sub.status,
    sub.startDate,
    sub.frequencyType,
    sub.frequencyInterval,
    sub.monthlySpecificDay ?? "",
    String(sub.lastWorkingDayOfMonth),
    sub.duration,
    sub.durationTimes ?? "",
    sub.durationUntil ?? "",
    sub.originalAmount ?? "",
    sub.originalCurrency ?? "",
    sub.exchangeValue ?? "",
    String(sub.autoExchangeRate),
    sub.notes ?? "",
  ]),
];
