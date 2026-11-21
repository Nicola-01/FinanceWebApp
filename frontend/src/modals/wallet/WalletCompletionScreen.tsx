import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCircleCheck,
  faReceipt,
  faTag,
  faTriangleExclamation,
  faUserPlus,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { WizardCompletionState } from "../../components/ui/Wizard";
import Button from "../../components/ui/Button";
import { FormRow } from "../../components/ui/FormRow";
import { useUiVersion } from "../../hooks/useUiVersion";
import type { ResourceOutcome, WalletCreationResult } from "./walletCreation";

const RES_LABEL: Record<ResourceOutcome["resource"], string> = {
  tags: "Tags",
  subscriptions: "Subscriptions",
  transactions: "Transactions",
  invites: "Invites",
};

const RES_ICON: Record<ResourceOutcome["resource"], IconDefinition> = {
  tags: faTag,
  subscriptions: faArrowsRotate,
  transactions: faReceipt,
  invites: faUserPlus,
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

/** Terminal screen: processing spinner, blocking-error (the creation is atomic,
 *  so no wallet exists), or the per-resource recap after the wallet was created.
 *  Only invites can partially fail here — everything else is transactional. */
export function WalletCompletionScreen({
  state,
  accentColor,
  onFinish,
}: {
  state: WizardCompletionState<WalletCreationResult>;
  accentColor?: string;
  onFinish: (walletId: string) => void;
}) {
  const [ui] = useUiVersion(); // ui-v2-switch
  if (ui === "v2")
    // ui-v2-switch
    return (
      <V2Completion
        state={state}
        accentColor={accentColor}
        onFinish={onFinish}
      />
    );

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
            ? "The wallet was created, but some invitations couldn't be sent."
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
          You can invite members again later from the wallet's member settings.
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

/** v2 terminal screen: centred icon chip, display title, summary card of
 *  FormRows with tabular counts, and the wallet-accent CTA. */
function V2Completion({
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
      <div className="py-16 text-center text-[15px] text-app-muted">
        Creating your wallet…
      </div>
    );

  const chip = (icon: IconDefinition) => (
    <span className="grid h-12 w-12 place-items-center rounded-[var(--r-card)] bg-wallet text-lg text-on-wallet">
      <FontAwesomeIcon icon={icon} />
    </span>
  );

  if (state.status === "error") {
    const msg =
      state.error instanceof Error
        ? state.error.message
        : "Something went wrong";
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        {chip(faTriangleExclamation)}
        <div>
          <h3 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
            Couldn't create the wallet
          </h3>
          <p className="mt-1 text-[13px] text-app-muted">{msg}</p>
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
      {chip(result.anyFailed ? faTriangleExclamation : faCircleCheck)}
      <div>
        <h3 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
          {result.anyFailed
            ? "Wallet created with some issues"
            : "Wallet ready"}
        </h3>
        <p className="mt-1 text-[13px] text-app-muted">
          {result.anyFailed
            ? "The wallet was created, but some invitations couldn't be sent."
            : "Your new wallet is set up."}
        </p>
      </div>

      {result.outcomes.length > 0 && (
        <div className="w-full divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
          {result.outcomes.map((o) => (
            <FormRow
              key={o.resource}
              icon={o.ok ? RES_ICON[o.resource] : faTriangleExclamation}
              label={RES_LABEL[o.resource]}
            >
              <span
                className={`text-right text-[13px] tabular-nums ${o.ok ? "text-app-muted" : "text-app-danger"}`}
              >
                {outcomeSummary(o)}
              </span>
            </FormRow>
          ))}
        </div>
      )}

      {result.anyFailed && (
        <p className="text-[13px] text-app-muted">
          You can invite members again later from the wallet's member settings.
        </p>
      )}

      <Button
        accentColor={accentColor}
        ripple
        fullWidth
        onClick={() => onFinish(result.walletId)}
      >
        Go to wallet
      </Button>
    </div>
  );
}
