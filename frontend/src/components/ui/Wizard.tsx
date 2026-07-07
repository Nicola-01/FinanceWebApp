import { Fragment, useCallback, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

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

const NODE_BASE =
  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold " +
  "transition-colors disabled:cursor-not-allowed";

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
      {/* Stepper — equidistant circles with short end caps:
          [lead·½] (o)─[conn·1]─(o)─[conn·1]─(o) [trail·½]. The line fills with the
          accent up to the current node; past steps show a coloured ring, the
          current is fully filled, future are neutral. On completion every node
          reads as done. Labels are absolutely positioned so they don't skew the
          rail's spacing. */}
      <div
        role="list"
        aria-label="Progress"
        className="mb-11 flex shrink-0 items-center pb-3 pt-8"
      >
        {steps.map((s, i) => {
          // On the completion phase every node is "done".
          const state = !inSteps
            ? "done"
            : i < current
              ? "done"
              : i === current
                ? "active"
                : "future";
          const navigable = inSteps && i <= furthest;
          // "Opened-ahead" steps: reachable (no not-allowed cursor) yet sitting
          // after the current one. Drawn dashed — both the ring and the inbound
          // rail — so they read as "already visited, jump forward anytime",
          // distinct from the solid "done" steps behind the current node.
          const reopenable = state === "future" && navigable;
          // The segment before this node (lead for i===0, connector otherwise)
          // is filled once its node is reached.
          const beforeFilled = !inSteps || i <= current;
          const nodeStyle =
            state === "active" && accentColor
              ? { backgroundColor: accentColor }
              : (state === "done" || reopenable) && accentColor
                ? { borderColor: accentColor, color: accentColor }
                : undefined;
          const nodeStateClass = reopenable
            ? accentColor
              ? "border-2 border-dashed bg-app-card"
              : "border-2 border-dashed border-app-border bg-app-input text-app-muted"
            : state === "future"
              ? "border border-app-border bg-app-input text-app-muted"
              : state === "active"
                ? accentColor
                  ? "border-2 border-transparent text-white"
                  : "border-2 border-transparent bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] text-white"
                : accentColor
                  ? "border-2 bg-app-card"
                  : "border-2 border-[var(--brand-1)] bg-app-card text-[var(--brand-1)]";
          return (
            <Fragment key={s.name}>
              <span
                aria-hidden="true"
                style={
                  reopenable && accentColor
                    ? { borderColor: accentColor }
                    : beforeFilled && accentColor
                      ? { backgroundColor: accentColor }
                      : undefined
                }
                className={`${i === 0 ? "flex-[0.5]" : "flex-1"} ${
                  reopenable
                    ? `h-0 self-center border-t-2 border-dashed ${
                        accentColor ? "" : "border-app-border"
                      }`
                    : `h-0.5 ${
                        beforeFilled
                          ? accentColor
                            ? ""
                            : "bg-[var(--brand-1)]"
                          : "bg-app-border"
                      }`
                }`}
              />
              <div role="listitem" className="relative flex-none">
                <button
                  type="button"
                  data-testid={`wizard-step-${i}`}
                  disabled={!navigable}
                  onClick={() => goToStep(i)}
                  aria-label={`Step ${i + 1}: ${s.name}`}
                  aria-current={state === "active" ? "step" : undefined}
                  style={nodeStyle}
                  className={`${NODE_BASE} ${nodeStateClass} ${navigable ? "cursor-pointer" : ""}`}
                >
                  <FontAwesomeIcon icon={s.icon} />
                </button>
                <span
                  className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs font-medium ${
                    state === "active" ? "text-app-text" : "text-app-muted"
                  }`}
                >
                  {s.name}
                </span>
              </div>
              {/* short trail after the last node — filled only on completion */}
              {i === steps.length - 1 && (
                <span
                  aria-hidden="true"
                  style={
                    !inSteps && accentColor
                      ? { backgroundColor: accentColor }
                      : undefined
                  }
                  className={`h-0.5 flex-[0.5] ${
                    !inSteps
                      ? accentColor
                        ? ""
                        : "bg-[var(--brand-1)]"
                      : "bg-app-border"
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

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
