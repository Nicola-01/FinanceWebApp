import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagCreateMode } from "../../../../../modals/wallet/wizardSteps/tagModes/TagCreateMode";
import type { TagRequest } from "../../../../../dashboard/settings/csvImport";

const nameInput = () =>
  screen.getByLabelText("Category name") as HTMLInputElement;
const addButton = () => screen.getByRole("button", { name: /add category/i });

describe("TagCreateMode", () => {
  it("adds a valid top-level tag with the default icon and colour", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagCreateMode value={[]} onAdd={onAdd} />);

    await user.type(nameInput(), "  Groceries  ");
    await user.click(addButton());

    expect(onAdd).toHaveBeenCalledTimes(1);
    // Trimmed name, default icon/colour, and NO parentName for a top-level tag.
    expect(onAdd).toHaveBeenCalledWith({
      name: "Groceries",
      icon: "tag",
      colorHex: "#8b5cf6",
    });
  });

  it("adds via Enter on the name input", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagCreateMode value={[]} onAdd={onAdd} />);

    await user.type(nameInput(), "Utilities{Enter}");

    expect(onAdd).toHaveBeenCalledWith({
      name: "Utilities",
      icon: "tag",
      colorHex: "#8b5cf6",
    });
  });

  it("sets parentName when a parent category is chosen", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const value: TagRequest[] = [
      { name: "Work", icon: "wallet", colorHex: "#22c55e" },
    ];
    render(<TagCreateMode value={value} onAdd={onAdd} />);

    await user.type(nameInput(), "Salary");
    // Open the parent dropdown (default label) and pick the top-level "Work".
    await user.click(screen.getByRole("button", { name: /top-level/i }));
    await user.click(screen.getByRole("button", { name: /^work$/i }));
    await user.click(addButton());

    expect(onAdd).toHaveBeenCalledWith({
      name: "Salary",
      icon: "tag",
      colorHex: "#8b5cf6",
      parentName: "Work",
    });
  });

  it("only offers top-level tags as parents", async () => {
    const user = userEvent.setup();
    const value: TagRequest[] = [
      { name: "Work", icon: "wallet", colorHex: "#22c55e" },
      {
        name: "Salary",
        icon: "coins",
        colorHex: "#22c55e",
        parentName: "Work",
      },
    ];
    render(<TagCreateMode value={value} onAdd={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /top-level/i }));
    // "Work" is a valid parent; the sub-tag "Salary" must not be offered.
    expect(screen.getByRole("button", { name: /^work$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^salary$/i }),
    ).not.toBeInTheDocument();
  });

  it("disables Add for a case-insensitive duplicate name", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <TagCreateMode
        value={[{ name: "Food", icon: "tag", colorHex: "#8b5cf6" }]}
        onAdd={onAdd}
      />,
    );

    await user.type(nameInput(), "food");
    expect(addButton()).toBeDisabled();
    await user.click(addButton());
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("disables Add until the name is 2–25 characters", async () => {
    const user = userEvent.setup();
    render(<TagCreateMode value={[]} onAdd={vi.fn()} />);

    expect(addButton()).toBeDisabled();
    await user.type(nameInput(), "a");
    expect(addButton()).toBeDisabled();
    await user.type(nameInput(), "b");
    expect(addButton()).toBeEnabled();
  });

  it("clears the name after a successful add (keeping it ready for the next)", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [value, setValue] = useState<TagRequest[]>([]);
      return (
        <TagCreateMode
          value={value}
          onAdd={(t) => setValue((v) => [...v, t])}
        />
      );
    }
    render(<Wrapper />);

    await user.type(nameInput(), "Travel");
    await user.click(addButton());

    expect(nameInput()).toHaveValue("");
    // The added tag now becomes a selectable parent for the next one.
    await user.click(screen.getByRole("button", { name: /top-level/i }));
    expect(
      screen.getByRole("button", { name: /^travel$/i }),
    ).toBeInTheDocument();
  });
});
