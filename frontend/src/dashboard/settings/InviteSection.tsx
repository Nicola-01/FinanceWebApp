import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPen,
  faUserPlus,
  faPaperPlane,
  faUser,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
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
    if (success) setIdentifier("");
    setIsInviting(false);
  };

  return (
    <Card
      title="Invite People"
      subtitle="Add people to collaborate on this wallet."
      icon={faUserPlus}
      iconColor={walletColor}
      footer={
        <Button
          accentColor={walletColor}
          ripple
          onClick={handleSubmit}
          disabled={isInviting || identifier.trim().length < 3}
        >
          <FontAwesomeIcon
            icon={isInviting ? faSpinner : faPaperPlane}
            spin={isInviting}
          />
          {isInviting ? "Sending…" : "Send Invite"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Username or email */}
        <div className="flex flex-col gap-2">
          <label className="ml-1 text-xs font-bold uppercase tracking-wider text-app-muted">
            Username or Email
          </label>
          <Input
            aria-label="Username or email"
            leadingIcon={<FontAwesomeIcon icon={faUser} />}
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        {/* Permission role */}
        <div className="flex flex-col gap-2">
          <label className="ml-1 text-xs font-bold uppercase tracking-wider text-app-muted">
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
                activeBgClass: "bg-app-surface",
                activeColorClass: "text-app-text",
              },
              {
                value: "EDITOR",
                label: "Editor",
                icon: <FontAwesomeIcon icon={faPen} />,
                activeBgClass: "bg-app-surface",
                activeColorClass: "text-app-text",
              },
            ]}
          />
          <p className="text-center text-xs text-app-muted">
            {role === "VIEWER"
              ? "Viewers can only read transactions and statistics."
              : "Editors can add, edit, and delete transactions."}
          </p>
        </div>
      </div>
    </Card>
  );
};
