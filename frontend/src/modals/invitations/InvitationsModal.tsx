import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEnvelope,
  faHistory,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import Button from "../../components/ui/Button";
import api from "../../api/axiosConfig";
import type { Invitation } from "../../utils/types";
import { type IconKey, ICONS } from "../../utils/icons";

export interface InvitationsModalHandle {
  openModal: (invites: Invitation[]) => void;
}

export const InvitationsModal = forwardRef<InvitationsModalHandle>(
  (_props, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">(
      "PENDING",
    );
    const [loading, setLoading] = useState(false);

    const [invitations, setInvitations] = useState<Invitation[]>([]);

    useImperativeHandle(ref, () => ({
      openModal: (invites: Invitation[]) => {
        setActiveTab("PENDING");
        setInvitations(invites);
        dialogRef.current?.showModal();
      },
    }));

    const handleAction = async (id: string, action: "ACCEPT" | "REJECT") => {
      setLoading(true);
      try {
        await api.post(`/invitations/${id}/${action.toLowerCase()}`);
        triggerToast(`Invitation ${action.toLowerCase()}ed!`, true);
        // In un'applicazione reale qui dovresti chiamare una funzione per ricaricare i dati
        dialogRef.current?.close();
      } catch {
        triggerToast("Error processing invitation.", false);
      } finally {
        setLoading(false);
      }
    };

    const pendingInvites = invitations.filter((i) => i.status === "PENDING");
    const historyInvites = invitations.filter((i) => i.status !== "PENDING");

    return (
      <ModalDialog
        ref={dialogRef}
        className="max-w-[500px]"
        title={
          <>
            <FontAwesomeIcon icon={faEnvelope} className="text-app-green" />{" "}
            Invitations
          </>
        }
      >
        <div className="text-center pb-2">
          {/* Tabs */}
          <div className="mb-4 flex rounded-[var(--r-input)] border border-app-border bg-app-input p-1">
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`flex-1 rounded-[var(--r-sm)] py-2 text-sm font-bold transition-all ${activeTab === "PENDING" ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"}`}
            >
              Pending ({pendingInvites.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[var(--r-sm)] py-2 text-sm font-bold transition-all ${activeTab === "HISTORY" ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"}`}
            >
              <FontAwesomeIcon icon={faHistory} />
              History
            </button>
          </div>

          {/* Tab content */}
          <div className="max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar text-left pr-1">
            {activeTab === "PENDING" &&
              (pendingInvites.length > 0 ? (
                pendingInvites.map((inv) => (
                  <div
                    key={inv.wallet.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: `${inv.wallet.color}4d`, // 30% opacità
                      backgroundColor: `${inv.wallet.color}0d`, // 5% opacità
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icona Wallet Dinamica */}
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl shadow-lg"
                        style={{
                          backgroundColor: `${inv.wallet.color}26`,
                          borderColor: `${inv.wallet.color}40`,
                          color: inv.wallet.color,
                        }}
                      >
                        <FontAwesomeIcon
                          icon={ICONS[inv.wallet.icon as IconKey] || faEnvelope}
                        />
                      </div>

                      <div>
                        <p className="text-lg font-bold leading-tight text-app-text">
                          {inv.wallet.name}
                        </p>
                        <p className="mt-1 text-xs text-app-muted">
                          Invited by{" "}
                          <span className="font-medium text-app-text">
                            {inv.walletOwner}
                          </span>{" "}
                          as{" "}
                          <span className="ml-1 rounded bg-app-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            {inv.role}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleAction(inv.wallet.id, "REJECT")}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                        Reject
                      </Button>
                      <Button
                        accentColor={inv.wallet.color}
                        size="sm"
                        fullWidth
                        ripple
                        onClick={() => handleAction(inv.wallet.id, "ACCEPT")}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-app-muted text-sm text-center py-8 italic">
                  No pending invitations.
                </p>
              ))}

            {activeTab === "HISTORY" &&
              (historyInvites.length > 0 ? (
                historyInvites.map((inv) => (
                  <div
                    key={inv.wallet.id}
                    className="flex items-center justify-between rounded-xl border border-app-border bg-app-input p-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icona ridotta per la cronologia */}
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                        style={{
                          backgroundColor: `${inv.wallet.color}20`,
                          color: inv.wallet.color,
                        }}
                      >
                        <FontAwesomeIcon
                          icon={ICONS[inv.wallet.icon as IconKey] || faEnvelope}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight text-app-text">
                          {inv.wallet.name}
                        </p>
                        <p className="text-[11px] text-app-muted">
                          From: {inv.walletOwner}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded ${inv.status === "ACCEPTED" ? "bg-app-green/20 text-app-green" : "bg-app-red/20 text-app-red"}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-app-muted text-sm text-center py-8 italic">
                  No past invitations.
                </p>
              ))}
          </div>
        </div>
      </ModalDialog>
    );
  },
);
