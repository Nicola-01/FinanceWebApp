import React, { useState } from "react";
import {
  faUser,
  faPen,
  faCheck,
  faXmark,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Input } from "../../components/ui/Input";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";
import { replaceToken } from "../../utils/authHelper";
import { AccountRow } from "./AccountRow";
import { IconAction } from "./IconAction";

/** Inline-editable username row. */
export const UsernameRow: React.FC<{
  username: string | undefined;
  onUpdated: (name: string) => void;
}> = ({ username, onUpdated }) => {
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const startEditUsername = () => {
    setUsernameDraft(username ?? "");
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    const name = usernameDraft.trim();
    if (!name || name === username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    try {
      // Backend re-issues tokens (username is the JWT subject) — store the new one.
      const res = await api.put("/users/me/username", { username: name });
      if (res.data?.token) replaceToken(res.data.token);
      onUpdated(name);
      setEditingUsername(false);
      triggerToast("Username updated", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to update username"), false);
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <AccountRow label="Username" icon={faUser}>
      {editingUsername ? (
        <>
          <Input
            value={usernameDraft}
            onChange={(e) => setUsernameDraft(e.target.value)}
            className="text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && saveUsername()}
          />
          <IconAction
            icon={savingUsername ? faSpinner : faCheck}
            spin={savingUsername}
            onClick={saveUsername}
            label="Save username"
            disabled={savingUsername || !usernameDraft.trim()}
          />
          <IconAction
            icon={faXmark}
            onClick={() => setEditingUsername(false)}
            label="Cancel"
            disabled={savingUsername}
          />
        </>
      ) : (
        <>
          <span className="truncate text-sm font-semibold text-app-text">
            {username ?? "—"}
          </span>
          <IconAction
            icon={faPen}
            onClick={startEditUsername}
            label="Edit username"
          />
        </>
      )}
    </AccountRow>
  );
};
