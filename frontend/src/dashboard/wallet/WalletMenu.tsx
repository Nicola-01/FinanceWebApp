import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faPenToSquare,
  faRotateRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { useWalletContext } from "./WalletContext.tsx";
import { Menu } from "../../components/ui/Menu.tsx";

export const WalletMenu: React.FC = () => {
  const { isLoading, fetchData, setActiveTab, onWalletDelete } =
    useWalletContext();
  const onRefresh = () => fetchData();

  return (
    <Menu align="right" width={192}>
      <Menu.Trigger>
        {({ open, toggle }) => (
          <button
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="menu"
            title="Wallet Options"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
              open
                ? "border-app-border bg-app-surface text-app-text"
                : "border-app-border bg-app-input text-app-muted hover:bg-app-surface hover:text-app-text"
            }`}
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="text-lg" />
          </button>
        )}
      </Menu.Trigger>

      <Menu.Content>
        <Menu.Item
          icon={faRotateRight}
          iconClassName={isLoading ? "animate-spin text-app-green" : ""}
          disabled={isLoading}
          onClick={onRefresh}
        >
          Refresh Data
        </Menu.Item>

        <Menu.Item
          icon={faPenToSquare}
          tone="warning"
          onClick={() => setActiveTab("settings")}
        >
          Edit Wallet
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item icon={faTrash} tone="danger" onClick={onWalletDelete}>
          Delete Wallet
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
};
