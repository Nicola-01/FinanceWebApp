import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ImportReviewModal,
  type ImportReviewModalProps,
} from "../../../modals/common/ImportReviewModal";

beforeEach(() => {
  document.body.innerHTML = '<div id="modal-root"></div>';
  // jsdom lacks the <dialog> imperative API; reflect it via the `open` attribute
  // (which ModalDialog observes to lock scroll and which we assert on).
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

const baseProps: ImportReviewModalProps = {
  open: true,
  phase: "confirm",
  resource: "transactions",
  newCount: 2,
  overwrites: [],
  onConfirm: vi.fn(),
  onClose: vi.fn(),
};

const renderModal = (props: Partial<ImportReviewModalProps> = {}) =>
  render(<ImportReviewModal {...baseProps} {...props} />);

describe("ImportReviewModal — confirm phase", () => {
  it("lists every overwrite with its label and detail", () => {
    renderModal({
      newCount: 3,
      overwrites: [
        { label: "Lunch", detail: "Food · 2026-06-01" },
        { label: "Coffee", detail: "Food · 2026-06-02" },
      ],
    });

    expect(screen.getByText("Review import")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Food · 2026-06-01")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();

    // Summary chips: 3 new, 2 overwritten.
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("Overwritten").length).toBeGreaterThan(0);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("fires onConfirm and onClose from the footer buttons", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({
      overwrites: [{ label: "Lunch", detail: "Food · 2026-06-01" }],
      onConfirm,
      onClose,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Overwrite & import/i }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the working label and disables actions while submitting", () => {
    renderModal({
      overwrites: [{ label: "Lunch" }],
      submitting: true,
    });
    expect(screen.getByRole("button", { name: /Importing…/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Cancel$/i })).toBeDisabled();
  });
});

describe("ImportReviewModal — recap phase", () => {
  it("shows created / overwritten counts and lists auto-created tags", () => {
    renderModal({
      phase: "recap",
      resource: "transactions",
      recap: {
        created: 5,
        updated: 2,
        autoCreatedTags: ["Food", "Travel"],
      },
    });

    expect(screen.getByText("Import complete")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    // Auto-created tag chips.
    expect(screen.getByText(/2 tags auto-created/)).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
  });

  it("hides the auto-created tags block for a tags import", () => {
    renderModal({
      phase: "recap",
      resource: "tags",
      recap: { created: 3, updated: 1, autoCreatedTags: [] },
    });
    expect(screen.getByText("Import complete")).toBeInTheDocument();
    expect(screen.queryByText(/auto-created/)).not.toBeInTheDocument();
  });

  it("fires onClose from the Done button", () => {
    const onClose = vi.fn();
    renderModal({
      phase: "recap",
      recap: { created: 1, updated: 0, autoCreatedTags: [] },
      onClose,
    });
    fireEvent.click(screen.getByRole("button", { name: /^Done$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ImportReviewModal — open control", () => {
  it("opens the dialog when `open` is true", () => {
    renderModal();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });
});
