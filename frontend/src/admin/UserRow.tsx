import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { User } from "../utils/types.ts";

interface UserRowProps {
  user: User;
  onDelete: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onDelete }) => {
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

export default UserRow;
