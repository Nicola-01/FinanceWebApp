import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Tag } from "../../../utils/types";

// TagBadge reads the wallet's tag list (to resolve a parent tag) from context.
const { tagsRef } = vi.hoisted(() => ({
  tagsRef: { current: [] as Tag[] },
}));
vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({ tags: tagsRef.current }),
}));

import { TagBadge } from "../../../components/ui/TagBadge";

const groceries: Tag = {
  name: "Groceries",
  icon: "cart",
  colorHex: "#22c55e",
  parentName: null,
};

describe("TagBadge", () => {
  it("renders nothing when no tag is provided", () => {
    tagsRef.current = [];
    const { container } = render(<TagBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the tag label", () => {
    tagsRef.current = [groceries];
    render(<TagBadge tag={groceries} />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("applies the tag colour to the badge", () => {
    tagsRef.current = [groceries];
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
    tagsRef.current = [parent, child];
    render(<TagBadge tag={child} forceShowParent />);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });
});
