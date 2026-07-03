import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Tag } from "../../../utils/types";
import { TagFilter } from "../../../components/TagFilter/TagFilter";

const tags = [
  { name: "Food", parentName: null },
  { name: "Groceries", parentName: "Food" },
  { name: "Rent", parentName: null },
] as unknown as Tag[];

const open = async (
  selectedTags: string[],
  onChange = vi.fn(),
): Promise<{
  user: ReturnType<typeof userEvent.setup>;
  onChange: typeof onChange;
}> => {
  const user = userEvent.setup();
  render(
    <TagFilter tags={tags} selectedTags={selectedTags} onChange={onChange} />,
  );
  await user.click(screen.getByTitle("Filter by Tags"));
  return { user, onChange };
};

// Every row exposes a leading checkbox labelled "Toggle <name>"; parents also
// expose an "Expand <name>" caret (children are hidden until expanded).
const rowCheckbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Toggle ${name}` });

describe("TagFilter", () => {
  it("opens the dropdown and lists All Tags plus root tags", async () => {
    await open([]);
    expect(screen.getByText("All Tags")).toBeInTheDocument();
    expect(rowCheckbox("Food")).toBeInTheDocument();
    expect(rowCheckbox("Rent")).toBeInTheDocument();
    // Children are hidden until their parent is expanded.
    expect(
      screen.queryByRole("checkbox", { name: "Toggle Groceries" }),
    ).not.toBeInTheDocument();
  });

  it("selects every tag when All is toggled from empty", async () => {
    const { user, onChange } = await open([]);
    await user.click(screen.getByText("All Tags"));
    expect(onChange).toHaveBeenCalledWith(["Food", "Groceries", "Rent"]);
  });

  it("clears the selection when All is toggled while fully checked", async () => {
    const { user, onChange } = await open(["Food", "Groceries", "Rent"]);
    await user.click(screen.getByText("All Tags"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("selects the whole family when a parent is toggled", async () => {
    const { user, onChange } = await open([]);
    await user.click(rowCheckbox("Food"));
    expect(onChange).toHaveBeenCalledWith(["Food", "Groceries"]);
  });

  it("toggles a single child after expanding its parent", async () => {
    const { user, onChange } = await open([]);
    await user.click(screen.getByRole("button", { name: "Expand Food" }));
    await user.click(rowCheckbox("Groceries"));
    expect(onChange).toHaveBeenCalledWith(["Groceries"]);
  });

  it("deselects a parent family when it is already fully checked", async () => {
    const { user, onChange } = await open(["Food", "Groceries"]);
    await user.click(rowCheckbox("Food"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("shows an empty state when there are no tags", async () => {
    const user = userEvent.setup();
    render(<TagFilter tags={[]} selectedTags={[]} onChange={vi.fn()} />);
    await user.click(screen.getByTitle("Filter by Tags"));
    expect(screen.getByText("No tags available.")).toBeInTheDocument();
  });
});
