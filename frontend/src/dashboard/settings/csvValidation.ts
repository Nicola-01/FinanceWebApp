// Client-side validation for CSV bulk-import DTOs, shared by the Data-management
// tab and the wallet-creation wizard. The rules mirror the backend so bad rows
// are caught and surfaced BEFORE any POST (the bulk endpoints are all-or-nothing:
// a single bad row 409s the whole batch), instead of relying on the server 409.

import {
  parseTransactionsCsv,
  parseTagsCsv,
  parseSubscriptionsCsv,
  type TransactionRequest,
  type TagRequest,
  type SubscriptionRequest,
} from "./csvImport";

export type CsvResource = "transactions" | "tags" | "subscriptions";

/** A single row-level validation problem. */
export interface RowError {
  /** 1-based position of the record among the data rows (header excluded). */
  row: number;
  message: string;
}

const TX_TYPES = new Set(["INCOME", "EXPENSE"]);
const SUB_STATUSES = new Set(["ACTIVE", "PAUSED", "COMPLETED"]);
const FREQ_TYPES = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const DURATIONS = new Set(["FOREVER", "TIMES", "UNTIL"]);

const isBlank = (v: string | null | undefined): boolean => !(v ?? "").trim();

const norm = (v: string | null | undefined): string =>
  (v ?? "").trim().toLowerCase();

/** True for a real calendar date in strict `YYYY-MM-DD` form (rejects e.g. Feb 30). */
const isValidIsoDate = (v: string | null | undefined): boolean => {
  const s = (v ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
};

export function validateTransactions(dtos: TransactionRequest[]): RowError[] {
  const errors: RowError[] = [];
  dtos.forEach((dto, i) => {
    const row = i + 1;
    if (isBlank(dto.name)) errors.push({ row, message: "Name is required" });
    if (!Number.isFinite(dto.amount) || dto.amount < 0)
      errors.push({ row, message: "Amount must be a number ≥ 0" });
    if (!TX_TYPES.has(dto.type))
      errors.push({ row, message: "Type must be INCOME or EXPENSE" });
    if (!isValidIsoDate(dto.transactionDate))
      errors.push({
        row,
        message: "Date must be a valid ISO date (YYYY-MM-DD)",
      });
  });
  return errors;
}

/**
 * Validates tags. A `parentName` must resolve to another tag in the same batch
 * or to one of `existingNames` (the wallet's current tags) — matching how the
 * backend resolves parents. Pass no `existingNames` for a brand-new wallet.
 */
export function validateTags(
  dtos: TagRequest[],
  existingNames: string[] = [],
): RowError[] {
  const errors: RowError[] = [];
  const known = new Set<string>(existingNames.map(norm));
  dtos.forEach((d) => known.add(norm(d.name)));
  dtos.forEach((dto, i) => {
    const row = i + 1;
    const name = (dto.name ?? "").trim();
    if (!name) errors.push({ row, message: "Name is required" });
    else if (name.length < 2 || name.length > 25)
      errors.push({ row, message: "Name must be 2–25 characters" });
    if (isBlank(dto.colorHex))
      errors.push({ row, message: "Colour is required" });
    if (dto.parentName && !known.has(norm(dto.parentName)))
      errors.push({ row, message: `Parent tag "${dto.parentName}" not found` });
  });
  return errors;
}

export function validateSubscriptions(dtos: SubscriptionRequest[]): RowError[] {
  const errors: RowError[] = [];
  dtos.forEach((dto, i) => {
    const row = i + 1;
    if (!Number.isFinite(dto.amount) || dto.amount < 0)
      errors.push({ row, message: "Amount must be a number ≥ 0" });
    if (!TX_TYPES.has(dto.type))
      errors.push({ row, message: "Type must be INCOME or EXPENSE" });
    if (!SUB_STATUSES.has(dto.status))
      errors.push({
        row,
        message: "Status must be ACTIVE, PAUSED or COMPLETED",
      });
    if (!FREQ_TYPES.has(dto.frequencyType))
      errors.push({
        row,
        message: "Frequency must be DAILY, WEEKLY, MONTHLY or YEARLY",
      });
    if (!DURATIONS.has(dto.duration))
      errors.push({ row, message: "Duration must be FOREVER, TIMES or UNTIL" });
    if (
      dto.duration === "TIMES" &&
      !(Number.isFinite(dto.durationTimes) && (dto.durationTimes ?? 0) >= 1)
    )
      errors.push({
        row,
        message: "Duration TIMES needs a positive occurrences count",
      });
    if (dto.duration === "UNTIL" && !isValidIsoDate(dto.durationUntil))
      errors.push({ row, message: "Duration UNTIL needs a valid end date" });
    if (!isValidIsoDate(dto.startDate))
      errors.push({
        row,
        message: "Start date must be a valid ISO date (YYYY-MM-DD)",
      });
  });
  return errors;
}

export interface ParsedCsv<T> {
  dtos: T[];
  rowErrors: RowError[];
}

/** Parse a CSV file's text into DTOs and validate them in one pass. */
export function parseAndValidateCsv(
  resource: "transactions",
  text: string,
): ParsedCsv<TransactionRequest>;
export function parseAndValidateCsv(
  resource: "tags",
  text: string,
): ParsedCsv<TagRequest>;
export function parseAndValidateCsv(
  resource: "subscriptions",
  text: string,
): ParsedCsv<SubscriptionRequest>;
// General overload so callers holding a `CsvResource` union (e.g. CsvUploadField)
// can call it too; literal callers still resolve to the specific overloads above.
export function parseAndValidateCsv(
  resource: CsvResource,
  text: string,
): ParsedCsv<TransactionRequest | TagRequest | SubscriptionRequest>;
export function parseAndValidateCsv(
  resource: CsvResource,
  text: string,
): ParsedCsv<TransactionRequest | TagRequest | SubscriptionRequest> {
  if (resource === "transactions") {
    const dtos = parseTransactionsCsv(text);
    return { dtos, rowErrors: validateTransactions(dtos) };
  }
  if (resource === "tags") {
    const dtos = parseTagsCsv(text);
    return { dtos, rowErrors: validateTags(dtos) };
  }
  const dtos = parseSubscriptionsCsv(text);
  return { dtos, rowErrors: validateSubscriptions(dtos) };
}
