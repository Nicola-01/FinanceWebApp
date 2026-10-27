import { describe, it, expect } from "vitest";
import { parseCsv } from "../../utils/parseCsv";

describe("parseCsv", () => {
  it("parses a simple header + rows", () => {
    expect(parseCsv("A,B,C\n1,2,3\n4,5,6")).toEqual([
      ["A", "B", "C"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    expect(parseCsv('Name,Notes\n"Doe, John","a, b, c"')).toEqual([
      ["Name", "Notes"],
      ["Doe, John", "a, b, c"],
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('X\n"say ""hi"" now"')).toEqual([["X"], ['say "hi" now']]);
  });

  it("keeps newlines inside quoted fields", () => {
    expect(parseCsv('X\n"line1\nline2"')).toEqual([["X"], ["line1\nline2"]]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("A,B\r\n1,2\r\n3,4")).toEqual([
      ["A", "B"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles a lone CR as a line break", () => {
    expect(parseCsv("A,B\r1,2")).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });

  it("strips a leading UTF-8 BOM", () => {
    expect(parseCsv("﻿A,B\n1,2")).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });

  it("skips blank lines (including a trailing newline)", () => {
    expect(parseCsv("A,B\n\n1,2\n\n")).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });

  it("preserves an empty quoted field", () => {
    expect(parseCsv('A,B,C\n"","x",""')).toEqual([
      ["A", "B", "C"],
      ["", "x", ""],
    ]);
  });

  it("returns an empty matrix for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
