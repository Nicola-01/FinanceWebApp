import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faXmark,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { type IconKey, ICONS } from "../../utils/icons";
import Button from "../../components/ui/Button";
import type { Invitation } from "../../utils/types";

interface InviteCardProps {
  invite: Invitation;
  onAccept: (walletId: string) => void;
  onReject: (invite: Invitation) => void;
}

/** Pending-invitation tile: reads like a wallet card but dashed, with role + actions. */
export const InviteCard: React.FC<InviteCardProps> = ({
  invite,
  onAccept,
  onReject,
}) => {
  const { wallet } = invite;
  return (
    <div
      className="flex w-[260px] shrink-0 flex-col gap-3 rounded-2xl border border-dashed p-4 xl:w-full"
      style={{
        borderColor: `${wallet.color}66`,
        backgroundColor: `${wallet.color}0d`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${wallet.color}26`, color: wallet.color }}
        >
          <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || faEnvelope} />
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-app-mono text-sm font-black tracking-tight text-app-text">
            {wallet.name}
          </h4>
          <p className="mt-0.5 text-[11px] text-app-muted">
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
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => onReject(invite)}
        >
          <FontAwesomeIcon icon={faXmark} />
          Reject
        </Button>
        <Button
          accentColor={wallet.color}
          size="sm"
          fullWidth
          ripple
          onClick={() => onAccept(wallet.id)}
        >
          <FontAwesomeIcon icon={faCheck} />
          Accept
        </Button>
      </div>
    </div>
  );
};
