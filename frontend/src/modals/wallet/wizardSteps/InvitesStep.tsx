import { useState, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faPen,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { Selector } from "../../../components/ui/Selector";
import { WizardStepHeader } from "./WizardStepHeader";

/** A single staged invitation for the wallet being created. */
export interface WalletInvite {
  /** Email OR username of the person being invited. */
  user: string;
  role: "VIEWER" | "EDITOR";
}

export interface InvitesStepProps {
  /** Currently staged invites (controlled). */
  value: WalletInvite[];
  /** Called with the next list whenever an invite is added or removed. */
  onChange: (next: WalletInvite[]) => void;
  /** Wallet colour (hex) used to accent the Add button. */
  accentColor?: string;
}

/**
 * Wizard step body for inviting people to a new wallet. Renders only the step
 * content (no stepper, no Back/Continue) and is fully controlled by the parent
 * via `value` / `onChange`.
 */
export function InvitesStep({
  value,
  onChange,
  accentColor,
}: InvitesStepProps): JSX.Element {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<WalletInvite["role"]>("EDITOR");

  const trimmed = identifier.trim();
  const isDuplicate = value.some(
    (invite) => invite.user.toLowerCase() === trimmed.toLowerCase(),
  );
  const canAdd = trimmed.length > 0 && !isDuplicate;

  const handleAdd = () => {
    if (!canAdd) return;
    onChange([...value, { user: trimmed, role }]);
    setIdentifier("");
  };

  const handleRemove = (user: string) => {
    onChange(value.filter((invite) => invite.user !== user));
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <WizardStepHeader
        icon={faUserPlus}
        title="Invite people"
        subtitle="Share this wallet as a viewer or editor — you can add more later."
      />

      {/* Identifier + role + add */}
      <div className="flex flex-col gap-3">
        <Input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Email or username"
          aria-label="Email or username"
          leadingIcon={<FontAwesomeIcon icon={faEnvelope} />}
        />

        <div className="flex items-stretch gap-3">
          <Selector
            className="flex-1"
            value={role}
            onChange={setRole}
            options={[
              {
                value: "VIEWER",
                label: "Viewer",
                icon: <FontAwesomeIcon icon={faEye} />,
              },
              {
                value: "EDITOR",
                label: "Editor",
                icon: <FontAwesomeIcon icon={faPen} />,
                activeColorClass: "text-app-yellow",
              },
            ]}
          />
          <Button
            type="button"
            accentColor={accentColor}
            ripple
            onClick={handleAdd}
            disabled={!canAdd}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Staged invites */}
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((invite) => (
            <li
              key={invite.user}
              className="flex items-center gap-3 rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-2.5"
            >
              <FontAwesomeIcon
                icon={invite.role === "EDITOR" ? faPen : faEye}
                className={
                  invite.role === "EDITOR"
                    ? "text-app-yellow"
                    : "text-app-muted"
                }
              />
              <span className="min-w-0 flex-1 truncate text-sm text-app-text">
                {invite.user}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                {invite.role === "EDITOR" ? "Editor" : "Viewer"}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(invite.user)}
                aria-label={`Remove ${invite.user}`}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] text-app-muted transition-colors hover:bg-app-hover hover:text-app-red"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InvitesStep;
