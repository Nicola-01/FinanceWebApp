import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { CategoryChildRow } from "../../../dashboard/tag/CategoryChildRow";
import type { Tag } from "../../../types/domain";

const child = (over: Partial<Tag> = {}): Tag => ({
  name: "PAC",
  icon: "tag",
  colorHex: "#111111",
  parentName: "Investments",
  ...over,
});

const renderRow = (
  props: Partial<React.ComponentProps<typeof CategoryChildRow>> = {},
) =>
  render(
    <DndContext>
      <SortableContext items={["PAC"]}>
        <CategoryChildRow
          onUpdateTag={vi.fn().mockResolvedValue(true)}
          onRequestDelete={vi.fn()}
          {...props}
          child={props.child ?? child()}
        />
      </SortableContext>
    </DndContext>,
  );

const openPicker = () =>
  fireEvent.click(screen.getByTitle("Change Icon & Color"));

describe("CategoryChildRow investment flag", () => {
  it("shows the violet arrow for a flagged child", () => {
    renderRow({ child: child({ investment: true, parentName: null }) });
    expect(screen.getByLabelText("Investment")).toBeInTheDocument();
  });

  it("shows the arrow for an inherited child", () => {
    renderRow({ coverage: { inheritedFrom: "Investments", partial: false } });
    expect(screen.getByLabelText("Investment")).toBeInTheDocument();
  });

  it("shows no arrow for an ordinary child", () => {
    renderRow();
    expect(screen.queryByLabelText("Investment")).not.toBeInTheDocument();
  });

  it("the toggle calls update with { investment: true } when off", () => {
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    renderRow({ onUpdateTag });

    fireEvent.click(
      screen.getByRole("button", { name: "Counts as investment" }),
    );

    expect(onUpdateTag).toHaveBeenCalledWith(
      "PAC",
      expect.objectContaining({ investment: true }),
    );
  });

  it("an inherited child shows a locked, pressed toggle that ignores clicks", () => {
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    renderRow({
      coverage: { inheritedFrom: "Investments", partial: false },
      onUpdateTag,
    });

    const btn = screen.getByRole("button", { name: "Counts as investment" });
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(btn);
    expect(onUpdateTag).not.toHaveBeenCalled();
  });

  it("explains an inherited flag in the tooltip", async () => {
    renderRow({ coverage: { inheritedFrom: "Investments", partial: false } });

    fireEvent.mouseOver(
      screen.getByRole("button", { name: "Counts as investment" })
        .parentElement!,
    );
    expect(
      await screen.findByText("Inherited from Investments"),
    ).toBeInTheDocument();
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
