import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalDialog } from "../../../modals/common/ModalDialog";
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

describe("ModalDialog", () => {
  it("keeps the v1 glass panel and backdrop blur by default", () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <ModalDialog ref={ref} title="Edit">
        <p>Body</p>
      </ModalDialog>,
    );
    ref.current!.showModal();
    const dialog = document.querySelector("dialog")!;
    expect(dialog).toHaveClass("border", "bg-app-surface/85");
    expect(dialog.className).toContain("backdrop-blur-[20px]");
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));

    it("renders a flat card panel with the box ring and a plain backdrop", () => {
      const ref = createRef<HTMLDialogElement>();
      render(
        <ModalDialog ref={ref} title="Edit">
          <p>Body</p>
        </ModalDialog>,
      );
      ref.current!.showModal();
      const dialog = document.querySelector("dialog")!;
      expect(dialog).toHaveClass("bg-app-card", "rounded-[var(--r-card)]");
      expect(dialog.className).toContain("var(--box-ring)");
      expect(dialog.className).toContain("backdrop:bg-black/50");
      expect(dialog.className).not.toContain("backdrop-blur");
      expect(dialog).not.toHaveClass("border");
      expect(screen.getByRole("heading", { name: "Edit" })).toHaveClass(
        "font-display",
        "font-semibold",
      );
    });

    it("keeps the close button working and restyles it as a raised ghost", () => {
      const onCloseClick = vi.fn();
      const ref = createRef<HTMLDialogElement>();
      render(
        <ModalDialog ref={ref} title="Edit" onCloseClick={onCloseClick}>
          <p>Body</p>
        </ModalDialog>,
      );
      ref.current!.showModal();
      const close = screen.getByRole("button", { name: "Close" });
      expect(close).toHaveClass(
        "rounded-[var(--r-input)]",
        "hover:bg-app-raised",
        "h-9",
        "w-9",
      );
      fireEvent.click(close);
      expect(onCloseClick).toHaveBeenCalledTimes(1);
    });
  });
});
