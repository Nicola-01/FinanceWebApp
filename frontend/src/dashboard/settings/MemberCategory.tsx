import React from "react";
import { MemberRow } from "./MemberRow";
import type { WalletMember } from "../../utils/types";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface MemberCategoryProps {
  title: string;
  titleColor?: string;
  members: WalletMember[];
  icon: IconDefinition;
  iconColor: string;
  canManage: boolean;
  onRemove: (id: string, name: string) => void;
  onChangeRole: (id: string, newRole: "EDITOR" | "VIEWER") => void;
}

export const MemberCategory: React.FC<MemberCategoryProps> = ({
  title,
  titleColor = "text-app-muted",
  members,
  icon,
  iconColor,
  canManage,
  onRemove,
  onChangeRole,
}) => {
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4
        className={`text-[10px] font-bold uppercase tracking-widest ml-2 ${titleColor}`}
      >
        {title}
      </h4>
      {members.map((m) => (
        <MemberRow
          key={m.userId}
          member={m}
          icon={icon}
          iconColor={iconColor}
          canManage={canManage}
          onRemove={onRemove}
          onChangeRole={onChangeRole}
        />
      ))}
    </div>
  );
};
