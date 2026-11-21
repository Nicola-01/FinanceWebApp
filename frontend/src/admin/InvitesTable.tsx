import React from "react";
import { useNow } from "../hooks/useNow.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCopy, faTrash } from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Collapse } from "../components/ui/Collapse.tsx";
import Button from "../components/ui/Button";
import { StatusPill, type Status } from "../components/ui/StatusPill";
import { useUiVersion } from "../hooks/useUiVersion";

const STATUS_TONE: Record<string, Status> = {
  ACCEPTED: "ok",
  PENDING: "warn",
};

export interface AdminInvite {
  email: string;
  note: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface InvitesTableProps {
  invites: AdminInvite[];
  onRevoke: (email: string) => void;
}

export const InvitesTable: React.FC<InvitesTableProps> = ({
  invites,
  onRevoke,
}) => {
  const now = useNow();
  const [ui] = useUiVersion();

  const getTimeRemaining = (expiresAt: string) => {
    const total = new Date(expiresAt).getTime() - now;
    if (total <= 0) return "Expired";

    const d = Math.floor(total / (1000 * 60 * 60 * 24));
    const h = Math.floor((total / (1000 * 60 * 60)) % 24);
    const m = Math.floor((total / 1000 / 60) % 60);
    const s = Math.floor((total / 1000) % 60);

    if (d > 0) {
      return `${d}d ${h}h ${m}m ${s}s`;
    }
    return `${h}h ${m}m ${s}s`;
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    triggerToast("Invite link copied to clipboard", true);
  };

  if (invites.length === 0) return null;

  const hasPending = invites.some((i) => i.status === "PENDING");

  if (ui === "v2") {
    // ui-v2-switch: one card of list rows, status as a StatusPill.
    return (
      <Card padding="none">
        <ul className="divide-y divide-app-border">
          {invites.map((invite) => {
            const isExpired =
              invite.status === "PENDING" &&
              new Date(invite.expiresAt).getTime() - now <= 0;
            const displayStatus = isExpired ? "EXPIRED" : invite.status;
            const isActive = displayStatus === "PENDING";
            const label =
              displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase();
            return (
              <li
                key={`${invite.email}-${invite.createdAt}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-app-text">
                    {invite.email}
                  </div>
                  <div className="truncate text-[13px] text-app-muted">
                    {invite.note || "No note"}
                  </div>
                </div>
                <StatusPill status={STATUS_TONE[displayStatus] ?? "danger"}>
                  {label}
                </StatusPill>
                <span className="min-w-[7rem] text-right text-[13px] tabular-nums text-app-muted">
                  {isActive ? (
                    <>
                      <FontAwesomeIcon
                        icon={faClock}
                        className="mr-1.5 opacity-60"
                      />
                      {getTimeRemaining(invite.expiresAt)}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Copy invite link"
                      aria-label={`Copy invite link for ${invite.email}`}
                      onClick={() => handleCopyUrl(invite.url)}
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </Button>
                  )}
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Revoke invitation"
                      aria-label={`Revoke invitation for ${invite.email}`}
                      onClick={() => onRevoke(invite.email)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    );
  }

  return (
    <Collapse
      size="sm"
      defaultOpen={hasPending}
      title="Invitations"
      badge={
        <Badge variant="subtle" size="md">
          {invites.length}
        </Badge>
      }
    >
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-app-muted">
            <thead className="bg-app-input text-xs uppercase text-app-muted">
              <tr>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Expires In</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {invites.map((invite, index) => {
                // Compute the effective status (PENDING may have timed out)
                const isExpiredTime =
                  new Date(invite.expiresAt).getTime() - now <= 0;

                let displayStatus = invite.status;
                if (displayStatus === "PENDING" && isExpiredTime) {
                  displayStatus = "EXPIRED";
                }

                const isRevoked = displayStatus === "REVOKED";
                const isExpired = displayStatus === "EXPIRED";
                const isAccepted = displayStatus === "ACCEPTED";
                const isPending = displayStatus === "PENDING";

                return (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-app-input"
                  >
                    <td className="px-6 py-4 font-medium text-app-text">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4">
                      {invite.note || (
                        <span className="italic text-app-muted">No note</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        tone={
                          (isAccepted
                            ? "green"
                            : isExpired || isRevoked
                              ? "red"
                              : "yellow") satisfies BadgeTone
                        }
                        shape="rounded"
                        uppercase
                      >
                        {displayStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-app-mono text-app-sky">
                      {/* Hide the timer once the invite is no longer PENDING */}
                      {!isRevoked && !isExpired && !isAccepted ? (
                        <>
                          <FontAwesomeIcon
                            icon={faClock}
                            className="mr-2 opacity-50"
                          />
                          {getTimeRemaining(invite.expiresAt)}
                        </>
                      ) : (
                        <span className="font-sans text-xs italic text-app-muted">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Copy link only while the invite is still actionable */}
                      {!isRevoked && !isExpired && !isAccepted && (
                        <button
                          onClick={() => handleCopyUrl(invite.url)}
                          className="rounded-lg bg-app-input p-2 text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
                          title="Copy Invite Link"
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => onRevoke(invite.email)}
                          className="ml-2 rounded-lg bg-app-red/10 p-2 text-app-red transition-colors hover:bg-app-red/20 hover:text-app-red"
                          title="Revoke Invitation"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Collapse>
  );
};
