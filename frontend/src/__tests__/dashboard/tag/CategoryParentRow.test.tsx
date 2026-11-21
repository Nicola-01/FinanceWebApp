import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { CategoryParentRow } from "../../../dashboard/tag/CategoryParentRow";
import type { Tag } from "../../../types/domain";

const parent = (over: Partial<Tag> = {}): Tag => ({
  name: "Investments",
  icon: "tag",
  colorHex: "#111111",
  parentName: null,
  ...over,
});

const renderRow = (
  props: Partial<React.ComponentProps<typeof CategoryParentRow>> = {},
) =>
  render(
    <DndContext>
      <SortableContext items={["Investments"]}>
        <CategoryParentRow
          parent={parent()}
          childCount={0}
          expanded={false}
          onToggleExpand={vi.fn()}
          onUpdateTag={vi.fn().mockResolvedValue(true)}
          onRequestDelete={vi.fn()}
          {...props}
        />
      </SortableContext>
    </DndContext>,
  );

const openPicker = () =>
  fireEvent.click(screen.getByTitle("Change Icon & Color"));

describe("CategoryParentRow investment flag", () => {
  it("shows the violet arrow when the tag is flagged", () => {
    renderRow({ parent: parent({ investment: true }) });
    expect(screen.getByLabelText("Investment")).toBeInTheDocument();
  });

  it("shows no arrow for an unflagged tag", () => {
    renderRow();
    expect(screen.queryByLabelText("Investment")).not.toBeInTheDocument();
  });

  it("the toggle calls update with { investment: true } when off", () => {
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    renderRow({ onUpdateTag });

    const btn = screen.getByRole("button", { name: "Counts as investment" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);

    expect(onUpdateTag).toHaveBeenCalledWith(
      "Investments",
      expect.objectContaining({ investment: true }),
    );
  });

  it("the toggle calls update with { investment: false } when on", () => {
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    renderRow({ onUpdateTag, parent: parent({ investment: true }) });

    const btn = screen.getByRole("button", { name: "Counts as investment" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btn);

    expect(onUpdateTag).toHaveBeenCalledWith(
      "Investments",
      expect.objectContaining({ investment: false }),
    );
  });

  it("renders no toggle and no picker switch in read-only mode", () => {
    renderRow({ readOnly: true });

    expect(
      screen.queryByRole("button", { name: "Counts as investment" }),
    ).not.toBeInTheDocument();
    openPicker();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
