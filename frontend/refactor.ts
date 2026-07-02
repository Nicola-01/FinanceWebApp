import { Project } from "ts-morph";
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.app.json",
});

const fileMoves: Record<string, string> = {
  // Components
  "src/components/AmountInput.tsx": "src/components/ui/AmountInput.tsx",
  "src/components/Collapse.tsx": "src/components/ui/Collapse.tsx",
  "src/components/FloatingActionButton.tsx":
    "src/components/ui/FloatingActionButton.tsx",
  "src/components/PWAPrompt.tsx": "src/components/ui/PWAPrompt.tsx",
  "src/components/TagBadge.tsx": "src/components/ui/TagBadge.tsx",
  "src/components/ToastNotification.tsx":
    "src/components/ui/ToastNotification.tsx",

  "src/components/ColorSelector.tsx":
    "src/components/selectors/ColorSelector.tsx",
  "src/components/CurrencySelector.tsx":
    "src/components/selectors/CurrencySelector.tsx",
  "src/components/ThemeSelector.tsx":
    "src/components/selectors/ThemeSelector.tsx",

  "src/components/Icon.tsx": "src/components/icon/Icon.tsx",
  "src/components/IconColorSelector.tsx":
    "src/components/icon/IconColorSelector.tsx",
  "src/components/IconPickerButton.tsx":
    "src/components/icon/IconPickerButton.tsx",
  "src/components/IconSelector.tsx": "src/components/icon/IconSelector.tsx",

  "src/components/PasswordRequirements.tsx":
    "src/components/auth/PasswordRequirements.tsx",

  "src/components/SettingsCard.tsx": "src/components/settings/SettingsCard.tsx",

  // Modals
  "src/modals/CreateWalletModal.tsx": "src/modals/wallet/CreateWalletModal.tsx",
  "src/modals/ShareWalletModal.tsx": "src/modals/wallet/ShareWalletModal.tsx",

  "src/modals/SubscriptionDetailsModal.tsx":
    "src/modals/subscription/SubscriptionDetailsModal.tsx",
  "src/modals/SubscriptionModal.tsx":
    "src/modals/subscription/SubscriptionModal.tsx",
  "src/modals/SubscriptionView.tsx":
    "src/modals/subscription/SubscriptionView.tsx",

  "src/modals/ChangePasswordModal.tsx":
    "src/modals/auth/ChangePasswordModal.tsx",
  "src/modals/LogoutModal.tsx": "src/modals/auth/LogoutModal.tsx",
  "src/modals/PasswordInput.tsx": "src/modals/auth/PasswordInput.tsx",
  "src/modals/ProfileModal.tsx": "src/modals/auth/ProfileModal.tsx",

  "src/modals/InvitationsModal.tsx":
    "src/modals/invitations/InvitationsModal.tsx",

  "src/modals/ModalDialog.tsx": "src/modals/common/ModalDialog.tsx",
  "src/modals/ModalDialogRightAction.tsx":
    "src/modals/common/ModalDialogRightAction.tsx",
  "src/modals/DeleteModal.tsx": "src/modals/common/DeleteModal.tsx",
  "src/modals/DeleteModalContext.tsx":
    "src/modals/common/DeleteModalContext.tsx",

  "src/modals/CreateTagModal.tsx": "src/modals/tags/CreateTagModal.tsx",

  "src/modals/DayDetailModal.tsx": "src/modals/day/DayDetailModal.tsx",

  "src/modals/AboutAppModal.tsx": "src/modals/app/AboutAppModal.tsx",

  "src/modals/PatModal.tsx": "src/modals/pat/PatModal.tsx",
};

console.log("Starting refactoring...");

let movedCount = 0;
for (const [oldPath, newPath] of Object.entries(fileMoves)) {
  const file = project.getSourceFile(oldPath);
  if (file) {
    console.log(`Moving ${oldPath} to ${newPath}`);
    // ensure directory exists
    const dirPath = path.dirname(newPath);
    project.createDirectory(dirPath);

    file.moveToDirectory(dirPath);
    movedCount++;
  } else {
    console.warn(`File not found: ${oldPath}`);
  }
}

if (movedCount > 0) {
  console.log("Saving changes...");
  project.saveSync();
  console.log("Refactoring completed successfully.");
} else {
  console.log("No files were moved.");
}
