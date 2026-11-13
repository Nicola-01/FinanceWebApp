import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { faWallet, faTag } from "@fortawesome/free-solid-svg-icons";
import { WizardStepper } from "../../../components/ui/WizardStepper";
import type { WizardStep } from "../../../components/ui/Wizard";
import { setUiVersion } from "../../../utils/uiVersion";

const steps: WizardStep[] = [
  {
    name: "Basics",
    icon: faWallet,
    mandatory: true,
    content: null,
    nextLabel: "Continue",
    isComplete: true,
  },
  {
    name: "Tags",
    icon: faTag,
    mandatory: false,
    content: null,
    nextLabel: "Continue",
    isComplete: false,
  },
  {
    name: "Invite",
    icon: faWallet,
    mandatory: false,
    content: null,
    nextLabel: "Finish",
    isComplete: false,
  },
];

const renderStepper = (onStepClick = vi.fn(), accentColor?: string) => {
  render(
    <WizardStepper
      steps={steps}
      current={1}
      furthest={1}
      inSteps
      accentColor={accentColor}
      onStepClick={onStepClick}
    />,
  );
  return onStepClick;
};

afterEach(() => setUiVersion("v1"));

describe("WizardStepper", () => {
  it("keeps the v1 gradient on the active node", () => {
    renderStepper();
    expect(screen.getByTestId("wizard-step-1")).toHaveClass(
      "bg-gradient-to-br",
    );
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));

    it("rings the current node in the wallet colour and leaves upcoming raised", () => {
      renderStepper();
      expect(screen.getByTestId("wizard-step-1")).toHaveClass(
        "bg-wallet",
        "text-on-wallet",
        "ring-2",
        "ring-wallet/40",
        "ring-offset-2",
        "ring-offset-app-card",
      );
      expect(screen.getByTestId("wizard-step-1")).toHaveAttribute(
        "aria-current",
        "step",
      );
      expect(screen.getByTestId("wizard-step-2")).toHaveClass("bg-app-raised");
      expect(screen.getByTestId("wizard-step-2")).not.toHaveClass(
        "bg-gradient-to-br",
      );
    });

    it("tints done nodes and swaps their glyph for a check", () => {
      renderStepper();
      const done = screen.getByTestId("wizard-step-0");
      expect(done).toHaveClass(
        "bg-[color-mix(in_srgb,var(--wallet)_25%,transparent)]",
        "text-app-text",
      );
      expect(done).not.toHaveClass("ring-2");
      expect(done.querySelector("svg")).toHaveAttribute("data-icon", "check");
      expect(
        screen.getByTestId("wizard-step-1").querySelector("svg"),
      ).toHaveAttribute("data-icon", "tag");
    });

    it("exposes the accent as --wallet on the stepper and still navigates", () => {
      const onStepClick = renderStepper(vi.fn(), "#ff0000");
      const list = screen.getByRole("list", { name: "Progress" });
      expect(list.style.getPropertyValue("--wallet")).toBe("#ff0000");
      fireEvent.click(screen.getByTestId("wizard-step-0"));
      expect(onStepClick).toHaveBeenCalledWith(0);
    });
  });
});
