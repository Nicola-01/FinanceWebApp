import { describe, it, expect } from "vitest";
import {
  rowToTransactionRequest,
  rowToTagRequest,
  rowToSubscriptionRequest,
  parseTransactionsCsv,
  parseTagsCsv,
  parseSubscriptionsCsv,
  TRANSACTION_COLUMNS,
  TAG_COLUMNS,
  SUBSCRIPTION_COLUMNS,
} from "../../../dashboard/settings/csvImport";

describe("rowToTransactionRequest", () => {
  it("maps a full row and uppercases the type", () => {
    const row = [
      "2026-06-10",
      "Hotel Tokyo",
      "Travel",
      "120.25",
      "expense",
      "Business trip",
      "18500",
      "JPY",
      "0.0065",
    ];
    expect(rowToTransactionRequest(row)).toEqual({
      transactionDate: "2026-06-10",
      name: "Hotel Tokyo",
      tag: "Travel",
      amount: 120.25,
      type: "EXPENSE",
      notes: "Business trip",
      originalAmount: 18500,
      originalCurrency: "JPY",
      exchangeValue: 0.0065,
    });
  });

  it("omits empty optional fields", () => {
    const row = [
      "2026-06-01",
      "Salary",
      "Income",
      "2500",
      "INCOME",
      "",
      "",
      "",
      "",
    ];
    expect(rowToTransactionRequest(row)).toEqual({
      transactionDate: "2026-06-01",
      name: "Salary",
      tag: "Income",
      amount: 2500,
      type: "INCOME",
    });
  });
});

describe("rowToTagRequest", () => {
  it("maps a child tag with a parent", () => {
    expect(rowToTagRequest(["Groceries", "cart", "#fb923c", "Food"])).toEqual({
      name: "Groceries",
      icon: "cart",
      colorHex: "#fb923c",
      parentName: "Food",
    });
  });

  it("omits an empty parent name for a top-level tag", () => {
    expect(rowToTagRequest(["Food", "dining", "#f87171", ""])).toEqual({
      name: "Food",
      icon: "dining",
      colorHex: "#f87171",
    });
  });
});

describe("rowToSubscriptionRequest", () => {
  it("maps booleans and omits empty optionals", () => {
    const row = [
      "Netflix",
      "Entertainment",
      "12.99",
      "EXPENSE",
      "ACTIVE",
      "2026-01-01",
      "MONTHLY",
      "1",
      "1",
      "false",
      "FOREVER",
      "",
      "",
      "",
      "",
      "",
      "false",
      "Streaming plan",
    ];
    expect(rowToSubscriptionRequest(row)).toEqual({
      name: "Netflix",
      tag: "Entertainment",
      amount: 12.99,
      type: "EXPENSE",
      status: "ACTIVE",
      startDate: "2026-01-01",
      frequencyType: "MONTHLY",
      frequencyInterval: 1,
      monthlySpecificDay: 1,
      lastWorkingDayOfMonth: false,
      duration: "FOREVER",
      autoExchangeRate: false,
      notes: "Streaming plan",
    });
  });

  it("maps a multi-currency UNTIL subscription with true booleans", () => {
    const row = [
      "Gym",
      "Health",
      "30",
      "EXPENSE",
      "PAUSED",
      "2026-02-01",
      "MONTHLY",
      "1",
      "5",
      "false",
      "UNTIL",
      "",
      "2026-12-31",
      "35",
      "USD",
      "0.92",
      "true",
      "",
    ];
    expect(rowToSubscriptionRequest(row)).toEqual({
      name: "Gym",
      tag: "Health",
      amount: 30,
      type: "EXPENSE",
      status: "PAUSED",
      startDate: "2026-02-01",
      frequencyType: "MONTHLY",
      frequencyInterval: 1,
      monthlySpecificDay: 5,
      lastWorkingDayOfMonth: false,
      duration: "UNTIL",
      durationUntil: "2026-12-31",
      originalAmount: 35,
      originalCurrency: "USD",
      exchangeValue: 0.92,
      autoExchangeRate: true,
    });
  });
});

describe("parse<Resource>Csv end-to-end", () => {
  it("skips the header row for transactions", () => {
    const csv = [
      TRANSACTION_COLUMNS.map((c) => c.key).join(","),
      "2026-06-01,Salary,Income,2500,INCOME,,,,",
    ].join("\n");
    expect(parseTransactionsCsv(csv)).toEqual([
      {
        transactionDate: "2026-06-01",
        name: "Salary",
        tag: "Income",
        amount: 2500,
        type: "INCOME",
      },
    ]);
  });

  it("skips the header row for tags", () => {
    const csv = [
      TAG_COLUMNS.map((c) => c.key).join(","),
      "Food,dining,#f87171,",
    ].join("\n");
    expect(parseTagsCsv(csv)).toEqual([
      { name: "Food", icon: "dining", colorHex: "#f87171" },
    ]);
  });

  it("skips the header row for subscriptions", () => {
    const csv = [
      SUBSCRIPTION_COLUMNS.map((c) => c.key).join(","),
      "Netflix,Entertainment,12.99,EXPENSE,ACTIVE,2026-01-01,MONTHLY,1,1,false,FOREVER,,,,,,false,",
    ].join("\n");
    expect(parseSubscriptionsCsv(csv)).toEqual([
      {
        name: "Netflix",
        tag: "Entertainment",
        amount: 12.99,
        type: "EXPENSE",
        status: "ACTIVE",
        startDate: "2026-01-01",
        frequencyType: "MONTHLY",
        frequencyInterval: 1,
        monthlySpecificDay: 1,
        lastWorkingDayOfMonth: false,
        duration: "FOREVER",
        autoExchangeRate: false,
      },
    ]);
  });
});
