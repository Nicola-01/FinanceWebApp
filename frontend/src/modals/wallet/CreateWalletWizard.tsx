import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faTag,
  faArrowsRotate,
  faReceipt,
  faUserPlus,
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  Wizard,
  type WizardStep,
  type WizardCompletionState,
} from "../../components/ui/Wizard";
import { WizardShell } from "../../components/ui/WizardShell";
import Button from "../../components/ui/Button";
import { ConfirmModal } from "../common/ConfirmModal";
import { BasicsStep } from "./wizardSteps/BasicsStep";
import { TagsStep } from "./wizardSteps/TagsStep";
import {
  fetchTagSources,
  type SourceWallet,
} from "./wizardSteps/sourceWallets";
import { SubscriptionsStep } from "./wizardSteps/SubscriptionsStep";
import { TransactionsStep } from "./wizardSteps/TransactionsStep";
import { InvitesStep } from "./wizardSteps/InvitesStep";
import {
  createWalletFromDraft,
  type WalletDraft,
  type WalletCreationResult,
  type ResourceOutcome,
} from "./walletCreation";

export interface CreateWalletWizardHandle {
  openModal: () => void;
}

interface Props {
  /** Called with the new wallet's id when the user leaves the wizard after a
   *  successful creation (mirrors the legacy CreateWalletModal contract). */
  onSuccess: (walletId: string) => void;
}

const DEFAULT_DRAFT: WalletDraft = {
  basics: {
    name: "",
    description: "",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
  },
  tags: [],
  subscriptions: [],
  transactions: [],
  invites: [],
};

const RES_LABEL: Record<ResourceOutcome["resource"], string> = {
  tags: "Tags",
  subscriptions: "Subscriptions",
  transactions: "Transactions",
  invites: "Invites",
};

const outcomeSummary = (o: ResourceOutcome): string => {
  if (o.resource === "invites")
    return `${o.sent ?? 0}/${(o.sent ?? 0) + (o.failed ?? 0)} sent`;
  if (!o.ok) return o.error ?? "Failed";
  const parts: string[] = [];
  if (o.created) parts.push(`${o.created} created`);
  if (o.updated) parts.push(`${o.updated} updated`);
  return parts.length ? parts.join(", ") : "Done";
};

/** Terminal screen: processing spinner, blocking-error (no wallet), or the
 *  per-resource recap after the wallet was created. */
function WalletCompletionScreen({
  state,
  accentColor,
  onFinish,
}: {
  state: WizardCompletionState<WalletCreationResult>;
  accentColor?: string;
  onFinish: (walletId: string) => void;
}) {
  if (state.status === "processing")
    return (
      <div className="py-16 text-center text-app-muted">
        Creating your wallet…
      </div>
    );

  if (state.status === "error") {
    const msg =
      state.error instanceof Error
        ? state.error.message
        : "Something went wrong";
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-3xl text-app-red"
        />
        <div>
          <h3 className="text-lg font-bold text-app-text">
            Couldn't create the wallet
          </h3>
          <p className="mt-1 text-sm text-app-muted">{msg}</p>
        </div>
        <Button variant="secondary" onClick={() => state.goToStep(0)}>
          Return to setup
        </Button>
      </div>
    );
  }

  const result = state.result!;
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <FontAwesomeIcon
        icon={result.anyFailed ? faTriangleExclamation : faCircleCheck}
        className={`text-3xl ${result.anyFailed ? "text-app-yellow" : "text-app-green"}`}
      />
      <div>
        <h3 className="text-lg font-bold text-app-text">
          {result.anyFailed
            ? "Wallet created with some issues"
            : "Wallet ready"}
        </h3>
        <p className="mt-1 text-sm text-app-muted">
          {result.anyFailed
            ? "The wallet exists — some data didn't import."
            : "Your new wallet is set up."}
        </p>
      </div>

      {result.outcomes.length > 0 && (
        <ul className="w-full divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] border border-app-border">
          {result.outcomes.map((o) => (
            <li
              key={o.resource}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={o.ok ? faCircleCheck : faTriangleExclamation}
                  className={o.ok ? "text-app-green" : "text-app-red"}
                />
                <span className="text-app-text">{RES_LABEL[o.resource]}</span>
              </span>
              <span
                className={`font-app-mono text-xs tabular-nums ${o.ok ? "text-app-muted" : "text-app-red"}`}
              >
                {outcomeSummary(o)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {result.anyFailed && (
        <p className="text-xs text-app-muted">
          You can re-import the failed items later from Settings → Data.
        </p>
      )}

      <Button
        accentColor={accentColor}
        ripple
        onClick={() => onFinish(result.walletId)}
      >
        Go to wallet
      </Button>
    </div>
  );
}

/**
 * Multi-step wallet-creation wizard. Replaces the single-step CreateWalletModal:
 * same imperative `openModal()` handle and `onSuccess(walletId)` prop, but guides
 * the user through basics, tags, subscriptions, transactions and invites, then
 * creates everything in one final phase.
 */
export const CreateWalletWizard = forwardRef<CreateWalletWizardHandle, Props>(
  ({ onSuccess }, ref) => {
    const [open, setOpen] = useState(false);
    const [runKey, setRunKey] = useState(0);
    const [draft, setDraft] = useState<WalletDraft>(DEFAULT_DRAFT);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    // The user's existing wallets + tags, offered by the "From wallet" tag mode.
    const [tagSources, setTagSources] = useState<SourceWallet[]>([]);
    const createdWalletId = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      openModal: () => {
        setDraft(DEFAULT_DRAFT);
        createdWalletId.current = null;
        setRunKey((k) => k + 1); // remount the Wizard fresh (step 0)
        setOpen(true);
        // Load tag sources in one request; empty on failure (tab shows empty state).
        setTagSources([]);
        void fetchTagSources()
          .then(setTagSources)
          .catch(() => setTagSources([]));
      },
    }));

    const finish = (walletId: string) => {
      setOpen(false);
      onSuccess(walletId);
    };

    const handleClose = () => {
      if (createdWalletId.current) {
        finish(createdWalletId.current);
        return;
      }
      // Always confirm before abandoning the setup, even for an untouched draft.
      setConfirmDiscard(true);
    };

    const discardAndClose = () => {
      setConfirmDiscard(false);
      setOpen(false);
    };

    const nameLen = draft.basics.name.trim().length;
    const steps: WizardStep[] = [
      {
        name: "Basics",
        icon: faWallet,
        mandatory: true,
        isComplete: nameLen >= 3 && nameLen <= 25,
        nextLabel: "Continue",
        content: (
          <BasicsStep
            value={draft.basics}
            onChange={(basics) => setDraft((d) => ({ ...d, basics }))}
          />
        ),
      },
      {
        name: "Tags",
        icon: faTag,
        mandatory: false,
        isComplete: draft.tags.length > 0,
        nextLabel: "Continue",
        nextLabelIncomplete: "Continue without tags",
        content: (
          <TagsStep
            value={draft.tags}
            onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
            accentColor={draft.basics.color}
            sourceWallets={tagSources}
          />
        ),
      },
      {
        name: "Transactions",
        icon: faReceipt,
        mandatory: false,
        isComplete: draft.transactions.length > 0,
        nextLabel: "Continue",
        nextLabelIncomplete: "Continue without transactions",
        content: (
          <TransactionsStep
            value={draft.transactions}
            onChange={(transactions) =>
              setDraft((d) => ({ ...d, transactions }))
            }
            currency={draft.basics.currency}
            accentColor={draft.basics.color}
          />
        ),
      },
      {
        name: "Subscriptions",
        icon: faArrowsRotate,
        mandatory: false,
        isComplete: draft.subscriptions.length > 0,
        nextLabel: "Continue",
        nextLabelIncomplete: "Continue without subscriptions",
        content: (
          <SubscriptionsStep
            value={draft.subscriptions}
            onChange={(subscriptions) =>
              setDraft((d) => ({ ...d, subscriptions }))
            }
            tags={draft.tags}
            onTagsChange={(tags) => setDraft((d) => ({ ...d, tags }))}
            currency={draft.basics.currency}
            accentColor={draft.basics.color}
          />
        ),
      },
      {
        name: "Invite",
        icon: faUserPlus,
        mandatory: false,
        isComplete: draft.invites.length > 0,
        nextLabel: "Finish setup",
        nextLabelIncomplete: "Continue without inviting others",
        content: (
          <InvitesStep
            value={draft.invites}
            onChange={(invites) => setDraft((d) => ({ ...d, invites }))}
            accentColor={draft.basics.color}
          />
        ),
      },
    ];

    const onComplete = async (): Promise<WalletCreationResult> => {
      const result = await createWalletFromDraft(draft);
      createdWalletId.current = result.walletId;
      return result;
    };

    return (
      <>
        <WizardShell
          open={open}
          title={
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faWallet} className="text-app-green" />
              Create a new wallet
            </span>
          }
          subtitle="Set up your wallet — add as much or as little as you like."
          onClose={handleClose}
        >
          <Wizard<WalletCreationResult>
            key={runKey}
            steps={steps}
            onComplete={onComplete}
            accentColor={draft.basics.color}
            renderCompletion={(s) => (
              <WalletCompletionScreen
                state={s}
                accentColor={draft.basics.color}
                onFinish={finish}
              />
            )}
          />
        </WizardShell>

        {/* Discard-confirm for the X / Esc close while the draft is dirty.
            Native <dialog> top layer — paints above the full-screen shell. */}
        <ConfirmModal
          open={confirmDiscard}
          tone="warning"
          title="Discard wallet setup?"
          message="Your changes won't be saved."
          confirmLabel="Discard"
          onConfirm={discardAndClose}
          onCancel={() => setConfirmDiscard(false)}
        />
      </>
    );
  },
);

CreateWalletWizard.displayName = "CreateWalletWizard";

export default CreateWalletWizard;
