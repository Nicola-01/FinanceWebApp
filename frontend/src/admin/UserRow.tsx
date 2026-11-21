import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Toggle from "../components/ui/Toggle.tsx";
import Button from "../components/ui/Button";
import { useUiVersion } from "../hooks/useUiVersion";
import type { User } from "../types/domain.ts";

interface UserRowProps {
  user: User;
  onDelete: (user: User) => void;
  onToggleOpenBanking: (user: User, enabled: boolean) => void;
}

// Format the join date as "25 Oct 2023"
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const UserRow: React.FC<UserRowProps> = ({
  user,
  onDelete,
  onToggleOpenBanking,
}) => {
  const [ui] = useUiVersion();

  if (ui === "v2") {
    // ui-v2-switch: desktop table row (same columns as v1, shared controls).
    return (
      <tr className="border-b border-app-border transition-colors last:border-0 hover:bg-app-hover/50">
        <td className="px-4 py-3 font-semibold text-app-text">{user.name}</td>
        <td className="px-4 py-3 text-[13px] tabular-nums text-app-muted">
          {formatDate(user.createdAt)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-app-text">
          {user.wallets ?? 0}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-app-text">
          {user.transactions ?? 0}
        </td>
        <td className="px-4 py-3">
          <Toggle
            size="sm"
            checked={!!user.openBankingEnabled}
            onChange={(next) => onToggleOpenBanking(user, next)}
            aria-label={`Open Banking for ${user.name}`}
          />
        </td>
        <td className="px-4 py-3 text-right">
          <Button
            variant="ghost"
            size="icon"
            title="Delete User"
            aria-label={`Delete ${user.name}`}
            onClick={() => onDelete(user)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="animate-[fadeIn_0.3s_ease-out] border-b border-app-border transition-colors duration-200 hover:bg-app-hover/50">
      <td className="p-4.5 font-bold text-app-text"> {user.name} </td>
      <td className="p-4.5 font-app-mono text-[0.9rem] text-app-muted">
        {formatDate(user.createdAt)}
      </td>
      <td className="p-4.5 font-app-mono text-app-text"> {user.wallets} </td>
      <td className="p-4.5 font-app-mono text-app-text">
        {" "}
        {user.transactions}{" "}
      </td>
      <td className="p-4.5">
        <Toggle
          checked={!!user.openBankingEnabled}
          onChange={(next) => onToggleOpenBanking(user, next)}
          aria-label={`Open Banking for ${user.name}`}
        />
      </td>
      <td className="p-4.5">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-all duration-200 hover:bg-app-red/10 hover:text-app-red"
          onClick={() => onDelete(user)}
          title="Delete User"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </td>
    </tr>
  );
};

/** ui-v2-switch: phone list row for the user directory (same actions as the table row). */
export const UserListItem: React.FC<UserRowProps> = ({
  user,
  onDelete,
  onToggleOpenBanking,
}) => (
  <li className="flex min-h-14 items-center gap-3 px-4 py-3">
    <div className="min-w-0 flex-1">
      <div className="truncate text-[14px] font-semibold text-app-text">
        {user.name}
      </div>
      <div className="text-[13px] tabular-nums text-app-muted">
        {formatDate(user.createdAt)} · {user.wallets ?? 0} wallets ·{" "}
        {user.transactions ?? 0} transactions
      </div>
    </div>
    <Toggle
      size="sm"
      checked={!!user.openBankingEnabled}
      onChange={(next) => onToggleOpenBanking(user, next)}
      aria-label={`Open Banking for ${user.name}`}
    />
    <Button
      variant="ghost"
      size="icon"
      title="Delete User"
      aria-label={`Delete ${user.name}`}
      onClick={() => onDelete(user)}
    >
      <FontAwesomeIcon icon={faTrash} />
    </Button>
  </li>
);

export default UserRow;
