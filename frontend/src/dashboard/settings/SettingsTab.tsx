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
import type { Wallet } from "../../types/domain";
import { ShareSettingsSection } from "./ShareSettingsSection.tsx";
import Button from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { WalletHeroCard } from "../../components/ui/WalletHeroCard.tsx";
import { DataTab } from "./DataTab.tsx";
import { WalletNotificationsCard } from "./WalletNotificationsCard.tsx";
import { SettingsBox } from "./SettingsBox.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import {
  CURRENCY_META,
  getCurrencySymbol,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";

export const SettingsTab: React.FC = () => {
  const { wallet, handleUpdateWallet, onWalletDelete } = useWalletContext();
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
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

  const captionClass = isV2
    ? "text-[13px] text-app-muted"
    : "ml-1 text-xs font-bold uppercase tracking-wider text-app-muted";

  // Icon & colour picker (behaviour preserved)
  const iconField = (
    <div className="flex shrink-0 flex-col gap-2">
      <label className={captionClass}>Icon</label>
      <div
        className={
          isV2 // ui-v2-switch
            ? "self-start rounded-[var(--r-input)] bg-app-raised p-1"
            : "self-start rounded-[var(--r-input)] border border-app-border bg-app-surface p-1"
        }
      >
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
  );

  const nameField = (
    <div className="flex flex-1 flex-col gap-2">
      <label className={captionClass}>
        {isV2 ? "Wallet name" : "Wallet Name"}
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
  );

  const currencyMeta = CURRENCY_META[wallet.currency as CurrencyCode];

  return (
    <div
      className={`mx-auto flex w-full max-w-9xl flex-col pb-6 animate-[fadeIn_0.3s_ease-out] ${
        isV2 ? "gap-3.5" : "gap-6"
      }`}
    >
      {/* GENERAL SETTINGS — identity (name / icon / colour); hidden for VIEWER */}
      {wallet.userRole !== "VIEWER" && (
        <SettingsBox
          title={isV2 ? "General" : "General Settings"}
          description="Change your wallet's name, icon and colour"
          icon={faGear}
          iconColor={wallet.color}
          footerAlign="center"
          footer={
            <Button
              accentColor={isV2 ? undefined : "var(--color-app-green)"}
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
          {isV2 ? ( // ui-v2-switch
            <div className="flex flex-col gap-4">
              <WalletHeroCard
                compact
                name={editedWallet.name}
                color={editedWallet.color ?? wallet.color}
                icon={editedWallet.icon}
                label="Preview"
                value={0}
                currency={getCurrencySymbol(wallet.currency)}
              />
              <div className="flex flex-row items-end gap-3">
                {iconField}
                {nameField}
              </div>
              <div className="flex flex-col gap-2">
                <label className={captionClass}>Currency</label>
                <Input
                  readOnly
                  aria-label="Currency"
                  value={
                    currencyMeta
                      ? `${currencyMeta.name} (${wallet.currency})`
                      : wallet.currency
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-row items-end gap-3 sm:gap-4">
              {iconField}
              {nameField}
            </div>
          )}
        </SettingsBox>
      )}

      {/* MEMBERS & SHARING */}
      <ShareSettingsSection />

      {/* NOTIFICATIONS — the caller's own per-wallet preferences */}
      <WalletNotificationsCard />

      {/* DATA MANAGEMENT */}
      <DataTab />

      {/* DANGER ZONE — Delete (OWNER) / Quit (EDITOR · VIEWER) */}
      {wallet.userRole === "OWNER" ? (
        <SettingsBox
          tone="danger"
          title={isV2 ? "Danger zone" : "Danger Zone"}
          description="Permanently delete this wallet and all its transactions, tags, and history. This cannot be undone."
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
              {isV2 ? `Delete ${wallet.name}` : "Delete Wallet"}
            </Button>
          }
        />
      ) : (
        <SettingsBox
          tone="danger"
          title={isV2 ? "Danger zone" : "Danger Zone"}
          description="Remove your access to this wallet. You'll need the owner to invite you again to return."
          icon={faSignOutAlt}
          footer={
            <Button
              variant="danger"
              ripple
              className="w-full sm:w-48"
              onClick={onWalletDelete}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              {isV2 ? `Quit ${wallet.name}` : "Quit Wallet"}
            </Button>
          }
        />
      )}
    </div>
  );
};
