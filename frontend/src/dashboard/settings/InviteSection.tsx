import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPen,
  faUserPlus,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { SettingsCard } from "../../components/settings/SettingsCard.tsx";
import { Selector } from "../../components/ui/Selector.tsx";

interface InviteSectionProps {
  walletColor: string;
  onInvite: (identifier: string, role: "EDITOR" | "VIEWER") => Promise<boolean>;
}

export const InviteSection: React.FC<InviteSectionProps> = ({
  walletColor,
  onInvite,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async () => {
    setIsInviting(true);

    const success = await onInvite(identifier, role);
    if (success) {
      setIdentifier("");
    }

    setIsInviting(false);
  };

  return (
    <SettingsCard
      title="Invite People"
      icon={faUserPlus}
      iconColor={walletColor}
      subtitle="Add users to collaborate on this wallet."
      actionText="Send Invite"
      actionIcon={faPaperPlane}
      actionColor={walletColor}
      onAction={handleSubmit}
      actionDisabled={isInviting || identifier.trim().length < 3}
      isActionLoading={isInviting}
    >
      {/* Layout a colonna (stacked) per rispecchiare il design dell'immagine */}
      <div className="flex flex-col gap-5 mt-2">
        {/* 1. Input Username/Email (Larghezza Piena) */}
        <div className="w-full">
          <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
            Username or Email
          </label>
          <input
            className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-sm text-app-text outline-none transition-all focus:border-app-border shadow-inner"
            type="search"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div className="w-full self-end">
          <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
            Permission Role
          </label>
          <Selector
            value={role}
            onChange={setRole}
            size="lg"
            options={[
              {
                value: "VIEWER",
                label: "Viewer",
                icon: <FontAwesomeIcon icon={faEye} />,
                activeBgClass: "theme-bg-primary-light",
                activeColorClass: "text-app-text",
              },
              {
                value: "EDITOR",
                label: "Editor",
                icon: <FontAwesomeIcon icon={faPen} />,
                activeBgClass: "theme-bg-warning-light",
                activeColorClass: "theme-text-warning",
              },
            ]}
          />
          <p className="mt-2 text-xs text-app-muted text-center">
            {role === "VIEWER"
              ? "Viewers can only read transactions and statistics."
              : "Editors can add, edit, and delete transactions."}
          </p>
        </div>
      </div>
    </SettingsCard>
  );
};
