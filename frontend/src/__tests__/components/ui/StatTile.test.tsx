import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatTile } from "../../../components/ui/StatTile";

describe("StatTile", () => {
  it("renders label, value and sub", () => {
    render(<StatTile label="Balance" value="€1,200" sub="This month" />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("€1,200")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
  });

  it("renders the footer under sub", () => {
    render(
      <StatTile
        label="L"
        value="V"
        sub="About"
        footer={<svg data-testid="spark" />}
      />,
    );
    const footer = screen.getByTestId("spark");
    expect(screen.getByText("About").compareDocumentPosition(footer!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("applies the income colour only for tone income", () => {
    const { rerender } = render(<StatTile label="In" value="10" />);
    expect(screen.getByText("10")).not.toHaveClass("text-app-income");
    rerender(<StatTile label="In" value="10" tone="income" />);
    expect(screen.getByText("10")).toHaveClass("text-app-income");
  });

  it("puts the icon beside the label on every screen, rendered once", () => {
    const { container, rerender } = render(<StatTile label="L" value="V" />);
    expect(container.querySelector(".max-sm\\:hidden")).toBeNull();
    rerender(<StatTile label="L" value="V" icon={<svg data-testid="ic" />} />);
    const iconBox = screen.getByTestId("ic").parentElement;
    expect(screen.getAllByTestId("ic")).toHaveLength(1);
    expect(iconBox).toHaveClass("shrink-0", "[&>*]:h-8", "max-sm:[&>*]:h-7");
    expect(iconBox).not.toHaveClass("max-sm:hidden");
    expect(iconBox!.parentElement).toHaveClass("flex", "items-center");
    expect(screen.getByText("L")).toHaveClass("truncate", "min-w-0");
  });

  it("keeps the label text in the DOM once", () => {
    render(<StatTile label="Income" value="V" icon={<svg />} />);
    expect(screen.getAllByText("Income")).toHaveLength(1);
  });
});

describe("StatTile overflow", () => {
  it("sizes the value from the shared var (22px default) and never wraps it", () => {
    render(<StatTile label="Spent" value="9228,94 €" />);
    const value = screen.getByText("9228,94 €");
    expect(value).toHaveAttribute("data-stat-value");
    expect(value).toHaveClass(
      "text-[length:var(--stat-value-size,22px)]",
      "max-sm:text-[length:min(var(--stat-value-size,20px),20px)]",
      "whitespace-nowrap",
    );
  });

  it("lets the tile shrink and clips it", () => {
    const { container } = render(<StatTile label="Spent" value="V" />);
    expect(container.firstElementChild).toHaveClass(
      "min-w-0",
      "overflow-hidden",
    );
    expect(container.firstElementChild).not.toHaveClass("@container");
  });
});

describe("StatTile with a number value", () => {
  it("formats the number like formatAmount with the currency symbol (v1)", () => {
    render(<StatTile label="Income" value={1234.5} currency="€" signed />);
    expect(screen.getByText("+1234,50 €")).toBeInTheDocument();
  });
});
