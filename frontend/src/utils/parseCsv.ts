// Generic RFC-4180 CSV parser (no domain knowledge).

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
