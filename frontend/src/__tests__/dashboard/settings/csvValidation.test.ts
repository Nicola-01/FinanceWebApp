import { describe, it, expect } from "vitest";
import {
  validateTransactions,
  validateTags,
  validateSubscriptions,
  parseAndValidateCsv,
} from "../../../dashboard/settings/csvValidation";
import type {
  TransactionRequest,
  TagRequest,
  SubscriptionRequest,
} from "../../../dashboard/settings/csvImport";

const tx = (o: Partial<TransactionRequest> = {}): TransactionRequest => ({
  transactionDate: "2026-01-15",
  name: "Coffee",
  tag: "Food",
  amount: 3.5,
  type: "EXPENSE",
  ...o,
});

const tag = (o: Partial<TagRequest> = {}): TagRequest => ({
  name: "Food",
  icon: "tag",
  colorHex: "#22c55e",
  ...o,
});

const sub = (o: Partial<SubscriptionRequest> = {}): SubscriptionRequest => ({
  name: "Netflix",
  tag: "Entertainment",
  amount: 9.99,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
  ...o,
});

const has = (errs: { message: string }[], re: RegExp) =>
  errs.some((e) => re.test(e.message));

describe("validateTransactions", () => {
  it("accepts a valid row", () => {
    expect(validateTransactions([tx()])).toEqual([]);
  });

  it("flags a blank name", () => {
    const errs = validateTransactions([tx({ name: "  " })]);
    expect(errs).toHaveLength(1);
    expect(errs[0].row).toBe(1);
    expect(has(errs, /name/i)).toBe(true);
  });

  it("flags a negative amount", () => {
    expect(has(validateTransactions([tx({ amount: -1 })]), /amount/i)).toBe(
      true,
    );
  });

  it("flags a non-numeric (NaN) amount", () => {
    expect(has(validateTransactions([tx({ amount: NaN })]), /amount/i)).toBe(
      true,
    );
  });

  it("flags an unknown type", () => {
    expect(
      has(
        validateTransactions([
          tx({ type: "FOO" as TransactionRequest["type"] }),
        ]),
        /type/i,
      ),
    ).toBe(true);
  });

  it("flags an invalid date", () => {
    expect(
      has(
        validateTransactions([tx({ transactionDate: "2026-02-30" })]),
        /date/i,
      ),
    ).toBe(true);
    expect(
      has(validateTransactions([tx({ transactionDate: "" })]), /date/i),
    ).toBe(true);
  });

  it("reports the row number of the offending record", () => {
    const errs = validateTransactions([tx(), tx({ amount: -5 })]);
    expect(errs).toHaveLength(1);
    expect(errs[0].row).toBe(2);
  });
});

describe("validateTags", () => {
  it("accepts a valid row", () => {
    expect(validateTags([tag()])).toEqual([]);
  });

  it("flags a name shorter than 2 chars", () => {
    expect(has(validateTags([tag({ name: "A" })]), /name/i)).toBe(true);
  });

  it("flags a name longer than 25 chars", () => {
    expect(has(validateTags([tag({ name: "x".repeat(26) })]), /name/i)).toBe(
      true,
    );
  });

  it("flags a missing colour", () => {
    expect(has(validateTags([tag({ colorHex: "" })]), /colou?r/i)).toBe(true);
  });

  it("flags a parent that is not in the batch", () => {
    expect(has(validateTags([tag({ parentName: "Missing" })]), /parent/i)).toBe(
      true,
    );
  });

  it("accepts a parent defined by another row in the batch", () => {
    const errs = validateTags([
      tag({ name: "Groceries", parentName: "Food" }),
      tag({ name: "Food" }),
    ]);
    expect(errs).toEqual([]);
  });

  it("accepts a parent that already exists in the wallet", () => {
    const errs = validateTags(
      [tag({ name: "Groceries", parentName: "Food" })],
      ["Food"],
    );
    expect(errs).toEqual([]);
  });
});

describe("validateSubscriptions", () => {
  it("accepts a valid row", () => {
    expect(validateSubscriptions([sub()])).toEqual([]);
  });

  it("flags an unknown status", () => {
    expect(
      has(
        validateSubscriptions([
          sub({ status: "FOO" as SubscriptionRequest["status"] }),
        ]),
        /status/i,
      ),
    ).toBe(true);
  });

  it("flags an unknown frequency type", () => {
    expect(
      has(
        validateSubscriptions([
          sub({
            frequencyType: "HOURLY" as SubscriptionRequest["frequencyType"],
          }),
        ]),
        /frequency/i,
      ),
    ).toBe(true);
  });

  it("flags an unknown duration", () => {
    expect(
      has(
        validateSubscriptions([
          sub({ duration: "FOO" as SubscriptionRequest["duration"] }),
        ]),
        /duration/i,
      ),
    ).toBe(true);
  });

  it("requires durationTimes when duration is TIMES", () => {
    expect(
      has(validateSubscriptions([sub({ duration: "TIMES" })]), /times/i),
    ).toBe(true);
    expect(
      validateSubscriptions([sub({ duration: "TIMES", durationTimes: 12 })]),
    ).toEqual([]);
  });

  it("requires durationUntil when duration is UNTIL", () => {
    expect(
      has(validateSubscriptions([sub({ duration: "UNTIL" })]), /until/i),
    ).toBe(true);
    expect(
      validateSubscriptions([
        sub({ duration: "UNTIL", durationUntil: "2027-01-01" }),
      ]),
    ).toEqual([]);
  });

  it("flags an invalid start date", () => {
    expect(
      has(validateSubscriptions([sub({ startDate: "nope" })]), /date/i),
    ).toBe(true);
  });

  it("flags a negative amount", () => {
    expect(has(validateSubscriptions([sub({ amount: -2 })]), /amount/i)).toBe(
      true,
    );
  });
});

describe("parseAndValidateCsv", () => {
  it("parses all rows and reports row-level errors for bad ones", () => {
    const text = [
      "Name,Icon,ColorHex,ParentName",
      "Food,tag,#22c55e,",
      ",tag,#22c55e,",
    ].join("\n");
    const { dtos, rowErrors } = parseAndValidateCsv("tags", text);
    expect(dtos).toHaveLength(2);
    expect(rowErrors).toHaveLength(1);
    expect(rowErrors[0].row).toBe(2);
    expect(has(rowErrors, /name/i)).toBe(true);
  });
});
