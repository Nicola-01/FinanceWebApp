import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagTreePicker } from "../../../components/tags/TagTreePicker";
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
