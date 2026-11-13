import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setUiVersion } from "../../../utils/uiVersion";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Tag } from "../../../types/domain";
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

describe("TagBadge v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("renders a borderless sentence-case pill", () => {
    render(<TagBadge tag={groceries} tags={[groceries]} />);
    const chip = screen.getByText("Groceries").parentElement as HTMLElement;
    expect(chip.className).toContain("rounded-full");
    expect(chip.className).not.toContain("uppercase");
    expect(chip.style.border).toBe("");
  });

  it("still forwards clicks to the badge", () => {
    const onClick = vi.fn();
    render(<TagBadge tag={groceries} tags={[groceries]} onClick={onClick} />);
    fireEvent.click(screen.getByText("Groceries"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
