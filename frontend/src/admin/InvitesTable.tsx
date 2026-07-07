import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCopy, faTrash } from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Collapse } from "../components/ui/Collapse.tsx";

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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
