import { useRef, useState } from "react";
import api from "../../api/axiosConfig";
import type { Wallet, PatToken, WalletPermState } from "../../types/domain";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";
import type { DialogView } from "./tokenHelpers";
import { applyPermissionLevel } from "../../modals/pat/walletPerms";

/**
 * Create / edit / show-once dialog state for a PAT. `onSaved` refreshes the
 * token list after an edit, or when the show-once view is closed.
 */
export function useTokenDialog(onSaved: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [view, setView] = useState<DialogView>("create");
  const [tokenIdToEdit, setTokenIdToEdit] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);

  const prepareWalletsForForm = async (existing?: PatToken) => {
    try {
      const wRes = await api.get("/wallets");
      const fetched: Wallet[] = wRes.data;
      setWalletPerms(
        fetched.map((w) => {
          const perm = existing?.walletPermissions.find(
            (wp) => wp.walletId === w.id,
          );
          return {
            walletId: w.id,
            walletName: w.name,
            walletIcon: w.icon,
            walletColor: w.color,
            userRole: w.userRole,
            enabled: !!perm,
            read: true,
            write: perm ? perm.permissions.includes("WRITE") : false,
          };
        }),
      );
    } catch {
      triggerToast("Failed to load wallets", false);
    }
  };

  const openCreate = () => {
    setTokenIdToEdit(null);
    setTokenName("");
    setWalletPerms([]);
    setGeneratedToken("");
    setCopied(false);
    setView("create");
    prepareWalletsForForm();
    dialogRef.current?.showModal();
  };

  const openEdit = (token: PatToken) => {
    setTokenIdToEdit(token.id);
    setTokenName(token.name);
    setWalletPerms([]);
    setView("edit");
    prepareWalletsForForm(token);
    dialogRef.current?.showModal();
  };

  const setPermission = (
    walletId: string,
    level: "none" | "read" | "write",
  ) => {
    setWalletPerms((prev) => applyPermissionLevel(prev, walletId, level));
  };

  const handleSubmit = async () => {
    if (!tokenName.trim()) {
      triggerToast("Please enter a token name", false);
      return;
    }
    const selected = walletPerms.filter((w) => w.enabled);
    if (selected.length === 0) {
      triggerToast("Select at least one wallet", false);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: tokenName.trim(),
        walletPermissions: selected.map((w) => ({
          walletId: w.walletId,
          permissions: [
            ...(w.read ? ["READ"] : []),
            ...(w.write ? ["WRITE"] : []),
          ],
        })),
      };
      if (view === "edit" && tokenIdToEdit) {
        await api.put(`/tokens/${tokenIdToEdit}`, payload);
        triggerToast("Token permissions updated!", true);
        dialogRef.current?.close();
        onSaved();
      } else {
        const res = await api.post("/tokens", payload);
        setGeneratedToken(res.data.plainToken);
        setCopied(false);
        setView("showToken");
        triggerToast("Token created successfully!", true);
      }
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to save token"), false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      triggerToast("Token copied to clipboard!", true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      triggerToast("Failed to copy", false);
    }
  };

  const handleCloseClick = () => {
    dialogRef.current?.close();
    if (view === "showToken") onSaved();
  };

  return {
    dialogRef,
    view,
    tokenName,
    setTokenName,
    walletPerms,
    isSubmitting,
    generatedToken,
    copied,
    openCreate,
    openEdit,
    setPermission,
    handleSubmit,
    handleCopy,
    handleCloseClick,
  };
}
