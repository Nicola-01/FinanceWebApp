import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "../../../modals/common/ConfirmModal";
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

const renderModal = () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmModal
      open
      title="Delete backup?"
      message="This cannot be undone."
      confirmLabel="Delete now"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
};

describe("ConfirmModal", () => {
  it("opens the native dialog and confirms on the danger button", () => {
    const { onConfirm, onCancel } = renderModal();
    expect(document.querySelector("dialog")).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Delete now" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));

    it("uses the display title and the danger token for the confirm button", () => {
      renderModal();
      expect(
        screen.getByRole("heading", { name: "Delete backup?" }),
      ).toHaveClass("font-display", "font-semibold");
      expect(screen.getByRole("button", { name: "Delete now" })).toHaveClass(
        "bg-app-danger",
      );
    });

    it("still confirms, and cancels from the footer link and the close button", () => {
      const { onConfirm, onCancel } = renderModal();
      fireEvent.click(screen.getByRole("button", { name: "Delete now" }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(onCancel).toHaveBeenCalledTimes(2);
    });
  });
});
