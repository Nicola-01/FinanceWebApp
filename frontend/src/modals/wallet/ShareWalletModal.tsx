import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import api from "../../api/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPen,
  faShareNodes,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import type { Wallet } from "../../utils/types";
import { getApiErrorTitle } from "../../utils/apiError";

export interface ShareWalletModalHandle {
  openModal: () => void;
}

interface Props {
  wallet: Wallet;
}

export const ShareWalletModal = forwardRef<ShareWalletModalHandle, Props>(
  ({ wallet }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [identifier, setIdentifier] = useState("");
    const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      openModal: () => {
        setIdentifier("");
        setRole("VIEWER");
        dialogRef.current?.showModal();
      },
    }));

    const handleSubmit = async () => {
      if (identifier.trim().length < 3) {
        return triggerToast("Please enter a valid username or email.", false);
      }

      setLoading(true);
      try {
        await api.post(`/wallets/${wallet.id}/share`, {
          identifier: identifier.trim(),
          role: role,
        });

        triggerToast(`Wallet shared successfully with ${identifier}!`, true);
        if (dialogRef.current?.open) dialogRef.current.close();
      } catch (err: unknown) {
        triggerToast(getApiErrorTitle(err, "Error sharing wallet"), false);
      } finally {
        setLoading(false);
      }
    };

    if (!wallet) return;

    return (
      <ModalDialog
        ref={dialogRef}
        className="max-w-112.5"
        title={
          <>
            <FontAwesomeIcon
              icon={faShareNodes}
              style={{ color: wallet.color }}
            />{" "}
            Share "{wallet.name}"
          </>
        }
        subtitle="Invite someone to view or edit this wallet."
        footer={
          <Button
            accentColor={wallet.color}
            fullWidth
            ripple
            onClick={handleSubmit}
            disabled={loading || identifier.trim().length < 3}
          >
            {loading ? "Sharing…" : "Share Wallet"}
          </Button>
        }
      >
        <div id="share-wallet-form" className="flex flex-col gap-5 text-left">
          {/* Username / email */}
          <div>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              User Email or Username *
            </label>
            <Input
              type="text"
              placeholder="e.g. mario.rossi@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Permission Role
            </label>
            <div className="flex w-full rounded-[var(--r-input)] border border-app-border bg-app-input p-1">
              <button
                type="button"
                onClick={() => setRole("VIEWER")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[var(--r-sm)] py-2.5 text-xs font-bold transition-all ${
                  role === "VIEWER"
                    ? "bg-app-surface text-app-text shadow-sm"
                    : "text-app-muted hover:text-app-text"
                }`}
              >
                <FontAwesomeIcon icon={faEye} />
                Viewer
              </button>
              <button
                type="button"
                onClick={() => setRole("EDITOR")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[var(--r-sm)] py-2.5 text-xs font-bold transition-all ${
                  role === "EDITOR"
                    ? "bg-app-yellow/15 text-app-yellow shadow-sm"
                    : "text-app-muted hover:text-app-text"
                }`}
              >
                <FontAwesomeIcon icon={faPen} />
                Editor
              </button>
            </div>
            <p className="mt-2 text-[10px] text-app-muted text-center">
              {role === "VIEWER"
                ? "Viewers can only read transactions and statistics."
                : "Editors can add, edit, and delete transactions."}
            </p>
          </div>
        </div>
      </ModalDialog>
    );
  },
);
