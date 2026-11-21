import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagTreePicker } from "../../../components/tags/TagTreePicker";
import type { Tag } from "../../../types/domain";

const tags = [
  { name: "Food", icon: "tag", colorHex: "#999", parentName: null },
  { name: "Foo bar", icon: "tag", colorHex: "#999", parentName: "Food" },
  { name: "Travel", icon: "tag", colorHex: "#999", parentName: null },
] as unknown as Tag[];

describe("TagTreePicker search input tap", () => {
  it("keeps the search input open and typeable when tapped (pointerdown + click)", async () => {
    const user = userEvent.setup();
    render(
      <TagTreePicker tags={tags} selectedTagName="" onSelectTag={vi.fn()} />,
    );
    await user.click(screen.getByText("Select a category..."));
    await screen.findByText("Travel"); // lazy popover mounted
    const input = (await screen.findByPlaceholderText(
      "Tap to search...",
    )) as HTMLInputElement;

    await user.click(input);
    expect(screen.getByPlaceholderText("Tap to search...")).toBe(input);
    await user.type(input, "Foo");

    expect(input.value).toBe("Foo");
    expect(await screen.findByText("Foo bar")).toBeInTheDocument();
    expect(screen.queryByText("Travel")).not.toBeInTheDocument();
  });

  it("still closes on a press outside the picker", async () => {
    render(
      <div>
        <button type="button">Elsewhere</button>
        <TagTreePicker tags={tags} selectedTagName="" onSelectTag={vi.fn()} />
      </div>,
    );
    fireEvent.click(screen.getByText("Select a category..."));
    await screen.findByText("Travel");
    fireEvent.pointerDown(screen.getByText("Elsewhere"), { button: 0 });
    fireEvent.click(screen.getByText("Elsewhere"), { detail: 1 });
    expect(screen.queryByPlaceholderText("Tap to search...")).toBeNull();
  });
});
