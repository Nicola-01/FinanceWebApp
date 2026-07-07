import React, { useState } from "react";
import { InviteComposer } from "../../components/ui/InviteComposer";
import type { WalletRole } from "../../components/ui/RoleSelector";

interface InviteSectionProps {
  walletColor: string;
  onInvite: (identifier: string, role: WalletRole) => Promise<boolean>;
}

/**
 * Wallet settings › Members invite box. Thin wrapper over the shared
 * {@link InviteComposer}: owns the identifier/role state and fires the invite
 * to the server, clearing the field only on success.
 */
export const InviteSection: React.FC<InviteSectionProps> = ({
  walletColor,
  onInvite,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<WalletRole>("VIEWER");
  const [isInviting, setIsInviting] = useState(false);

  const disabled = isInviting || identifier.trim().length < 3;

  const handleSubmit = async () => {
    if (disabled) return;
    setIsInviting(true);
    const success = await onInvite(identifier, role);
    if (success) setIdentifier("");
    setIsInviting(false);
  };

  return (
    <InviteComposer
      identifier={identifier}
      onIdentifierChange={setIdentifier}
      role={role}
      onRoleChange={setRole}
      onSubmit={handleSubmit}
      disabled={disabled}
      busy={isInviting}
      accentColor={walletColor}
    />
  );
};
