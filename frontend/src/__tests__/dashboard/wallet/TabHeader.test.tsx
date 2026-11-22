import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabHeader } from "../../../dashboard/wallet/TabHeader";

describe("TabHeader", () => {
  it("renders the title as a v2 heading", () => {
    render(<TabHeader title="Budgets" />);
    const heading = screen.getByRole("heading", { name: "Budgets" });
    expect(heading).toHaveClass(
      "font-display",
      "text-[22px]",
      "font-semibold",
      "tracking-[-0.02em]",
      "text-app-text",
    );
  });

  it("renders no actions slot when none is given", () => {
    const { container } = render(<TabHeader title="Budgets" />);
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it("renders the actions next to the title, in the same row", () => {
    render(
      <TabHeader title="Statistics" actions={<button>Pick year</button>} />,
    );
    const heading = screen.getByRole("heading", { name: "Statistics" });
    const action = screen.getByRole("button", { name: "Pick year" });
    expect(heading.parentElement).toContainElement(action);
    expect(heading.parentElement).toHaveClass(
      "mb-6",
      "min-h-10",
      "flex-wrap",
      "justify-between",
    );
  });
});
