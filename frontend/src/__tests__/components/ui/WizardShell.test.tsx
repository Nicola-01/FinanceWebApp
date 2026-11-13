import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WizardShell } from "../../../components/ui/WizardShell";
import { setUiVersion } from "../../../utils/uiVersion";

let root: HTMLDivElement;

beforeEach(() => {
  root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
});

afterEach(() => {
  root.remove();
  setUiVersion("v1");
});

describe("WizardShell", () => {
  it("renders nothing while closed", () => {
    render(
      <WizardShell open={false} title="New wallet" onClose={vi.fn()}>
        <p>Body</p>
      </WizardShell>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("keeps the v1 bold title and round close button by default", () => {
    render(
      <WizardShell open title="New wallet" onClose={vi.fn()}>
        <p>Body</p>
      </WizardShell>,
    );
    expect(screen.getByRole("heading", { name: "New wallet" })).toHaveClass(
      "font-bold",
    );
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "rounded-full",
    );
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));

    it("uses the display title and a rounded-input close button", () => {
      const onClose = vi.fn();
      render(
        <WizardShell open title="New wallet" onClose={onClose}>
          <p>Body</p>
        </WizardShell>,
      );
      expect(screen.getByRole("heading", { name: "New wallet" })).toHaveClass(
        "font-display",
        "font-semibold",
      );
      const close = screen.getByRole("button", { name: "Close" });
      expect(close).toHaveClass("rounded-[var(--r-input)]");
      fireEvent.click(close);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
