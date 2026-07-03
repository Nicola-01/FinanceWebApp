import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPen,
  faPaperPlane,
  faUser,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Selector } from "../../components/ui/Selector.tsx";

interface InviteSectionProps {
  walletColor: string;
  onInvite: (identifier: string, role: "EDITOR" | "VIEWER") => Promise<boolean>;
}

/**
 * Compact invite row shaped like a MemberRow: one `bg-app-surface` shell with a
 * borderless username/email field on the left and the role selector + an
 * icon-only send button (same height as the selector) grouped on the right.
 */
export const InviteSection: React.FC<InviteSectionProps> = ({
  walletColor,
  onInvite,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async () => {
    setIsInviting(true);
    const success = await onInvite(identifier, role);
    if (success) setIdentifier("");
    setIsInviting(false);
  };

  const disabled = isInviting || identifier.trim().length < 3;

  return (
    <div className="flex flex-col gap-2 rounded-[var(--r-input)] border border-app-border bg-app-surface p-2 sm:flex-row sm:items-center">
      {/* Username / email — borderless, sits on the row surface */}
      <label className="flex min-w-0 flex-1 cursor-text items-center gap-2 px-2">
        <FontAwesomeIcon icon={faUser} className="shrink-0 text-app-muted" />
        <input
          type="text"
          aria-label="Username or email"
          placeholder="Invite by username or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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
        <Selector
          value={role}
          onChange={setRole}
          size="sm"
          fullWidth={false}
          className="flex-1 sm:w-36 sm:flex-none"
          options={[
            {
              value: "VIEWER",
              label: "Viewer",
              icon: <FontAwesomeIcon icon={faEye} />,
              activeBgClass: "bg-app-surface",
              activeColorClass: "text-app-text",
            },
            {
              value: "EDITOR",
              label: "Editor",
              icon: <FontAwesomeIcon icon={faPen} />,
              activeBgClass: "bg-app-surface",
              activeColorClass: "text-app-text",
            },
          ]}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          aria-label="Send invite"
          title="Send invite"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-all hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: walletColor }}
        >
          <FontAwesomeIcon
            icon={isInviting ? faSpinner : faPaperPlane}
            spin={isInviting}
            className="text-sm"
          />
        </button>
      </div>
    </div>
  );
};
