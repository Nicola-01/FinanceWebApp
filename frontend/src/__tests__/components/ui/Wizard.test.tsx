import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { faWallet, faTag, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import {
  Wizard,
  type WizardStep,
  type WizardCompletionState,
} from "../../../components/ui/Wizard";

interface HarnessProps {
  onComplete?: () => Promise<unknown>;
  renderCompletion?: (s: WizardCompletionState<unknown>) => ReactNode;
}

/**
 * Drives the Wizard with three steps whose `isComplete` is parent-controlled
 * (toggle buttons live inside the step content), mirroring the real usage where
 * the consumer owns all step state.
 */
function Harness({ onComplete, renderCompletion }: HarnessProps) {
  const [complete, setComplete] = useState([false, false, false]);
  const toggle = (i: number) =>
    setComplete((c) => c.map((v, idx) => (idx === i ? !v : v)));

  const steps: WizardStep[] = [
    {
      name: "Basics",
      icon: faWallet,
      mandatory: true,
      isComplete: complete[0],
      nextLabel: "Continue",
      content: (
        <div>
          <p>Step 0 content</p>
          <button onClick={() => toggle(0)}>toggle0</button>
        </div>
      ),
    },
    {
      name: "Tags",
      icon: faTag,
      mandatory: false,
      isComplete: complete[1],
      nextLabel: "Continue",
      nextLabelIncomplete: "Continue without tags",
      content: (
        <div>
          <p>Step 1 content</p>
          <button onClick={() => toggle(1)}>toggle1</button>
        </div>
      ),
    },
    {
      name: "Invite",
      icon: faUserPlus,
      mandatory: false,
      isComplete: complete[2],
      nextLabel: "Finish",
      nextLabelIncomplete: "Continue without inviting others",
      content: <p>Step 2 content</p>,
    },
  ];

  return (
    <Wizard
      steps={steps}
      onComplete={onComplete ?? (() => Promise.resolve("ok"))}
      renderCompletion={
        renderCompletion ?? ((s) => <div>Completion: {s.status}</div>)
      }
    />
  );
}

/** Completes the mandatory first step and advances to step 1. */
const advanceToStep1 = () => {
  fireEvent.click(screen.getByText("toggle0"));
  fireEvent.click(screen.getByTestId("wizard-next"));
};

describe("Wizard", () => {
  it("hides Back on the first step and shows it after advancing", () => {
    render(<Harness />);
    expect(screen.queryByTestId("wizard-back")).not.toBeInTheDocument();
    advanceToStep1();
    expect(screen.getByTestId("wizard-back")).toBeInTheDocument();
  });

  it("keeps a mandatory step's Continue disabled until complete, always showing nextLabel", () => {
    render(<Harness />);
    const next = screen.getByTestId("wizard-next");
    expect(next).toBeDisabled();
    expect(next).toHaveTextContent("Continue");
    fireEvent.click(screen.getByText("toggle0"));
    expect(screen.getByTestId("wizard-next")).toBeEnabled();
    expect(screen.getByTestId("wizard-next")).toHaveTextContent("Continue");
  });

  it("keeps an optional step's Continue enabled and toggles its label", () => {
    render(<Harness />);
    advanceToStep1();
    const next = screen.getByTestId("wizard-next");
    expect(next).toBeEnabled();
    expect(next).toHaveTextContent("Continue without tags");
    fireEvent.click(screen.getByText("toggle1"));
    expect(screen.getByTestId("wizard-next")).toHaveTextContent("Continue");
  });

  it("advances on Continue and returns on Back, keeping content", () => {
    render(<Harness />);
    expect(screen.getByText("Step 0 content")).toBeInTheDocument();
    advanceToStep1();
    expect(screen.getByText("Step 1 content")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("wizard-back"));
    expect(screen.getByText("Step 0 content")).toBeInTheDocument();
  });

  it("disables stepper nodes beyond the furthest reached step", () => {
    render(<Harness />);
    expect(screen.getByTestId("wizard-step-1")).toBeDisabled();
    expect(screen.getByTestId("wizard-step-2")).toBeDisabled();
    advanceToStep1();
    expect(screen.getByTestId("wizard-step-1")).toBeEnabled();
    expect(screen.getByTestId("wizard-step-2")).toBeDisabled();
  });

  it("lets a visited stepper node navigate back", () => {
    render(<Harness />);
    advanceToStep1();
    fireEvent.click(screen.getByTestId("wizard-next")); // -> step 2
    expect(screen.getByText("Step 2 content")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("wizard-step-0"));
    expect(screen.getByText("Step 0 content")).toBeInTheDocument();
  });

  it("runs onComplete after the last step and shows the completion screen", async () => {
    const onComplete = vi.fn(() => Promise.resolve("ok"));
    render(<Harness onComplete={onComplete} />);
    advanceToStep1();
    fireEvent.click(screen.getByTestId("wizard-next")); // -> step 2
    fireEvent.click(screen.getByTestId("wizard-next")); // -> complete
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("wizard-next")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wizard-back")).not.toBeInTheDocument();
    await screen.findByText("Completion: done");
  });

  it("renders the completion error state and lets goToStep return to the steps", async () => {
    const onComplete = vi.fn(() => Promise.reject(new Error("boom")));
    const renderCompletion = (s: WizardCompletionState<unknown>) =>
      s.status === "error" ? (
        <button onClick={() => s.goToStep(0)}>Return to setup</button>
      ) : (
        <div>Completion: {s.status}</div>
      );
    render(
      <Harness onComplete={onComplete} renderCompletion={renderCompletion} />,
    );
    advanceToStep1();
    fireEvent.click(screen.getByTestId("wizard-next")); // -> step 2
    fireEvent.click(screen.getByTestId("wizard-next")); // -> complete (rejects)
    await screen.findByText("Return to setup");
    fireEvent.click(screen.getByText("Return to setup"));
    expect(screen.getByText("Step 0 content")).toBeInTheDocument();
  });
});
