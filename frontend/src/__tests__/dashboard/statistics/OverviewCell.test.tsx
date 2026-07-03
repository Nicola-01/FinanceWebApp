import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewCell } from "../../../dashboard/statistics/OverviewCell.tsx";

// Mirror the component's own formatting so assertions stay correct regardless
// of the runner's ICU locale data (component and test share the exact call).
const fmt = (v: number): string =>
  v.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const renderCell = (props: Parameters<typeof OverviewCell>[0]) =>
  render(
    <table>
      <tbody>
        <tr>
          <OverviewCell {...props} />
        </tr>
      </tbody>
    </table>,
  );

describe("OverviewCell", () => {
  it("renders an em dash for a zero value", () => {
    renderCell({ value: 0, type: "income" });
    const span = screen.getByText("—");
    expect(span).toBeInTheDocument();
    expect(span.className).toContain("text-app-muted/30");
  });

  it("renders income with a plus prefix and success colour", () => {
    renderCell({ value: 1234.5, type: "income" });
    const span = screen.getByText(`+${fmt(1234.5)}`);
    expect(span).toBeInTheDocument();
    expect(span.className).toContain("theme-text-success");
  });

  it("renders expense with a minus prefix, absolute value and danger colour", () => {
    renderCell({ value: 80, type: "expense" });
    const span = screen.getByText(`-${fmt(80)}`);
    expect(span).toBeInTheDocument();
    expect(span.className).toContain("theme-text-danger");
  });

  it("renders a positive balance as success with a plus prefix", () => {
    renderCell({ value: 500, type: "balance" });
    const span = screen.getByText(`+${fmt(500)}`);
    expect(span.className).toContain("theme-text-success");
  });

  it("renders a negative balance as danger with an absolute value", () => {
    renderCell({ value: -250, type: "balance" });
    const span = screen.getByText(`-${fmt(250)}`);
    expect(span.className).toContain("theme-text-danger");
  });

  it("applies bold styling when isBold is set", () => {
    renderCell({ value: 10, type: "income", isBold: true });
    const span = screen.getByText(`+${fmt(10)}`);
    expect(span.className).toContain("font-bold");
  });
});
