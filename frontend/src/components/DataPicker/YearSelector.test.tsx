import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import YearSelector from "./YearSelector";
import type { YearSelectorProps } from "./YearSelector";

const baseProps = (): YearSelectorProps => ({
  currentDate: new Date(2026, 0, 1),
  onSelectYear: vi.fn(),
  onPrevDecade: vi.fn(),
  onNextDecade: vi.fn(),
  direction: "next",
  color: "rgb(1, 2, 3)",
  isDark: false,
});

describe("YearSelector", () => {
  it("renders the decade header and year cells", () => {
    render(<YearSelector {...baseProps()} />);
    // Header spans years[1]..years[10] of the 12-year window (2019..2030).
    expect(screen.getByText("2020 - 2029")).toBeInTheDocument();
    expect(screen.getByText("2019")).toBeInTheDocument();
    expect(screen.getByText("2030")).toBeInTheDocument();
  });

  it("fires onSelectYear with the picked year", () => {
    const props = baseProps();
    render(<YearSelector {...props} />);

    fireEvent.click(screen.getByText("2025"));

    const arg = (props.onSelectYear as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Date;
    expect(arg.getFullYear()).toBe(2025);
  });

  it("highlights the current year with the accent colour", () => {
    render(<YearSelector {...baseProps()} />);
    expect(screen.getByText("2026")).toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
    });
    expect(screen.getByText("2021")).not.toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
    });
  });

  it("fires the decade navigation callbacks", () => {
    const props = baseProps();
    render(<YearSelector {...props} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // prev-decade chevron
    expect(props.onPrevDecade).toHaveBeenCalledTimes(1);
    fireEvent.click(buttons[1]); // next-decade chevron
    expect(props.onNextDecade).toHaveBeenCalledTimes(1);
  });
});
