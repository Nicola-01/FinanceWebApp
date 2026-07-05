// Client-side CSV helpers shared by the Data-management tab (export + import)
// and the CSV-format reference modal. The column arrays below are the SINGLE
// source of truth for column order, so an exported file always round-trips
// through the matching bulk import endpoint.

/** One documented CSV column: its exact header and a short human hint. */
export interface CsvColumn {
  /** Header exactly as it must appear in the CSV (and the export order). */
  key: string;
  /** Short human meaning shown in the format reference. */
  hint: string;
  /** Whether the column may be left empty. */
  optional?: boolean;
}

type TransactionType = "INCOME" | "EXPENSE";
type SubscriptionStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
type FrequencyType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type DurationType = "FOREVER" | "TIMES" | "UNTIL";

/** Matches the backend `TransactionRequest` bulk-import shape. */
export interface TransactionRequest {
  name: string;
  tag: string;
  amount: number;
  type: TransactionType;
  notes?: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeValue?: number;
  transactionDate: string;
}

/** Matches the backend `TagRequest` bulk-import shape. */
export interface TagRequest {
  name: string;
  icon: string;
  colorHex: string;
  parentName?: string;
}

/** Matches the backend `SubscriptionRequest` bulk-import shape. */
export interface SubscriptionRequest {
  name: string;
  tag: string;
  amount: number;
  type: TransactionType;
  notes?: string;
  status: SubscriptionStatus;
  startDate: string;
  frequencyType: FrequencyType;
  frequencyInterval: number;
  monthlySpecificDay?: number;
  lastWorkingDayOfMonth: boolean;
  duration: DurationType;
  durationTimes?: number;
  durationUntil?: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeValue?: number;
  autoExchangeRate: boolean;
}

// --- Column specs (source of truth for order across export/import/modal) ----

export const TRANSACTION_COLUMNS: CsvColumn[] = [
  { key: "Date", hint: "ISO date — YYYY-MM-DD" },
  { key: "Name", hint: "Transaction label" },
  { key: "Tag", hint: "Name of an existing tag" },
  { key: "Amount", hint: "Positive number" },
  { key: "Type", hint: "INCOME or EXPENSE" },
  { key: "Notes", hint: "Free text", optional: true },
  { key: "OriginalAmount", hint: "Multi-currency amount", optional: true },
  { key: "OriginalCurrency", hint: "ISO code (e.g. JPY)", optional: true },
  { key: "ExchangeValue", hint: "Rate to wallet currency", optional: true },
];

export const TAG_COLUMNS: CsvColumn[] = [
  { key: "Name", hint: "Unique per wallet" },
  { key: "Icon", hint: "Icon key (see icons list)" },
  { key: "ColorHex", hint: "#RRGGBB" },
  {
    key: "ParentName",
    hint: 'Parent tag name, or "" for a top-level tag',
    optional: true,
  },
];

export const SUBSCRIPTION_COLUMNS: CsvColumn[] = [
  { key: "Name", hint: "Subscription label" },
  { key: "Tag", hint: "Name of an existing tag" },
  { key: "Amount", hint: "Positive number" },
  { key: "Type", hint: "INCOME or EXPENSE" },
  { key: "Status", hint: "ACTIVE, PAUSED or COMPLETED" },
  { key: "StartDate", hint: "ISO date — YYYY-MM-DD" },
  { key: "FrequencyType", hint: "DAILY, WEEKLY, MONTHLY or YEARLY" },
  { key: "FrequencyInterval", hint: "Every N periods" },
  { key: "MonthlySpecificDay", hint: "Day of month 1–31", optional: true },
  { key: "LastWorkingDayOfMonth", hint: "true or false" },
  { key: "Duration", hint: "FOREVER, TIMES or UNTIL" },
  { key: "DurationTimes", hint: "Occurrences when TIMES", optional: true },
  { key: "DurationUntil", hint: "End date when UNTIL", optional: true },
  { key: "OriginalAmount", hint: "Multi-currency amount", optional: true },
  { key: "OriginalCurrency", hint: "ISO code (e.g. USD)", optional: true },
  { key: "ExchangeValue", hint: "Rate to wallet currency", optional: true },
  { key: "AutoExchangeRate", hint: "true or false" },
  { key: "Notes", hint: "Free text", optional: true },
];

// --- CSV parsing ------------------------------------------------------------

/**
 * Parses CSV text into a matrix of raw string cells. Handles quoted fields,
 * escaped quotes (`""`), commas and newlines inside quotes, CRLF or lone-CR
 * line endings, a leading UTF-8 BOM, and drops fully blank lines. Does NOT
 * strip the header row — callers slice it off.
 */
export function parseCsv(text: string): string[][] {
  // Strip a leading UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < n) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote inside a quoted field.
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"' && field === "") {
      // A quote only opens a quoted field at the field start.
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      endField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      // Treat CRLF and a lone CR as a single line break.
      if (text[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (ch === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  // Flush the trailing field/row (files without a final newline).
  endRow();

  // Drop fully blank lines (a bare newline yields a single empty cell).
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

// --- Cell coercion helpers --------------------------------------------------

const trimmed = (v: string | undefined): string => (v ?? "").trim();

/** Uppercased trimmed value for enum-like columns (Type, Status, …). */
const toEnum = (v: string | undefined): string => trimmed(v).toUpperCase();

const toNumber = (v: string | undefined): number => Number(trimmed(v));

const toBoolean = (v: string | undefined): boolean =>
  trimmed(v).toLowerCase() === "true";

/** Optional string: raw content preserved, empty/absent → undefined. */
const optionalRaw = (v: string | undefined): string | undefined => {
  const s = v ?? "";
  return s.length > 0 ? s : undefined;
};

/** Optional trimmed string: empty/absent → undefined. */
const optionalTrimmed = (v: string | undefined): string | undefined => {
  const s = trimmed(v);
  return s.length > 0 ? s : undefined;
};

/** Optional number: empty/absent → undefined, otherwise coerced. */
const optionalNumber = (v: string | undefined): number | undefined => {
  const s = trimmed(v);
  return s.length > 0 ? Number(s) : undefined;
};

// --- Row → DTO mappers ------------------------------------------------------

export function rowToTransactionRequest(row: string[]): TransactionRequest {
  const req: TransactionRequest = {
    transactionDate: trimmed(row[0]),
    name: row[1] ?? "",
    tag: trimmed(row[2]),
    amount: toNumber(row[3]),
    type: toEnum(row[4]) as TransactionType,
  };
  const notes = optionalRaw(row[5]);
  if (notes !== undefined) req.notes = notes;
  const originalAmount = optionalNumber(row[6]);
  if (originalAmount !== undefined) req.originalAmount = originalAmount;
  const originalCurrency = optionalTrimmed(row[7]);
  if (originalCurrency !== undefined) req.originalCurrency = originalCurrency;
  const exchangeValue = optionalNumber(row[8]);
  if (exchangeValue !== undefined) req.exchangeValue = exchangeValue;
  return req;
}

export function rowToTagRequest(row: string[]): TagRequest {
  const req: TagRequest = {
    name: trimmed(row[0]),
    icon: trimmed(row[1]),
    colorHex: trimmed(row[2]),
  };
  const parentName = optionalTrimmed(row[3]);
  if (parentName !== undefined) req.parentName = parentName;
  return req;
}

export function rowToSubscriptionRequest(row: string[]): SubscriptionRequest {
  const req: SubscriptionRequest = {
    name: row[0] ?? "",
    tag: trimmed(row[1]),
    amount: toNumber(row[2]),
    type: toEnum(row[3]) as TransactionType,
    status: toEnum(row[4]) as SubscriptionStatus,
    startDate: trimmed(row[5]),
    frequencyType: toEnum(row[6]) as FrequencyType,
    frequencyInterval: toNumber(row[7]),
    lastWorkingDayOfMonth: toBoolean(row[9]),
    duration: toEnum(row[10]) as DurationType,
    autoExchangeRate: toBoolean(row[16]),
  };
  const monthlySpecificDay = optionalNumber(row[8]);
  if (monthlySpecificDay !== undefined)
    req.monthlySpecificDay = monthlySpecificDay;
  const durationTimes = optionalNumber(row[11]);
  if (durationTimes !== undefined) req.durationTimes = durationTimes;
  const durationUntil = optionalTrimmed(row[12]);
  if (durationUntil !== undefined) req.durationUntil = durationUntil;
  const originalAmount = optionalNumber(row[13]);
  if (originalAmount !== undefined) req.originalAmount = originalAmount;
  const originalCurrency = optionalTrimmed(row[14]);
  if (originalCurrency !== undefined) req.originalCurrency = originalCurrency;
  const exchangeValue = optionalNumber(row[15]);
  if (exchangeValue !== undefined) req.exchangeValue = exchangeValue;
  const notes = optionalRaw(row[17]);
  if (notes !== undefined) req.notes = notes;
  return req;
}

// --- Text → DTO array (parse + drop header) ---------------------------------

const dataRows = (text: string): string[][] => parseCsv(text).slice(1);

export const parseTransactionsCsv = (text: string): TransactionRequest[] =>
  dataRows(text).map(rowToTransactionRequest);

export const parseTagsCsv = (text: string): TagRequest[] =>
  dataRows(text).map(rowToTagRequest);

export const parseSubscriptionsCsv = (text: string): SubscriptionRequest[] =>
  dataRows(text).map(rowToSubscriptionRequest);
