import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEye,
  faPen,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../utils/types";
import { getUserAuth } from "../../utils/authHelper.ts";
import { Selector } from "../../components/ui/Selector.tsx";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface MemberRowProps {
  member: WalletMember;
  icon: IconDefinition;
  iconColor: string;
  canManage: boolean;
  onRemove: (id: string, name: string) => void;
  onChangeRole: (id: string, newRole: "EDITOR" | "VIEWER") => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  icon,
  iconColor,
  canManage,
  onRemove,
  onChangeRole,
}) => {
  const user = getUserAuth();
  const isCurrentUser = member.userId === user?.userId;

  const [selectedRole, setSelectedRole] = useState<"EDITOR" | "VIEWER">(
    member.role === "OWNER" ? "VIEWER" : member.role,
  );

  // Risincronizza il ruolo selezionato quando cambia quello salvato (senza effetto)
  const [prevRole, setPrevRole] = useState(member.role);
  if (prevRole !== member.role) {
    setPrevRole(member.role);
    setSelectedRole(member.role === "OWNER" ? "VIEWER" : member.role);
  }

  const hasRoleChanged = selectedRole !== member.role;

  return (
    <div className="flex items-center justify-between p-4 bg-app-input border border-app-border rounded-2xl transition-all hover:bg-app-surface group">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-surface text-lg shadow-sm"
          style={{ color: iconColor }}
        >
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-app-text truncate">
              {member.username}
            </span>
            {isCurrentUser && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-app-text/10 text-app-text">
                YOU
              </span>
            )}
            {member.status === "PENDING" && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider theme-bg-warning-light theme-text-warning">
                PENDING
              </span>
            )}
          </div>
          <span className="text-xs text-app-muted truncate">
            {member.email}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canManage && !isCurrentUser && member.role !== "OWNER" && (
          <>
            {member.status === "ACCEPTED" && (
              <div className="flex items-center gap-2">
                <Selector
                  value={selectedRole}
                  onChange={setSelectedRole}
                  size="sm"
                  fullWidth={false}
                  className="w-36"
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
                <button
                  onClick={() => onChangeRole(member.userId, selectedRole)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-app-green/10 text-app-green hover:bg-app-green hover:theme-text-inverse transition-colors ${
                    hasRoleChanged ? "" : "opacity-20 cursor-not-allowed"
                  }`}
                  disabled={!hasRoleChanged}
                  title="Save Role"
                >
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                </button>
              </div>
            )}

            <button
              onClick={() => onRemove(member.userId, member.username)}
              className="flex h-8 w-8 items-center justify-center rounded-lg theme-bg-danger-transparent theme-text-danger hover:theme-bg-danger hover:theme-text-default transition-colors opacity-0 group-hover:opacity-100"
              title={
                member.status === "PENDING" ? "Cancel Invite" : "Remove User"
              }
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
