import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagTreePicker } from "../../../components/tags/TagTreePicker";
import { setUiVersion } from "../../../utils/uiVersion";
import type { Tag } from "../../../types/domain";

const tags = [{ name: "Food", icon: "tag", colorHex: "#999" }] as Tag[];

const openPicker = async (triggerAlign?: "left" | "right") => {
  render(
    <TagTreePicker
      tags={tags}
      selectedTagName=""
      onSelectTag={vi.fn()}
      triggerAlign={triggerAlign}
    />,
  );
  fireEvent.click(screen.getByText("Select a category..."));
  return (await screen.findByText("Food")).closest(".flex-col")!;
};

describe("TagTreePicker dropdown", () => {
  it("is a portalled panel sized to the trigger, at least 20rem", async () => {
    const panel = await openPicker();
    expect(panel).toHaveClass(
      "w-[var(--anchor-width)]",
      "min-w-[min(20rem,calc(100vw-2rem))]",
    );
    expect(panel).not.toHaveClass("absolute");
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

  it("marks the selected row with the raised fill and a check, not a tint", async () => {
    render(
      <TagTreePicker
        tags={nested}
        selectedTagName="Groceries"
        onSelectTag={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Groceries"));
    fireEvent.change(await screen.findByPlaceholderText("Tap to search..."), {
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

  it("still selects a row on click", async () => {
    const onSelectTag = vi.fn();
    render(
      <TagTreePicker
        tags={nested}
        selectedTagName=""
        onSelectTag={onSelectTag}
      />,
    );
    fireEvent.click(screen.getByText("Select a category..."));
    fireEvent.change(await screen.findByPlaceholderText("Tap to search..."), {
      target: { value: "Groc" },
    });
    fireEvent.click(screen.getByText("Groceries"));
    expect(onSelectTag).toHaveBeenCalledWith("Groceries");
  });
});

describe("TagTreePicker trigger", () => {
  it("merges triggerClassName onto the trigger", () => {
    render(
      <TagTreePicker
        tags={tags}
        selectedTagName=""
        onSelectTag={vi.fn()}
        triggerClassName="bg-transparent shadow-none"
      />,
    );
    const trigger = screen
      .getByText("Select a category...")
      .closest(".justify-between");
    expect(trigger).toHaveClass("bg-transparent", "shadow-none");
  });
});
