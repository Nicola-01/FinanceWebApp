import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  DeleteModal,
  type DeleteModalHandle,
} from "../../../modals/common/DeleteModal";
import type { Tag } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

let root: HTMLDivElement;

beforeEach(() => {
  root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
  // jsdom lacks the <dialog> imperative API; reflect it via the `open` attribute.
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

afterEach(() => {
  root.remove();
  setUiVersion("v1");
});

/** Opens the modal at level 0 (single click) for a named tag. */
function openSingleClick(onConfirm: () => void) {
  const ref = createRef<DeleteModalHandle>();
  render(<DeleteModal ref={ref} />);
  act(() => {
    ref.current!.deleteObject(
      { id: "t1", name: "Groceries" } as Tag,
      "tag",
      onConfirm,
      0,
    );
  });
}

describe("DeleteModal", () => {
  it("deletes on a single click at level 0 and closes after confirming", async () => {
    const onConfirm = vi.fn();
    openSingleClick(onConfirm);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });

  it("closes without deleting on Cancel", () => {
    const onConfirm = vi.fn();
    openSingleClick(onConfirm);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));

    it("uses the danger token for the warning icon and the delete button", () => {
      openSingleClick(vi.fn());
      expect(document.querySelector("svg.text-app-danger")).not.toBeNull();
      expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
        "bg-app-danger",
      );
    });

    it("still deletes on confirm and closes on cancel", async () => {
      const onConfirm = vi.fn();
      openSingleClick(onConfirm);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(document.querySelector("dialog")).not.toHaveAttribute("open");
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
