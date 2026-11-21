import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { fitSize, useSharedFitFont } from "../../hooks/useSharedFitFont";

describe("fitSize", () => {
  it("keeps the max when every value fits", () => {
    expect(fitSize(26, 14, [1, 1.4])).toBe(26);
    expect(fitSize(26, 14, [])).toBe(26);
  });

  it("scales to the narrowest value, rounded down", () => {
    expect(fitSize(26, 10, [0.5, 0.9])).toBe(13);
  });

  it("never goes below min", () => {
    expect(fitSize(26, 14, [0.5])).toBe(14);
  });
});

describe("useSharedFitFont", () => {
  it("defaults to a 22px max, kept where nothing is laid out", () => {
    const Group = () => {
      const ref = useRef<HTMLDivElement>(null);
      useSharedFitFont(ref, undefined, []);
      return (
        <div ref={ref} data-testid="group">
          <span data-stat-value>€1</span>
        </div>
      );
    };
    const { getByTestId } = render(<Group />);
    expect(
      getByTestId("group").style.getPropertyValue("--stat-value-size"),
    ).toBe("22px");
  });
});
