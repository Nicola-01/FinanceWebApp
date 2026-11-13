import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../../components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders the title as a heading", () => {
    render(<EmptyState title="Nothing here" />);
    expect(
      screen.getByRole("heading", { name: "Nothing here" }),
    ).toBeInTheDocument();
  });

  it("renders the description when given", () => {
    const { rerender } = render(<EmptyState title="T" />);
    expect(screen.queryByText("Add your first wallet")).toBeNull();
    rerender(<EmptyState title="T" description="Add your first wallet" />);
    expect(screen.getByText("Add your first wallet")).toBeInTheDocument();
  });

  it("renders the action only when given", () => {
    const { rerender } = render(<EmptyState title="T" />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<EmptyState title="T" action={<button>Create</button>} />);
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders the decorative image with an empty alt", () => {
    const { container } = render(<EmptyState title="T" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/icon.svg");
    expect(img).toHaveAttribute("alt", "");
  });
});
