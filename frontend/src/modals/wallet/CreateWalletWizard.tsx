import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faTag,
  faArrowsRotate,
  faReceipt,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Wizard, type WizardStep } from "../../components/ui/Wizard";
import { WizardShell } from "../../components/ui/WizardShell";
import { ConfirmModal } from "../common/ConfirmModal";
import { BasicsStep } from "./wizardSteps/BasicsStep";
import { TagsStep } from "./wizardSteps/TagsStep";
import {
  fetchTagSources,
  type SourceWallet,
} from "./wizardSteps/sourceWallets";
import { SubscriptionsStep } from "./wizardSteps/SubscriptionsStep";
import { hasUnresolvedSubscriptionTags } from "./wizardSteps/subscriptionModes/subscriptionTags";
import { missingTransactionTagCount } from "./wizardSteps/transactionTags";
import { TransactionsStep } from "./wizardSteps/TransactionsStep";
import { InvitesStep } from "./wizardSteps/InvitesStep";
import {
  createWalletFromDraft,
  type WalletDraft,
  type WalletCreationResult,
} from "./walletCreation";
import { WalletCompletionScreen } from "./WalletCompletionScreen";

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
    // A staged subscription pointing at a tag that isn't in the draft can't be
    // imported — block Continue until every such conflict is resolved.
    const subscriptionsBlocked = hasUnresolvedSubscriptionTags(
      draft.subscriptions,
      draft.tags,
    );
    // Same guard for transactions — but we surface only the *count* of missing
    // tags, never their names.
    const missingTransactionTags = missingTransactionTagCount(
      draft.transactions,
      draft.tags,
    );
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
        name: "Subscriptions",
        icon: faArrowsRotate,
        mandatory: false,
        isComplete: draft.subscriptions.length > 0,
        blocked: subscriptionsBlocked,
        blockedReason:
          "Some subscriptions use a tag that isn't in this wallet — reassign or create it to continue.",
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
        name: "Transactions",
        icon: faReceipt,
        mandatory: false,
        isComplete: draft.transactions.length > 0,
        blocked: missingTransactionTags > 0,
        blockedReason:
          "Some transactions use a tag that isn't in this wallet — create it, reassign, or remove those transactions to continue.",
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
            tags={draft.tags}
            onTagsChange={(tags) => setDraft((d) => ({ ...d, tags }))}
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
