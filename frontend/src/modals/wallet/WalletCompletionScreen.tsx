import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import type { WizardCompletionState } from "../../components/ui/Wizard";
import Button from "../../components/ui/Button";
import type { ResourceOutcome, WalletCreationResult } from "./walletCreation";

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
