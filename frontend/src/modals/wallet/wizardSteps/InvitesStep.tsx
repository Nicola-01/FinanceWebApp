import { useState, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUser, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { InviteComposer } from "../../../components/ui/InviteComposer";
import {
  RoleSelector,
  type WalletRole,
} from "../../../components/ui/RoleSelector";
import { WizardStepHeader } from "./WizardStepHeader";

/** A single staged invitation for the wallet being created. */
export interface WalletInvite {
  /** Email OR username of the person being invited. */
  user: string;
  role: WalletRole;
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
 * via `value` / `onChange`. The compose row reuses the same {@link InviteComposer}
 * as wallet settings › Members, and each staged invite is shaped like a settings
 * member row — the difference being invites are staged here and only sent when
 * the wallet is created.
 */
export function InvitesStep({
  value,
  onChange,
  accentColor,
}: InvitesStepProps): JSX.Element {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<WalletRole>("EDITOR");

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

  const changeRole = (user: string, nextRole: WalletRole) => {
    onChange(
      value.map((invite) =>
        invite.user === user ? { ...invite, role: nextRole } : invite,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <WizardStepHeader
        icon={faUserPlus}
        title="Invite people"
        subtitle="Share this wallet as a viewer or editor."
        note="You can invite more people or change their access anytime from the wallet."
      />

      {/* Same compose row as wallet settings › Members — here it stages an
          invite instead of sending it immediately. */}
      <InviteComposer
        identifier={identifier}
        onIdentifierChange={setIdentifier}
        role={role}
        onRoleChange={setRole}
        onSubmit={handleAdd}
        disabled={!canAdd}
        accentColor={accentColor}
        actionIcon={faUserPlus}
        actionLabel="Add"
      />

      {/* Staged invites — shaped like the settings member rows. */}
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((invite) => (
            <li
              key={invite.user}
              className="group flex items-center gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-3 transition-colors hover:bg-app-hover"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-card text-sm shadow-sm"
                style={{ color: accentColor }}
              >
                <FontAwesomeIcon icon={faUser} />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-app-text">
                {invite.user}
              </span>
              {/* Compact icon-only switch to change an already-added invite's
                  role — kept content-width so the identifier stays visible. */}
              <RoleSelector
                iconOnly
                fullWidth={false}
                className="shrink-0"
                value={invite.role}
                onChange={(nextRole) => changeRole(invite.user, nextRole)}
              />
              <button
                type="button"
                onClick={() => handleRemove(invite.user)}
                aria-label={`Remove ${invite.user}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover:opacity-100"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InvitesStep;
