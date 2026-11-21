import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortDown,
  faSortUp,
} from "@fortawesome/free-solid-svg-icons";
import UserRow, { UserListItem } from "./UserRow";
import SearchInput from "../components/ui/SearchInput";
import { Card } from "../components/ui/Card";
import { useUiVersion } from "../hooks/useUiVersion";
import type { User } from "../types/domain.ts";

type SortConfig = {
  key: keyof User;
  direction: "ascending" | "descending";
} | null;

interface UserDirectoryProps {
  users: User[];
  onDeleteClick: (user: User) => void; // Triggered when the trash icon is clicked
  onToggleOpenBanking: (user: User, enabled: boolean) => void;
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({
  users,
  onDeleteClick,
  onToggleOpenBanking,
}) => {
  const [ui] = useUiVersion();
  // Local state for searching and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Sorting logic handler
  const requestSort = (key: keyof User) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort the users memoized
  const processedUsers = useMemo(() => {
    let sortableUsers = [...users];

    if (searchTerm) {
      sortableUsers = sortableUsers.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      sortableUsers.sort((a, b) => {
        const valA =
          a[key] ?? (key === "wallets" || key === "transactions" ? 0 : "");
        const valB =
          b[key] ?? (key === "wallets" || key === "transactions" ? 0 : "");
        if (valA < valB) return direction === "ascending" ? -1 : 1;
        if (valA > valB) return direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig, searchTerm]);

  // Helper for table headers icon
  const getSortIcon = (name: keyof User) =>
    !sortConfig || sortConfig.key !== name
      ? faSort
      : sortConfig.direction === "ascending"
        ? faSortUp
        : faSortDown;

  const headerCellClass =
    "sticky top-0 z-10 cursor-pointer border-b border-app-border bg-app-card p-[18px] font-semibold text-app-muted transition-colors hover:text-app-text";

  if (ui === "v2") {
    // ui-v2-switch: card with a sticky-header table (desktop) or divide-y rows (phone).
    const sortTh = (label: string, key: keyof User, align = "") => (
      <th
        scope="col"
        className={`sticky top-0 z-10 border-b border-app-border bg-app-card px-4 py-3 text-[13px] font-medium text-app-muted ${align}`}
      >
        <button
          type="button"
          onClick={() => requestSort(key)}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-app-text"
        >
          {label}
          <FontAwesomeIcon icon={getSortIcon(key)} className="opacity-70" />
        </button>
      </th>
    );
    return (
      <Card padding="none">
        <div className="flex flex-wrap items-center justify-between gap-3.5 px-5 pt-5 sm:px-6 sm:pt-6">
          <h3 className="m-0 font-display text-lg font-semibold tracking-[-0.02em] text-app-text">
            Users
          </h3>
          <div className="w-full sm:w-[300px]">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name…"
            />
          </div>
        </div>

        {processedUsers.length === 0 ? (
          <p className="px-5 pb-5 text-center text-[13px] text-app-muted sm:px-6">
            No users found.
          </p>
        ) : (
          <>
            <div className="hidden max-h-[560px] overflow-auto lg:block">
              <table className="w-full border-collapse text-left text-[14px]">
                <thead>
                  <tr>
                    {sortTh("User", "name")}
                    {sortTh("Joined", "createdAt")}
                    {sortTh("Wallets", "wallets", "text-right")}
                    {sortTh("Transactions", "transactions", "text-right")}
                    <th
                      scope="col"
                      className="sticky top-0 z-10 border-b border-app-border bg-app-card px-4 py-3 text-[13px] font-medium text-app-muted"
                    >
                      Open Banking
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 z-10 border-b border-app-border bg-app-card px-4 py-3 text-right text-[13px] font-medium text-app-muted"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onDelete={onDeleteClick}
                      onToggleOpenBanking={onToggleOpenBanking}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-app-border border-t border-app-border lg:hidden">
              {processedUsers.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onDelete={onDeleteClick}
                  onToggleOpenBanking={onToggleOpenBanking}
                />
              ))}
            </ul>
          </>
        )}
      </Card>
    );
  }

  return (
    <Card padding="md">
      {/* Header & Search Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-[15px]">
        <h4 className="m-0 text-[1.05rem] font-semibold text-app-text">
          User Directory
        </h4>
        <div className="w-full sm:w-[300px]">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name..."
          />
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="max-h-[600px] overflow-y-auto rounded-[var(--r-input)] border border-app-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th
                className={headerCellClass}
                onClick={() => requestSort("name")}
              >
                User{" "}
                <FontAwesomeIcon
                  icon={getSortIcon("name")}
                  className="ml-1 opacity-70"
                />
              </th>
              <th
                className={headerCellClass}
                onClick={() => requestSort("createdAt")}
              >
                Joined{" "}
                <FontAwesomeIcon
                  icon={getSortIcon("createdAt")}
                  className="ml-1 opacity-70"
                />
              </th>
              <th
                className={headerCellClass}
                onClick={() => requestSort("wallets")}
              >
                Wallets{" "}
                <FontAwesomeIcon
                  icon={getSortIcon("wallets")}
                  className="ml-1 opacity-70"
                />
              </th>
              <th
                className={headerCellClass}
                onClick={() => requestSort("transactions")}
              >
                Transactions{" "}
                <FontAwesomeIcon
                  icon={getSortIcon("transactions")}
                  className="ml-1 opacity-70"
                />
              </th>
              <th className="sticky top-0 z-10 border-b border-app-border bg-app-card p-[18px] font-semibold text-app-muted">
                Open Banking
              </th>
              <th className="sticky top-0 z-10 border-b border-app-border bg-app-card p-[18px] font-semibold text-app-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {processedUsers.length > 0 ? (
              processedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onDelete={onDeleteClick}
                  onToggleOpenBanking={onToggleOpenBanking}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-5 text-center text-app-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
