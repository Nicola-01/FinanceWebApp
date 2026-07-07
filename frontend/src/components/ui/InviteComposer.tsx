import { type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faSpinner,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { RoleSelector, type WalletRole } from "./RoleSelector";

export interface InviteComposerProps {
  /** Username/email being typed (controlled). */
  identifier: string;
  onIdentifierChange: (value: string) => void;
  /** Role the invitee will get (controlled). */
  role: WalletRole;
  onRoleChange: (role: WalletRole) => void;
  /** Fired by the action button and by Enter (unless disabled). */
  onSubmit: () => void;
  /** Disables the action button and Enter-to-submit. */
  disabled?: boolean;
  /** Swaps the action icon for a spinner while a request is in flight. */
  busy?: boolean;
  /** Accent colour (hex) for the action button; defaults to the brand colour. */
  accentColor?: string;
  /** Icon inside the action button. Defaults to a paper plane (send). */
  actionIcon?: IconDefinition;
  /** Accessible name + tooltip for the action button. */
  actionLabel?: string;
  /** Leading icon inside the field. */
  leadingIcon?: IconDefinition;
  placeholder?: string;
  /** Accessible name for the input. */
  ariaLabel?: string;
}

/**
 * Compact invite row: one `bg-app-surface` shell with a borderless
 * username/email field on the left and the {@link RoleSelector} + an icon-only
 * action button (same height as the selector) grouped on the right. Shared by
 * the wallet settings › Members invite box and the creation wizard's invite
 * step so both look identical.
 */
export function InviteComposer({
  identifier,
  onIdentifierChange,
  role,
  onRoleChange,
  onSubmit,
  disabled = false,
  busy = false,
  accentColor = "var(--brand-1)",
  actionIcon = faPaperPlane,
  actionLabel = "Send invite",
  leadingIcon = faUser,
  placeholder = "Invite by username or email",
  ariaLabel = "Username or email",
}: InviteComposerProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--r-input)] border border-app-border bg-app-surface p-2 sm:flex-row sm:items-center">
      {/* Username / email — borderless, sits on the row surface */}
      <label className="flex min-w-0 flex-1 cursor-text items-center gap-2 px-2">
        <FontAwesomeIcon
          icon={leadingIcon}
          className="shrink-0 text-app-muted"
        />
        <input
          type="text"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={identifier}
          onChange={(e) => onIdentifierChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) {
              e.preventDefault();
              onSubmit();
            }
          }}
          // Not a credential field — keep password managers from autofilling it.
          autoComplete="off"
          data-bwignore="true"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm text-app-text outline-none placeholder:text-app-muted"
        />
      </label>

      {/* Right controls — grouped, all at the selector's height */}
      <div className="flex shrink-0 items-center gap-2">
        <RoleSelector
          value={role}
          onChange={onRoleChange}
          size="sm"
          fullWidth={false}
          className="flex-1 sm:w-36 sm:flex-none"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          aria-label={actionLabel}
          title={actionLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-all hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          <FontAwesomeIcon
            icon={busy ? faSpinner : actionIcon}
            spin={busy}
            className="text-sm"
          />
        </button>
      </div>
    </div>
  );
}

export default InviteComposer;
