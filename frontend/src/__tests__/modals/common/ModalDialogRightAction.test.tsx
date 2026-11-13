import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalDialogRightAction } from "../../../modals/common/ModalDialogRightAction";
import { setUiVersion } from "../../../utils/uiVersion";

afterEach(() => setUiVersion("v1"));

describe("ModalDialogRightAction", () => {
  it("renders a single action as a round button that fires onClick", () => {
    const onClick = vi.fn();
    render(
      <ModalDialogRightAction
        actions={[{ icon: <span>i</span>, label: "Edit", onClick }]}
      />,
    );
    const button = screen.getByTitle("Edit");
    expect(button).toHaveClass("rounded-full", "bg-app-input");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("v2", () => {
    it("uses a rounded-input single button with the raised hover fill", () => {
      setUiVersion("v2");
      const onClick = vi.fn();
      render(
        <ModalDialogRightAction
          actions={[{ icon: <span>i</span>, label: "Edit", onClick }]}
        />,
      );
      const button = screen.getByTitle("Edit");
      expect(button).toHaveClass(
        "rounded-[var(--r-input)]",
        "hover:bg-app-raised",
      );
      expect(button).not.toHaveClass("rounded-full");
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("opens the overflow menu as a flat card and runs the picked action", () => {
      setUiVersion("v2");
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const { container } = render(
        <ModalDialogRightAction
          actions={[
            { icon: <span>e</span>, label: "Edit", onClick: onEdit },
            { icon: <span>d</span>, label: "Delete", onClick: onDelete },
          ]}
        />,
      );
      fireEvent.click(container.querySelector("button")!);
      const menuItem = screen.getByText("Delete").closest("button")!;
      const panel = menuItem.parentElement!.parentElement!;
      expect(panel).toHaveClass("bg-app-card", "rounded-[var(--r-card)]");
      expect(panel.className).toContain("var(--box-ring)");
      expect(panel).not.toHaveClass("border");
      fireEvent.click(menuItem);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });
  });
});
