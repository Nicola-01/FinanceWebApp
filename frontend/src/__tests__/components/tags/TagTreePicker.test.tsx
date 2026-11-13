import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagTreePicker } from "../../../components/tags/TagTreePicker";
import { setUiVersion } from "../../../utils/uiVersion";
import type { Tag } from "../../../types/domain";

const tags = [{ name: "Food", icon: "tag", colorHex: "#999" }] as Tag[];

const openPicker = (dropdownClassName?: string) => {
  render(
    <TagTreePicker
      tags={tags}
      selectedTagName=""
      onSelectTag={vi.fn()}
      dropdownClassName={dropdownClassName}
    />,
  );
  fireEvent.click(screen.getByText("Select a category..."));
  return screen.getByText("Food").closest(".absolute")!;
};

describe("TagTreePicker dropdown", () => {
  it("grows rightwards from a narrow form column by default", () => {
    const panel = openPicker();
    expect(panel).toHaveClass(
      "left-0",
      "w-full",
      "min-w-[min(20rem,calc(100vw-2rem))]",
    );
    expect(panel).not.toHaveClass("right-0");
  });

  it("takes a custom placement when asked (inline row picker)", () => {
    expect(openPicker("right-0 min-w-80")).toHaveClass("right-0", "min-w-80");
  });
});

describe("TagTreePicker v2 UI", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  const nested = [
    { name: "Food", icon: "tag", colorHex: "#999", parentName: null },
    {
      name: "Groceries",
      icon: "tag",
      colorHex: "#999",
      parentName: "Food",
    },
  ] as unknown as Tag[];

  it("marks the selected row with the raised fill and a check, not a tint", () => {
    render(
      <TagTreePicker
        tags={nested}
        selectedTagName="Groceries"
        onSelectTag={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Groceries"));
    fireEvent.change(screen.getByPlaceholderText("Tap to search..."), {
      target: { value: "Groc" },
    });
    const row = screen
      .getByText("Groceries")
      .closest("div.group") as HTMLElement;
    expect(row).toHaveClass("bg-app-raised");
    expect(row.getAttribute("style")).toBeNull();
    const svgs = row.querySelectorAll("svg");
    expect(svgs[svgs.length - 1]).toHaveClass("text-app-text"); // trailing check
  });

  it("still selects a row on click", () => {
    const onSelectTag = vi.fn();
    render(
      <TagTreePicker
        tags={nested}
        selectedTagName=""
        onSelectTag={onSelectTag}
      />,
    );
    fireEvent.click(screen.getByText("Select a category..."));
    fireEvent.change(screen.getByPlaceholderText("Tap to search..."), {
      target: { value: "Groc" },
    });
    fireEvent.click(screen.getByText("Groceries"));
    expect(onSelectTag).toHaveBeenCalledWith("Groceries");
  });
});
