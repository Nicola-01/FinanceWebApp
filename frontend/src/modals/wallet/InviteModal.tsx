import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faXmark,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";
import Button from "../../components/ui/Button";
import { type IconKey, ICONS } from "../../utils/icons";
import type { Invitation } from "../../utils/types";

export interface InviteModalProps {
  /** The invitation to respond to; `null` keeps the modal closed. */
  invite: Invitation | null;
  onAccept: (walletId: string) => Promise<void>;
  onReject: (walletId: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Translates a per-wallet role into the plain-language capabilities the invitee
 * gets — we never surface the raw "EDITOR"/"VIEWER" token to the user.
 */
const roleCapability = (
  role: string,
): { title: React.ReactNode; detail: string } => {
  switch (role.toUpperCase()) {
    case "VIEWER":
      return {
        title: (
          <>
            You can <span className="font-bold text-app-text">view</span> this
            wallet
          </>
        ),
        detail:
          "See its balance, transactions and analytics — read-only, you can't make changes.",
      };
    case "OWNER":
      return {
        title: (
          <>
            You get <span className="font-bold text-app-text">full access</span>{" "}
            to this wallet
          </>
        ),
        detail:
          "Manage everything — transactions, subscriptions, tags and members.",
      };
    case "EDITOR":
    default:
      return {
        title: (
          <>
            You can <span className="font-bold text-app-text">view</span> and{" "}
            <span className="font-bold text-app-text">edit</span> this wallet
          </>
        ),
        detail:
          "Add, edit and delete transactions, subscriptions and tags together.",
      };
  }
};

/** Format an ISO date as e.g. "5 July 2026"; falls back to the raw string. */
const formatInvitedAt = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Respond-to-invitation modal: explains what the invite means, spells out the
 * access the invitee would get (in plain language, not the raw role), shows who
 * invited them and when, and hosts the Accept / Reject actions.
 */
export const InviteModal: React.FC<InviteModalProps> = ({
  invite,
  onAccept,
  onReject,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<null | "accept" | "reject">(null);

  // Sync the native <dialog> with the presence of an invite, and clear any
  // stale busy state when a new invite opens the modal.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (invite && !d.open) {
      setBusy(null);
      d.showModal();
    }
    if (!invite && d.open) d.close();
  }, [invite]);

  const run = async (
    kind: "accept" | "reject",
    action: (walletId: string) => Promise<void>,
  ) => {
    if (busy || !invite) return;
    setBusy(kind);
    try {
      await action(invite.wallet.id);
    } finally {
      setBusy(null);
    }
  };

  const wallet = invite?.wallet;
  const capability = invite ? roleCapability(invite.role) : null;

  return (
    <ModalDialog
      ref={dialogRef}
      title="Wallet invitation"
      showClose
      onCloseClick={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      footer={
        invite && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              disabled={busy !== null}
              onClick={() => run("reject", onReject)}
            >
              <FontAwesomeIcon icon={faXmark} />
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </Button>
            <Button
              accentColor={wallet?.color}
              fullWidth
              ripple
              disabled={busy !== null}
              onClick={() => run("accept", onAccept)}
            >
              <FontAwesomeIcon icon={faCheck} />
              {busy === "accept" ? "Accepting…" : "Accept"}
            </Button>
          </div>
        )
      }
    >
      {invite && wallet && capability && (
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-app-muted">
            <span className="font-semibold text-app-text">
              {invite.walletOwner}
            </span>{" "}
            invited you on{" "}
            <span className="font-medium text-app-text">
              {formatInvitedAt(invite.invitedAt)}
            </span>{" "}
            to collaborate on
          </p>

          {/* Wallet icon inline with its name. */}
          <div className="mt-3 flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-base"
              style={{
                backgroundColor: `${wallet.color}26`,
                color: wallet.color,
              }}
            >
              <FontAwesomeIcon
                icon={ICONS[wallet.icon as IconKey] || faEnvelope}
              />
            </span>
            <span
              className="font-app-mono text-xl font-black tracking-tight"
              style={{ color: wallet.color }}
            >
              {wallet.name}
            </span>
          </div>

          {/* Optional wallet description, set by the owner at creation time. */}
          {wallet.description && (
            <p className="mt-2 max-w-sm whitespace-pre-line text-sm text-app-muted">
              {wallet.description}
            </p>
          )}

          {/* What "accepting" actually grants — plain-language capabilities. */}
          <div className="mt-5 w-full rounded-xl border border-app-border bg-app-input/60 p-4 text-left">
            <p className="text-sm text-app-muted">{capability.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-app-muted">
              {capability.detail}
            </p>
          </div>
        </div>
      )}
    </ModalDialog>
  );
};

export default InviteModal;
