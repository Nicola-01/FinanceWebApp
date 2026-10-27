import { useCallback, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import { WizardStepper } from "./WizardStepper";

/** One configurable step. All state is owned by the consumer. */
export interface WizardStep {
  /** Shown under the stepper node. */
  name: string;
  /** Icon rendered inside the stepper node. */
  icon: IconDefinition;
  /** When true, Continue stays disabled until `isComplete`. */
  mandatory: boolean;
  content: ReactNode;
  /** Continue label when `isComplete` is true (e.g. "Continue"). */
  nextLabel: string;
  /** Continue label when `isComplete` is false; required by convention for
   *  optional steps (e.g. "Continue without tags"). Never the word "skip". */
  nextLabelIncomplete?: string;
  /** Parent-computed validity: gates a mandatory step and picks the label. */
  isComplete: boolean;
  /** Hard block: disables Continue regardless of `mandatory`/`isComplete`, for
   *  content that is present but invalid (e.g. an item with an unresolved tag).
   *  Distinct from an optional step the user may legitimately skip. */
  blocked?: boolean;
  /** Shown above the footer when `blocked`, telling the user what to fix. */
  blockedReason?: string;
}

export type WizardCompletionStatus = "processing" | "done" | "error";

/** Passed to `renderCompletion` so the terminal screen can report status and
 *  send the user back into the steps (e.g. step 1 on a blocking failure). */
export interface WizardCompletionState<TResult> {
  status: WizardCompletionStatus;
  result?: TResult;
  error?: unknown;
  goToStep: (index: number) => void;
}

export interface WizardProps<TResult = unknown> {
  steps: WizardStep[];
  /** Fired after the last step's Continue; runs the real work. */
  onComplete: () => Promise<TResult>;
  /** The unique terminal screen (owns its own CTAs). */
  renderCompletion: (s: WizardCompletionState<TResult>) => ReactNode;
  onCancel?: () => void;
  /** Optional accent (e.g. the wallet colour); falls back to the brand gradient. */
  accentColor?: string;
}

/** Directional slide+fade for the step/completion swap. `custom` is the nav
 *  direction: +1 moving forward (new panel enters from the right), -1 back. */
const PANEL_VARIANTS = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
};

/**
 * Generic, shell-agnostic multi-step wizard: horizontal stepper + current step
 * content + Back/Continue footer, plus an external completion phase driven by
 * `onComplete`/`renderCompletion`. The consumer supplies the container.
 */
export function Wizard<TResult = unknown>({
  steps,
  onComplete,
  renderCompletion,
  accentColor,
}: WizardProps<TResult>) {
  const [current, setCurrent] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [phase, setPhase] = useState<"steps" | "completion">("steps");
  // +1 when navigating forward, -1 backward — drives the slide direction.
  const [direction, setDirection] = useState(1);
  const [completion, setCompletion] = useState<{
    status: WizardCompletionStatus;
    result?: TResult;
    error?: unknown;
  }>({ status: "processing" });

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index > furthest) return;
      // Leaving the completion phase always reads as going backward.
      setDirection(phase !== "steps" ? -1 : index >= current ? 1 : -1);
      setPhase("steps");
      setCurrent(index);
    },
    [furthest, current, phase],
  );

  const runCompletion = useCallback(async () => {
    setPhase("completion");
    setCompletion({ status: "processing" });
    try {
      const result = await onComplete();
      setCompletion({ status: "done", result });
    } catch (error) {
      setCompletion({ status: "error", error });
    }
  }, [onComplete]);

  const inSteps = phase === "steps";
  const step = steps[current];
  const isLast = current === steps.length - 1;

  const handleNext = () => {
    if (step.blocked) return;
    if (step.mandatory && !step.isComplete) return;
    setDirection(1);
    if (isLast) {
      void runCompletion();
      return;
    }
    const next = current + 1;
    setCurrent(next);
    setFurthest((f) => Math.max(f, next));
  };

  const nextLabel = step.mandatory
    ? step.nextLabel
    : step.isComplete
      ? step.nextLabel
      : (step.nextLabelIncomplete ?? step.nextLabel);
  const nextDisabled = step.blocked || (step.mandatory && !step.isComplete);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <WizardStepper
        steps={steps}
        current={current}
        furthest={furthest}
        inSteps={inSteps}
        accentColor={accentColor}
        onStepClick={goToStep}
      />

      {/* Content — each step/completion panel slides+fades in the nav direction.
          Keyed so React remounts on every swap, replaying the enter animation.
          This is the only scroll region, so the stepper and footer stay pinned. */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4">
        <motion.div
          key={inSteps ? `step-${current}` : "completion"}
          custom={direction}
          variants={PANEL_VARIANTS}
          initial="enter"
          animate="center"
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {inSteps
            ? step.content
            : renderCompletion({ ...completion, goToStep })}
        </motion.div>
      </div>

      {/* Footer — pinned below the scroll region, always visible. */}
      {inSteps && (
        <div className="shrink-0 border-t border-app-border pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {step.blocked && step.blockedReason && (
            <p
              role="alert"
              className="mb-3 flex items-center gap-2 text-xs font-medium text-app-yellow"
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="shrink-0"
              />
              {step.blockedReason}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            {current > 0 ? (
              <Button
                variant="secondary"
                data-testid="wizard-back"
                onClick={() => {
                  setDirection(-1);
                  setCurrent(current - 1);
                }}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button
              data-testid="wizard-next"
              ripple
              accentColor={accentColor}
              disabled={nextDisabled}
              onClick={handleNext}
            >
              {nextLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wizard;
