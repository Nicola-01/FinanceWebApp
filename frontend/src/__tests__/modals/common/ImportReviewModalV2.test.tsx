import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ImportReviewModal,
  type ImportReviewModalProps,
} from "../../../modals/common/ImportReviewModal";
import { setUiVersion } from "../../../utils/uiVersion";

beforeEach(() => {
  document.body.innerHTML = '<div id="modal-root"></div>';
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

describe("ImportReviewModal (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  describe("confirm phase", () => {
    it("shows new / overwritten counts and the overwrite rows", () => {
      renderModal({
        newCount: 3,
        overwrites: [
          { label: "Lunch", detail: "Food · 2026-06-01" },
          { label: "Coffee", detail: "Food · 2026-06-02" },
        ],
      });

      expect(screen.getByText("Review import")).toBeInTheDocument();
      expect(screen.getByText("New")).toHaveClass("text-[13px]");
      expect(screen.getByText("3")).toHaveClass("text-[22px]", "tabular-nums");
      expect(screen.getByText("Overwritten")).toBeInTheDocument();
      expect(screen.getByText("2")).toHaveClass("text-[22px]");

      expect(screen.getByText("Lunch")).toHaveClass("text-[15px]");
      expect(screen.getByText("Food · 2026-06-01")).toHaveClass(
        "text-[13px]",
        "tabular-nums",
      );
      expect(screen.getByText("Coffee")).toBeInTheDocument();
      expect(screen.getByText("Food · 2026-06-02")).toBeInTheDocument();
    });

    it("uses the warn colour for the title icon", () => {
      const { container } = renderModal({
        overwrites: [{ label: "Lunch" }],
      });
      expect(
        container.ownerDocument.querySelector(".text-app-warn"),
      ).not.toBeNull();
      expect(
        container.ownerDocument.querySelector(".text-app-yellow"),
      ).toBeNull();
    });
  });

  describe("recap phase", () => {
    it("shows created / overwritten counts and auto-created tags", () => {
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
      expect(screen.getByText(/2 tags auto-created/)).toBeInTheDocument();
      expect(screen.getByText("Food")).toHaveClass("bg-app-raised");
      expect(screen.getByText("Travel")).toBeInTheDocument();
    });

    it("uses the income colour for the title icon", () => {
      const { container } = renderModal({
        phase: "recap",
        recap: { created: 1, updated: 0, autoCreatedTags: [] },
      });
      expect(
        container.ownerDocument.querySelector(".text-app-income"),
      ).not.toBeNull();
      expect(
        container.ownerDocument.querySelector(".text-app-green"),
      ).toBeNull();
    });

    it("hides the auto-created tags for a tags import", () => {
      renderModal({
        phase: "recap",
        resource: "tags",
        recap: { created: 3, updated: 1, autoCreatedTags: ["Food"] },
      });
      expect(screen.queryByText(/auto-created/)).not.toBeInTheDocument();
      expect(screen.queryByText("Food")).not.toBeInTheDocument();
    });

    it("hides the auto-created tags block when the list is empty", () => {
      renderModal({
        phase: "recap",
        resource: "transactions",
        recap: { created: 3, updated: 1, autoCreatedTags: [] },
      });
      expect(screen.queryByText(/auto-created/)).not.toBeInTheDocument();
    });
  });
});
