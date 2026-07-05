import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faKey,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PasswordInput } from "../../modals/auth/PasswordInput";
import { useDeleteModal } from "../../modals/common/DeleteModalContext";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";
import { getUserAuth } from "../../utils/authHelper";
import type { User } from "../../utils/types";

/**
 * Danger zone: permanent, GDPR account deletion via `DELETE /api/users/me`
 * ({ password }) — erases everything tied to the user, handing over shared
 * wallets they own to another member and cascade-deleting solely-owned ones.
 *
 * Because it's irreversible we stack two barriers: the password is confirmed
 * inline here, then the shared DeleteModal is opened at level 2 (type the exact
 * username + press-and-hold). The DELETE only fires from the modal's confirm.
 */
export const DeleteAccountSection: React.FC = () => {
  const deleteModalRef = useDeleteModal();
  const auth = getUserAuth();
  const username = auth?.username ?? "";

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const reset = () => {
    setOpen(false);
    setPassword("");
  };

  const confirmDelete = async () => {
    try {
      // axios needs the body under `data` for a DELETE with a payload.
      await api.delete("/users/me", { data: { password } });
      triggerToast("Your account has been deleted.", true);
      // Same teardown as logout — the session is gone server-side.
      localStorage.removeItem("jwtToken");
      sessionStorage.removeItem("jwtToken");
      localStorage.removeItem("mustChangePWD");
      window.location.href = "/login";
    } catch (err: unknown) {
      // Modal closes itself afterwards; the password stays filled so the user
      // can retry (e.g. after a wrong-password 401) without starting over.
      triggerToast(getApiErrorDetail(err, "Could not delete account"), false);
    }
  };

  const openConfirmModal = () => {
    if (!password) return;
    // Minimal User-shaped payload so the modal shows/checks the username as the
    // name to re-type. Nothing but `name` is used by the deletion callback.
    const self: User = { id: auth?.userId ?? "", name: username, token: "" };
    deleteModalRef.current?.deleteObject(self, "account", confirmDelete, 2);
  };

  return (
    <Card
      tone="danger"
      description="Permanently delete your account together with your wallets, transactions and all associated data. This action cannot be undone."
      footer={
        open ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="w-full sm:w-40"
              onClick={reset}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              ripple
              className="w-full sm:w-64"
              onClick={openConfirmModal}
              disabled={!password}
            >
              Continue
              <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </div>
        ) : (
          <Button
            variant="danger"
            className="w-full sm:w-56"
            onClick={() => setOpen(true)}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete account
          </Button>
        )
      }
    >
      {open && (
        <div className="space-y-3">
          <PasswordInput
            label="Confirm your password"
            placeholder="Enter your password"
            value={password}
            icon={faKey}
            onChange={setPassword}
          />
          <p className="text-xs text-app-muted">
            Next you'll be asked to type your username{" "}
            <span className="font-semibold text-app-text">{username}</span> and
            press-and-hold to permanently delete the account.
          </p>
        </div>
      )}
    </Card>
  );
};
