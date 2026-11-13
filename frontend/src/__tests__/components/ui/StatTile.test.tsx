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
    const footer = screen.getByTestId("spark").parentElement;
    expect(footer).toHaveClass("mt-3");
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

  it("wraps the icon only when one is given", () => {
    const { container, rerender } = render(<StatTile label="L" value="V" />);
    expect(container.querySelector(".max-sm\\:hidden")).toBeNull();
    rerender(<StatTile label="L" value="V" icon={<svg data-testid="ic" />} />);
    const wrapper = screen.getByTestId("ic").parentElement;
    expect(wrapper).toHaveClass("max-sm:hidden");
    expect(container.firstElementChild).toHaveClass("grid");
  });
});

describe("StatTile with a number value", () => {
  it("formats the number like formatAmount with the currency symbol (v1)", () => {
    render(<StatTile label="Income" value={1234.5} currency="€" signed />);
    expect(screen.getByText("+1234,50 €")).toBeInTheDocument();
  });
});
