import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCheck } from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../types/domain";
import { getUserAuth } from "../../utils/authHelper.ts";
import { RoleSelector } from "../../components/ui/RoleSelector.tsx";
import Button from "../../components/ui/Button.tsx";
import { Badge } from "../../components/ui/Badge.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

const ROLE_LABEL = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" };
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

  // Re-sync the selected role when the saved role changes (no effect needed).
  const [prevRole, setPrevRole] = useState(member.role);
  if (prevRole !== member.role) {
    setPrevRole(member.role);
    setSelectedRole(member.role === "OWNER" ? "VIEWER" : member.role);
  }

  const hasRoleChanged = selectedRole !== member.role;

  const [ui] = useUiVersion();
  // ui-v2-switch: avatar row with the role on the right; hairline separators.
  if (ui === "v2") {
    const canRemove = canManage && !isCurrentUser && member.role !== "OWNER";
    const canEditRole = canRemove && member.status === "ACCEPTED";
    return (
      <div className="group grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 border-t border-app-border py-2.5">
        <span
          aria-hidden="true"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-app-raised text-[13px] font-semibold text-app-text"
        >
          {member.username.charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-app-text">
              {member.username}
            </span>
            {isCurrentUser && (
              <Badge shape="square" tone="neutral">
                You
              </Badge>
            )}
            {member.status === "PENDING" && (
              <Badge shape="square" tone="yellow">
                Pending
              </Badge>
            )}
          </div>
          <span className="truncate text-[13px] text-app-muted">
            {member.email}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canEditRole ? (
            <>
              <RoleSelector
                value={selectedRole}
                onChange={setSelectedRole}
                size="sm"
                fullWidth={false}
                className="w-36"
              />
              <Button
                size="icon"
                variant="primary"
                onClick={() => onChangeRole(member.userId, selectedRole)}
                disabled={!hasRoleChanged}
                title="Save role"
                aria-label="Save role"
              >
                <FontAwesomeIcon icon={faCheck} className="text-sm" />
              </Button>
            </>
          ) : (
            <Badge shape="square" tone="neutral">
              {ROLE_LABEL[member.role]}
            </Badge>
          )}
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(member.userId, member.username)}
              title={
                member.status === "PENDING" ? "Cancel invite" : "Remove user"
              }
              aria-label={
                member.status === "PENDING" ? "Cancel invite" : "Remove user"
              }
              className="hover:text-app-danger!"
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-3 transition-colors hover:bg-app-hover">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-card text-lg shadow-sm"
          style={{ color: iconColor }}
        >
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-app-text">
              {member.username}
            </span>
            {isCurrentUser && (
              <span className="rounded bg-app-text/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-app-text">
                You
              </span>
            )}
            {member.status === "PENDING" && (
              <span className="rounded bg-app-yellow/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-app-yellow">
                Pending
              </span>
            )}
          </div>
          <span className="truncate text-xs text-app-muted">
            {member.email}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canManage && !isCurrentUser && member.role !== "OWNER" && (
          <>
            {member.status === "ACCEPTED" && (
              <div className="flex items-center gap-2">
                <RoleSelector
                  value={selectedRole}
                  onChange={setSelectedRole}
                  size="sm"
                  fullWidth={false}
                  className="w-36"
                />
                <button
                  onClick={() => onChangeRole(member.userId, selectedRole)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-app-green/10 text-app-green transition-colors hover:bg-app-green hover:text-white ${
                    hasRoleChanged ? "" : "cursor-not-allowed opacity-20"
                  }`}
                  disabled={!hasRoleChanged}
                  title="Save role"
                >
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                </button>
              </div>
            )}

            <button
              onClick={() => onRemove(member.userId, member.username)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover:opacity-100"
              title={
                member.status === "PENDING" ? "Cancel invite" : "Remove user"
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
