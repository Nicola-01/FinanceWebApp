import { describe, it, expect } from "vitest";
import { SAMPLES } from "../../../dashboard/settings/csvSamples";

describe("SAMPLES", () => {
  it.each(Object.entries(SAMPLES))(
    "%s sample rows have one cell per column",
    (_mode, spec) => {
      expect(spec.rows.length).toBeGreaterThan(0);
      for (const row of spec.rows)
        expect(row).toHaveLength(spec.columns.length);
      expect(spec.filename).toMatch(/_sample\.csv$/);
    },
  );
});
