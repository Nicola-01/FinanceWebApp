import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { type IconKey, ICONS } from "../../utils/icons";
import type { Invitation } from "../../utils/types";

interface InviteCardProps {
  invite: Invitation;
  /** Open the respond-to-invitation modal (accept / reject live there now). */
  onOpen: (invite: Invitation) => void;
}

/**
 * Pending-invitation tile: a single-row, dashed clickable card that mirrors a
 * WalletCard's layout (so it never stretches the wallet row on mobile). Tapping
 * it opens the InviteModal where the user accepts or rejects.
 */
export const InviteCard: React.FC<InviteCardProps> = ({ invite, onOpen }) => {
  const { wallet } = invite;
  return (
    <button
      type="button"
      onClick={() => onOpen(invite)}
      aria-label={`Respond to invitation for ${wallet.name}`}
      className="group flex w-[260px] shrink-0 items-center gap-4 rounded-2xl border border-dashed p-4 text-left transition-colors hover:brightness-110 xl:w-full"
      style={{
        borderColor: `${wallet.color}66`,
        backgroundColor: `${wallet.color}0d`,
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ backgroundColor: `${wallet.color}26`, color: wallet.color }}
      >
        <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || faEnvelope} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-app-mono text-sm font-black tracking-tight text-app-text">
          {wallet.name}
        </h4>
        <p className="mt-0.5 truncate text-[11px] text-app-muted">
          Invited by{" "}
          <span className="font-semibold text-app-text">
            {invite.walletOwner}
          </span>
          {" · "}
          <span className="rounded bg-app-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-muted">
            {invite.role}
          </span>
        </p>
      </div>
      <FontAwesomeIcon
        icon={faChevronRight}
        className="shrink-0 text-xs text-app-muted transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
};
