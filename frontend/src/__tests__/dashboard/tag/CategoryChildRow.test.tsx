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
    renderRow({ inheritedFrom: "Investments" });
    expect(screen.getByLabelText("Investment")).toBeInTheDocument();
  });

  it("shows no arrow for an ordinary child", () => {
    renderRow();
    expect(screen.queryByLabelText("Investment")).not.toBeInTheDocument();
  });

  it("toggling the switch calls update with { investment: true }", () => {
    const onUpdateTag = vi.fn().mockResolvedValue(true);
    renderRow({ onUpdateTag });

    openPicker();
    fireEvent.click(
      screen.getByRole("switch", { name: /counts as investment/i }),
    );

    expect(onUpdateTag).toHaveBeenCalledWith(
      "PAC",
      expect.objectContaining({ investment: true }),
    );
  });

  it("an inherited child shows a disabled switch reading Inherited from Investments", () => {
    renderRow({ inheritedFrom: "Investments" });

    openPicker();
    const sw = screen.getByRole("switch", { name: /counts as investment/i });
    expect(sw).toBeDisabled();
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Inherited from Investments")).toBeInTheDocument();
  });

  it("renders no switch in read-only mode", () => {
    renderRow({ readOnly: true });

    openPicker();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
