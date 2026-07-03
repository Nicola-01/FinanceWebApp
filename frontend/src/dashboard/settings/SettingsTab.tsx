import React, { useState } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { IconPickerButton } from "../../components/icon/IconPickerButton.tsx";
import type { IconKey } from "../../utils/icons.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faGear,
  faSave,
  faSignOutAlt,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Wallet } from "../../utils/types";
import { ShareSettingsSection } from "./ShareSettingsSection.tsx";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { DataTab } from "./DataTab.tsx";

export const SettingsTab: React.FC = () => {
  const { wallet, handleUpdateWallet, onWalletDelete } = useWalletContext();
  const [isSaving, setIsSaving] = useState(false);

  const [editedWallet, setEditedWallet] = useState<Partial<Wallet>>({
    name: wallet.name,
    color: wallet.color,
    icon: wallet.icon,
  });
  const [showIconPicker, setShowIconPicker] = useState(false);

  const hasChanges =
    editedWallet.name !== wallet.name ||
    editedWallet.color !== wallet.color ||
    editedWallet.icon !== wallet.icon;

  const handleSave = async () => {
    if (!editedWallet.name?.trim()) return;
    setIsSaving(true);
    await handleUpdateWallet(editedWallet);
    setIsSaving(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-9xl flex-col gap-6 pb-6 animate-[fadeIn_0.3s_ease-out]">
      {/* GENERAL SETTINGS — identity (name / icon / colour); hidden for VIEWER */}
      {wallet.userRole !== "VIEWER" && (
        <Card
          title="General Settings"
          subtitle="Change your wallet's name, icon and colour"
          icon={faGear}
          iconColor={wallet.color}
          footerAlign="center"
          footer={
            <Button
              accentColor="var(--color-app-green)"
              ripple
              className="w-full sm:w-48"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || !editedWallet.name?.trim()}
            >
              <FontAwesomeIcon
                icon={isSaving ? faSpinner : faSave}
                spin={isSaving}
              />
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          }
        >
          <div className="flex flex-row items-end gap-3 sm:gap-4">
            {/* Icon & colour picker (behaviour preserved) */}
            <div className="flex shrink-0 flex-col gap-2">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-app-muted">
                Icon
              </label>
              <div className="self-start rounded-[var(--r-input)] border border-app-border bg-app-surface p-1">
                <IconPickerButton
                  icon={editedWallet.icon as IconKey}
                  color={editedWallet.color as string}
                  onIconChange={(icon: IconKey) =>
                    setEditedWallet({ ...editedWallet, icon })
                  }
                  onColorChange={(color: string) =>
                    setEditedWallet({ ...editedWallet, color })
                  }
                  isOpen={showIconPicker}
                  onToggle={setShowIconPicker}
                />
              </div>
            </div>

            {/* Wallet name */}
            <div className="flex flex-1 flex-col gap-2">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-app-muted">
                Wallet Name
              </label>
              <Input
                aria-label="Wallet name"
                value={editedWallet.name ?? ""}
                onChange={(e) =>
                  setEditedWallet({ ...editedWallet, name: e.target.value })
                }
                placeholder="e.g. Main Account, Savings, Crypto…"
              />
            </div>
          </div>
        </Card>
      )}

      {/* MEMBERS & SHARING */}
      <ShareSettingsSection />

      {/* DATA MANAGEMENT */}
      <DataTab />

      {/* DANGER ZONE — Delete (OWNER) / Quit (EDITOR · VIEWER) */}
      {wallet.userRole === "OWNER" ? (
        <Card
          tone="danger"
          title="Danger Zone"
          subtitle="Permanently delete this wallet and all its transactions, tags, and history. This cannot be undone."
          icon={faExclamationTriangle}
          footerAlign="center"
          footer={
            <Button
              variant="danger"
              ripple
              className="w-full sm:w-48"
              onClick={onWalletDelete}
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete Wallet
            </Button>
          }
        />
      ) : (
        <Card
          tone="danger"
          title="Danger Zone"
          subtitle="Remove your access to this wallet. You'll need the owner to invite you again to return."
          icon={faSignOutAlt}
          footer={
            <Button
              variant="danger"
              ripple
              className="w-full sm:w-48"
              onClick={onWalletDelete}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Quit Wallet
            </Button>
          }
        />
      )}
    </div>
  );
};
