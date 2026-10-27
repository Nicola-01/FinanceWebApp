import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChartCard } from "../../../dashboard/tag/ChartCard";
import { FlowTypeToggle } from "../../../dashboard/tag/FlowTypeToggle";

const card = (props: { bare?: boolean; isEmpty?: boolean }) => (
  <ChartCard
    title="Title"
    subtitle="Sub"
    bare={props.bare ?? false}
    controls={<span>ctrl</span>}
    isEmpty={props.isEmpty ?? false}
    emptyMinHeightClass="min-h-[300px]"
  >
    <p>chart</p>
  </ChartCard>
);

describe("ChartCard", () => {
  it("renders title, subtitle, controls and children", () => {
    render(card({}));
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Sub")).toBeInTheDocument();
    expect(screen.getByText("ctrl")).toBeInTheDocument();
    expect(screen.getByText("chart")).toBeInTheDocument();
  });

  it("hides the header text when bare", () => {
    render(card({ bare: true }));
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
    expect(screen.getByText("ctrl")).toBeInTheDocument();
  });

  it("shows the empty state instead of children", () => {
    render(card({ isEmpty: true }));
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(screen.queryByText("chart")).not.toBeInTheDocument();
  });
});

describe("FlowTypeToggle", () => {
  it("orders options and reports changes", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FlowTypeToggle value="EXPENSE" onChange={onChange} />,
    );
    const labels = () =>
      screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels()).toEqual(["Income", "Expenses"]);
    fireEvent.click(screen.getByText("Income"));
    expect(onChange).toHaveBeenCalledWith("INCOME");
    rerender(
      <FlowTypeToggle value="EXPENSE" onChange={onChange} expenseFirst />,
    );
    expect(labels()).toEqual(["Expenses", "Income"]);
  });
});
