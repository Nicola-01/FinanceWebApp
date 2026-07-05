import { useCallback, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

/** One configurable step. All state is owned by the consumer. */
export interface WizardStep {
  /** Shown under the stepper node. */
  name: string;
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

const NODE_BASE =
  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold " +
  "transition-colors disabled:cursor-not-allowed";

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
  const [completion, setCompletion] = useState<{
    status: WizardCompletionStatus;
    result?: TResult;
    error?: unknown;
  }>({ status: "processing" });

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index > furthest) return;
      setPhase("steps");
      setCurrent(index);
    },
    [furthest],
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
    if (step.mandatory && !step.isComplete) return;
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
  const nextDisabled = step.mandatory && !step.isComplete;

  return (
    <div className="flex w-full flex-col">
      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {steps.map((s, i) => {
          const done = i < current && inSteps;
          const active = i === current && inSteps;
          const navigable = inSteps && i <= furthest;
          const filled = done || active;
          const useAccent = filled && !!accentColor;
          return (
            <li
              key={s.name}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  data-testid={`wizard-step-${i}`}
                  disabled={!navigable}
                  onClick={() => goToStep(i)}
                  aria-label={`Step ${i + 1}: ${s.name}`}
                  aria-current={active ? "step" : undefined}
                  style={
                    useAccent ? { backgroundColor: accentColor } : undefined
                  }
                  className={`${NODE_BASE} ${
                    filled
                      ? useAccent
                        ? "text-white"
                        : "bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white"
                      : "bg-app-input text-app-muted border border-app-border"
                  } ${navigable ? "cursor-pointer" : ""}`}
                >
                  {done ? <FontAwesomeIcon icon={faCheck} /> : i + 1}
                </button>
                <span
                  className={`text-xs font-medium ${
                    active ? "text-app-text" : "text-app-muted"
                  }`}
                >
                  {s.name}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span className="mx-2 h-px flex-1 bg-app-border" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Content */}
      <div className="min-h-0 flex-1">
        {inSteps ? step.content : renderCompletion({ ...completion, goToStep })}
      </div>

      {/* Footer */}
      {inSteps && (
        <div className="mt-8 flex items-center justify-between gap-3">
          {current > 0 ? (
            <Button
              variant="secondary"
              data-testid="wizard-back"
              onClick={() => setCurrent(current - 1)}
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
      )}
    </div>
  );
}

export default Wizard;
