import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faPlus,
  faShieldAlt,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";
import Button from "../../components/ui/Button";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import api from "../../api/axiosConfig";
import type {
  Wallet,
  PatToken,
  WalletPermState,
  ModalView,
} from "../../utils/types";
import { PatListView } from "./PatListView";
import { PatFormView } from "./PatFormView";
import { PatShowTokenView } from "./PatShowTokenView";
import { getApiErrorDetail } from "../../utils/apiError";

export interface PatModalHandle {
  openModal: () => void;
}

export const PatModal = forwardRef<PatModalHandle>((_props, ref) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Navigation state
  const [view, setView] = useState<ModalView>("list");

  // List view
  const [tokens, setTokens] = useState<PatToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Form view (create/edit)
  const [tokenIdToEdit, setTokenIdToEdit] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show-once view
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Revocation loading state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Wallet lookup map (id → Wallet) for resolving names in the list view
  const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});

  // ─── Imperative handle ────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    openModal: () => {
      setView("list");
      setGeneratedToken("");
      setCopied(false);
      dialogRef.current?.showModal();
      fetchTokens();
      fetchWalletsMap();
    },
  }));

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await api.get("/tokens");
      setTokens(res.data);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to load tokens"), false);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchWalletsMap = async () => {
    try {
      const wRes = await api.get("/wallets");
      const fetched: Wallet[] = wRes.data;
      const map: Record<string, Wallet> = {};
      fetched.forEach((w) => {
        map[w.id] = w;
      });
      setWalletsMap(map);
    } catch {
      /* silently ignore */
    }
  };

  const prepareWalletsForForm = async (existingToken?: PatToken) => {
    try {
      const wRes = await api.get("/wallets");
      const fetchedWallets: Wallet[] = wRes.data;

      setWalletPerms(
        fetchedWallets.map((w) => {
          const existingPerm = existingToken?.walletPermissions.find(
            (wp) => wp.walletId === w.id,
          );
          return {
            walletId: w.id,
            walletName: w.name,
            walletIcon: w.icon,
            walletColor: w.color,
            userRole: w.userRole,
            enabled: !!existingPerm,
            read: true,
            write: existingPerm
              ? existingPerm.permissions.includes("WRITE")
              : false,
          };
        }),
      );
    } catch {
      triggerToast("Failed to load wallets", false);
    }
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!tokenName.trim()) {
      triggerToast("Please enter a token name", false);
      return;
    }

    const selectedWallets = walletPerms.filter((w) => w.enabled);
    if (selectedWallets.length === 0) {
      triggerToast("Select at least one wallet", false);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: tokenName.trim(), // name is ignored on backend for update, but passed anyway
        walletPermissions: selectedWallets.map((w) => ({
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
        setView("list");
        fetchTokens();
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

  const handleRevoke = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await api.delete(`/tokens/${tokenId}`);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      triggerToast("Token revoked", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to revoke token"), false);
    } finally {
      setRevokingId(null);
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

  const goToCreate = () => {
    setTokenIdToEdit(null);
    setTokenName("");
    setWalletPerms([]);
    prepareWalletsForForm();
    setView("create");
  };

  const goToEdit = (token: PatToken) => {
    setTokenIdToEdit(token.id);
    setTokenName(token.name);
    setWalletPerms([]);
    prepareWalletsForForm(token);
    setView("edit");
  };

  const setPermission = (
    walletId: string,
    level: "none" | "read" | "write",
  ) => {
    setWalletPerms((prev) =>
      prev.map((w) =>
        w.walletId === walletId
          ? {
              ...w,
              enabled: level !== "none",
              read: level !== "none",
              write: level === "write",
            }
          : w,
      ),
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const renderTitle = () => {
    if (view === "list")
      return (
        <>
          <FontAwesomeIcon icon={faCode} className="text-app-purple" /> API
          Tokens
        </>
      );
    if (view === "create")
      return (
        <>
          <FontAwesomeIcon icon={faPlus} className="text-app-green" /> New Token
        </>
      );
    if (view === "edit")
      return (
        <>
          <FontAwesomeIcon icon={faPen} className="text-app-yellow" /> Edit
          Permissions
        </>
      );
    return (
      <>
        <FontAwesomeIcon icon={faShieldAlt} className="text-app-yellow" /> Token
        Created
      </>
    );
  };

  // Only the list view keeps a header action (＋ New token); create/edit use the
  // footer CTA below instead of a tiny header checkmark.
  const renderRightActions = () => {
    if (view === "list") {
      return [
        {
          icon: <FontAwesomeIcon icon={faPlus} className="text-xl" />,
          onClick: goToCreate,
          hoverColor: "hover:text-app-green",
        },
      ];
    }
    return undefined;
  };

  const renderFooter = () => {
    if (view !== "create" && view !== "edit") return undefined;
    const disabled =
      isSubmitting ||
      !tokenName.trim() ||
      walletPerms.filter((w) => w.enabled).length === 0;
    return (
      <Button
        variant="primary"
        fullWidth
        ripple
        onClick={handleSubmit}
        disabled={disabled}
      >
        {isSubmitting
          ? view === "edit"
            ? "Saving…"
            : "Generating…"
          : view === "edit"
            ? "Save Changes"
            : "Generate Token"}
      </Button>
    );
  };

  const handleCloseClick = () => {
    if (view === "create" || view === "edit") {
      setView("list");
    } else if (view === "showToken") {
      setView("list");
      fetchTokens();
    } else {
      dialogRef.current?.close();
    }
  };

  return (
    <ModalDialog
      ref={dialogRef}
      className="max-w-[560px]"
      title={renderTitle()}
      rightActions={renderRightActions()}
      footer={renderFooter()}
      onCloseClick={handleCloseClick}
      showClose={true}
    >
      {view === "list" && (
        <PatListView
          loadingTokens={loadingTokens}
          tokens={tokens}
          walletsMap={walletsMap}
          revokingId={revokingId}
          onRevoke={handleRevoke}
          onCreate={goToCreate}
          onEdit={goToEdit}
        />
      )}

      {(view === "create" || view === "edit") && (
        <PatFormView
          isEdit={view === "edit"}
          tokenName={tokenName}
          setTokenName={setTokenName}
          walletPerms={walletPerms}
          setPermission={setPermission}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hideSubmit
        />
      )}

      {view === "showToken" && (
        <PatShowTokenView
          generatedToken={generatedToken}
          copied={copied}
          onCopy={handleCopy}
          onDone={() => {
            setView("list");
            fetchTokens();
          }}
        />
      )}
    </ModalDialog>
  );
});
