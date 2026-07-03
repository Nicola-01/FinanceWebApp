import React, { useState } from "react";
import api from "../api/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPaperPlane,
  faStickyNote,
} from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError.ts";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";

interface CreateInviteFormProps {
  onInviteCreated: () => void;
}

export const CreateInviteForm: React.FC<CreateInviteFormProps> = ({
  onInviteCreated,
}) => {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      triggerToast("Please enter a valid email address.", false);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/admin/management", {
        email: email.trim(),
        note: note.trim(),
      });
      triggerToast("Invite sent successfully!", true);
      setEmail("");
      setNote("");
      onInviteCreated();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Failed to send invite"), false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Slim single-line invite bar: email + optional note + send.
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      onSubmit={handleCreate}
    >
      {/* type="search" avoids password-manager autofill on the email field */}
      <Input
        type="search"
        leadingIcon={<FontAwesomeIcon icon={faEnvelope} />}
        placeholder="Invite a user by email…"
        aria-label="Invite email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        autoComplete="off"
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      <Input
        leadingIcon={<FontAwesomeIcon icon={faStickyNote} />}
        placeholder="Optional note…"
        aria-label="Invite note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={isLoading}
      />
      <Button
        type="submit"
        variant="primary"
        ripple
        disabled={!email || isLoading}
        className="sm:w-auto"
      >
        <FontAwesomeIcon
          icon={faPaperPlane}
          className={isLoading ? "animate-pulse" : ""}
        />
        Send
      </Button>
    </form>
  );
};
