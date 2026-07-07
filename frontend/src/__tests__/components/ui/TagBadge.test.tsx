import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Tag } from "../../../utils/types";
import { TagBadge } from "../../../components/ui/TagBadge";

// TagBadge resolves a parent tag from a tag list. Outside a WalletProvider it
// reads none from context, so these tests pass the list via the `tags` prop.

const groceries: Tag = {
  name: "Groceries",
  icon: "cart",
  colorHex: "#22c55e",
  parentName: null,
};

describe("TagBadge", () => {
  it("renders nothing when no tag is provided", () => {
    const { container } = render(<TagBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the tag label", () => {
    render(<TagBadge tag={groceries} />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("applies the tag colour to the badge", () => {
    render(<TagBadge tag={groceries} />);
    const badge = screen.getByText("Groceries").parentElement as HTMLElement;
    expect(badge).toHaveStyle({ color: "#22c55e" });
  });

  it("renders the parent tag when parentName resolves and showParent is on", () => {
    const parent: Tag = {
      name: "Food",
      icon: "burger",
      colorHex: "#f97316",
      parentName: null,
    };
    const child: Tag = { ...groceries, parentName: "Food" };
    render(<TagBadge tag={child} tags={[parent, child]} forceShowParent />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });
});
