import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCopy, faTrash } from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
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
        <span className="rounded-full bg-app-input px-2 py-0.5 text-xs font-bold text-app-muted">
          {invites.length}
        </span>
      }
    >
      <div className="overflow-hidden rounded-[var(--r-card)] border border-app-border bg-app-card/40">
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

                // Status pill colours (app-* tokens)
                let statusColorClasses = "";
                switch (displayStatus) {
                  case "ACCEPTED":
                    statusColorClasses =
                      "bg-app-green/10 text-app-green border border-app-green/20";
                    break;
                  case "EXPIRED":
                  case "REVOKED":
                    statusColorClasses =
                      "bg-app-red/10 text-app-red border border-app-red/20";
                    break;
                  case "PENDING":
                  default:
                    statusColorClasses =
                      "bg-app-yellow/10 text-app-yellow border border-app-yellow/20";
                    break;
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
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColorClasses}`}
                      >
                        {displayStatus}
                      </span>
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
      </div>
    </Collapse>
  );
};
