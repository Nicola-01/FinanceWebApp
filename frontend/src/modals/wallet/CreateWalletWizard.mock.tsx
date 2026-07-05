import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faTriangleExclamation,
  faWallet,
  faTag,
  faArrowsRotate,
  faReceipt,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  Wizard,
  type WizardStep,
  type WizardCompletionState,
} from "../../components/ui/Wizard";
import { WizardShell } from "../../components/ui/WizardShell";
import Button from "../../components/ui/Button";

/**
 * TEMPORARY visual mock (reachable at /wizard-mock) to validate the wizard's
 * look before wiring the real wallet flow. Removed in the integration phase.
 * No API calls, no business logic — placeholder content only.
 */

const ACCENTS = ["#8b5cf6", "#22c55e", "#3b82f6", "#f59e0b", "#ec4899"];

const Placeholder = ({
  label,
  complete,
  onToggle,
  extra,
}: {
  label: string;
  complete: boolean;
  onToggle: () => void;
  extra?: ReactNode;
}) => (
  <div className="flex flex-col gap-5">
    <div className="rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-12 text-center text-app-muted">
      {label} — step content here
    </div>
    {extra}
    <Button variant="secondary" size="sm" onClick={onToggle}>
      {complete ? "Mark step incomplete" : "Mark step complete"}
    </Button>
  </div>
);

const RecapChip = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center gap-1 rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-3 text-center">
    <span className="text-lg font-bold text-app-text">{value}</span>
    <span className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
      {label}
    </span>
  </div>
);

export default function CreateWalletWizardMock() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [accent, setAccent] = useState<string | undefined>(undefined);
  const [failMock, setFailMock] = useState(false);
  const [complete, setComplete] = useState([false, false, false, false, false]);
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
        <Placeholder
          label="Wallet basics"
          complete={complete[0]}
          onToggle={() => toggle(0)}
          extra={
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-app-muted">
                Pick an accent to preview the stepper colour
              </span>
              <div className="flex gap-2">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`accent ${c}`}
                    onClick={() => setAccent(c)}
                    style={{ backgroundColor: c }}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      accent === c ? "scale-110 ring-2 ring-app-text" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          }
        />
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
        <Placeholder
          label="Tags"
          complete={complete[1]}
          onToggle={() => toggle(1)}
        />
      ),
    },
    {
      name: "Subscriptions",
      icon: faArrowsRotate,
      mandatory: false,
      isComplete: complete[2],
      nextLabel: "Continue",
      nextLabelIncomplete: "Continue without subscriptions",
      content: (
        <Placeholder
          label="Subscriptions"
          complete={complete[2]}
          onToggle={() => toggle(2)}
        />
      ),
    },
    {
      name: "Transactions",
      icon: faReceipt,
      mandatory: false,
      isComplete: complete[3],
      nextLabel: "Continue",
      nextLabelIncomplete: "Continue without transactions",
      content: (
        <Placeholder
          label="Transactions"
          complete={complete[3]}
          onToggle={() => toggle(3)}
        />
      ),
    },
    {
      name: "Invite",
      icon: faUserPlus,
      mandatory: false,
      isComplete: complete[4],
      nextLabel: "Finish setup",
      nextLabelIncomplete: "Continue without inviting others",
      content: (
        <Placeholder
          label="Invite others"
          complete={complete[4]}
          onToggle={() => toggle(4)}
          extra={
            <label className="flex items-center justify-center gap-2 text-xs text-app-muted">
              <input
                type="checkbox"
                checked={failMock}
                onChange={(e) => setFailMock(e.target.checked)}
              />
              Simulate a failing final phase
            </label>
          }
        />
      ),
    },
  ];

  const onComplete = () =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => (failMock ? reject(new Error("mock")) : resolve()), 900),
    );

  const renderCompletion = (s: WizardCompletionState<unknown>): ReactNode => {
    if (s.status === "processing") {
      return (
        <div className="py-16 text-center text-app-muted">
          Creating your wallet…
        </div>
      );
    }
    if (s.status === "error") {
      return (
        <div className="flex flex-col items-center gap-5 py-10 text-center">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="text-3xl text-app-yellow"
          />
          <div>
            <h3 className="text-lg font-bold text-app-text">
              Something failed to import
            </h3>
            <p className="mt-1 text-sm text-app-muted">
              The wallet exists, but some data didn't import (mock).
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => s.goToStep(0)}>
              Manage failed
            </Button>
            <Button
              accentColor={accent}
              ripple
              onClick={() => navigate("/about")}
            >
              Go to wallet
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <FontAwesomeIcon
          icon={faCircleCheck}
          className="text-3xl text-app-green"
        />
        <div>
          <h3 className="text-lg font-bold text-app-text">Wallet created</h3>
          <p className="mt-1 text-sm text-app-muted">
            Here's what was set up (mock data).
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          <RecapChip value="8" label="Tags" />
          <RecapChip value="3" label="Subscriptions" />
          <RecapChip value="20" label="Transactions" />
          <RecapChip value="2/3" label="Invites" />
        </div>
        <Button accentColor={accent} ripple onClick={() => navigate("/about")}>
          Go to wallet
        </Button>
      </div>
    );
  };

  if (!open) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Button onClick={() => setOpen(true)}>Reopen wizard mock</Button>
      </div>
    );
  }

  return (
    <WizardShell
      open={open}
      title="Create a new wallet"
      subtitle="Mock — visual preview only"
      onClose={() => setOpen(false)}
    >
      <Wizard
        steps={steps}
        onComplete={onComplete}
        renderCompletion={renderCompletion}
        accentColor={accent}
      />
    </WizardShell>
  );
}
