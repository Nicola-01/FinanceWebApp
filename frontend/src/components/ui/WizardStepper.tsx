import { Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { WizardStep } from "./Wizard";
import { useUiVersion } from "../../hooks/useUiVersion";
import { walletVars } from "../../utils/color";

const NODE_BASE =
  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold " +
  "transition-colors disabled:cursor-not-allowed";

interface WizardStepperProps {
  steps: WizardStep[];
  current: number;
  furthest: number;
  /** False on the completion phase, where every node reads as done. */
  inSteps: boolean;
  accentColor?: string;
  onStepClick: (index: number) => void;
}

/**
 * Stepper — equidistant circles with short end caps:
 * [lead·½] (o)─[conn·1]─(o)─[conn·1]─(o) [trail·½]. The line fills with the
 * accent up to the current node; past steps show a coloured ring, the
 * current is fully filled, future are neutral. On completion every node
 * reads as done. Labels are absolutely positioned so they don't skew the
 * rail's spacing.
 */
export function WizardStepper({
  steps,
  current,
  furthest,
  inSteps,
  accentColor,
  onStepClick,
}: WizardStepperProps) {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  return (
    <div
      role="list"
      aria-label="Progress"
      // ui-v2-switch: the accent is exposed as --wallet so nodes/rails use bg-wallet.
      style={isV2 && accentColor ? walletVars(accentColor) : undefined}
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
        const nodeStyle = isV2
          ? undefined
          : state === "active" && accentColor
            ? { backgroundColor: accentColor }
            : (state === "done" || reopenable) && accentColor
              ? { borderColor: accentColor, color: accentColor }
              : undefined;
        const nodeStateClass = isV2
          ? reopenable
            ? "border-2 border-dashed border-app-border bg-app-card text-app-muted"
            : state === "future"
              ? "bg-app-raised text-app-muted"
              : state === "active"
                ? "bg-wallet text-on-wallet ring-2 ring-wallet/40 ring-offset-2 ring-offset-app-card"
                : "bg-[color-mix(in_srgb,var(--wallet)_25%,transparent)] text-app-text"
          : reopenable
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
                isV2
                  ? undefined
                  : reopenable && accentColor
                    ? { borderColor: accentColor }
                    : beforeFilled && accentColor
                      ? { backgroundColor: accentColor }
                      : undefined
              }
              className={`${i === 0 ? "flex-[0.5]" : "flex-1"} ${
                reopenable
                  ? `h-0 self-center border-t-2 border-dashed ${
                      accentColor && !isV2 ? "" : "border-app-border"
                    }`
                  : `h-0.5 ${
                      beforeFilled
                        ? isV2
                          ? "bg-wallet"
                          : accentColor
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
                onClick={() => onStepClick(i)}
                aria-label={`Step ${i + 1}: ${s.name}`}
                aria-current={state === "active" ? "step" : undefined}
                style={nodeStyle}
                className={`${NODE_BASE} ${nodeStateClass} ${navigable ? "cursor-pointer" : ""}`}
              >
                <FontAwesomeIcon
                  icon={isV2 && state === "done" ? faCheck : s.icon}
                />
              </button>
              <span
                className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-medium ${
                  isV2 ? "text-[13px]" : "text-xs"
                } ${state === "active" ? "text-app-text" : "text-app-muted"}`}
              >
                {s.name}
              </span>
            </div>
            {/* short trail after the last node — filled only on completion */}
            {i === steps.length - 1 && (
              <span
                aria-hidden="true"
                style={
                  !inSteps && accentColor && !isV2
                    ? { backgroundColor: accentColor }
                    : undefined
                }
                className={`h-0.5 flex-[0.5] ${
                  !inSteps
                    ? isV2
                      ? "bg-wallet"
                      : accentColor
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
  );
}
