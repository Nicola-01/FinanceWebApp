import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { ConfirmModal } from "../../modals/common/ConfirmModal";
import { clearSession } from "../../utils/authHelper";

/** Danger card that revokes every session (server + local) after confirmation. */
export const SignOutEverywhereCard: React.FC = () => {
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await api.post("/auth/logout-all");
    } catch {
      // Proceed with local logout even if the network call fails.
    }
    clearSession();
    window.location.href = "/login";
  };

  return (
    <>
      <Card
        tone="danger"
        title="Sign out from all devices"
        icon={faRightFromBracket}
        description="Ends every active session on all devices and browsers. You'll need to sign in again everywhere."
        footer={
          <Button
            variant="danger"
            className="w-full sm:w-56"
            onClick={() => setConfirmingAll(true)}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            Sign out everywhere
          </Button>
        }
      />

      <ConfirmModal
        open={confirmingAll}
        tone="danger"
        title="Sign out everywhere?"
        message="This ends every active session on all your devices and browsers. You'll need to sign in again everywhere."
        confirmLabel="Sign out everywhere"
        busy={signingOut}
        onConfirm={handleSignOutAll}
        onCancel={() => setConfirmingAll(false)}
      />
    </>
  );
};
