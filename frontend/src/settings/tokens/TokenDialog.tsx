import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faShieldAlt, faPen } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import { ModalDialog } from "../../modals/common/ModalDialog";
import { PatFormView } from "../../modals/pat/PatFormView";
import { PatShowTokenView } from "../../modals/pat/PatShowTokenView";
import type { useTokenDialog } from "./useTokenDialog";
import { useUiVersion } from "../../hooks/useUiVersion";

/** Create / edit / show-once dialog. */
export const TokenDialog: React.FC<{
  dialog: ReturnType<typeof useTokenDialog>;
}> = ({ dialog }) => {
  const [ui] = useUiVersion(); // ui-v2-switch
  const isV2 = ui === "v2";
  const {
    dialogRef,
    view,
    tokenName,
    setTokenName,
    walletPerms,
    isSubmitting,
    generatedToken,
    copied,
    setPermission,
    handleSubmit,
    handleCopy,
    handleCloseClick,
  } = dialog;

  const dialogTitle =
    view === "create" ? (
      <>
        <FontAwesomeIcon
          icon={faPlus}
          className={isV2 ? "text-app-income" : "text-app-green"}
        />{" "}
        New token
      </>
    ) : view === "edit" ? (
      <>
        <FontAwesomeIcon
          icon={faPen}
          className={isV2 ? "text-app-warn" : "text-app-yellow"}
        />{" "}
        Edit permissions
      </>
    ) : (
      <>
        <FontAwesomeIcon
          icon={faShieldAlt}
          className={isV2 ? "text-app-warn" : "text-app-yellow"}
        />{" "}
        Token created
      </>
    );

  const submitDisabled =
    isSubmitting ||
    !tokenName.trim() ||
    walletPerms.filter((w) => w.enabled).length === 0;

  const dialogFooter =
    view === "create" || view === "edit" ? (
      <Button
        variant="primary"
        fullWidth
        ripple
        onClick={handleSubmit}
        disabled={submitDisabled}
      >
        {isSubmitting
          ? view === "edit"
            ? "Saving…"
            : "Generating…"
          : view === "edit"
            ? "Save changes"
            : "Generate token"}
      </Button>
    ) : undefined;

  return (
    <ModalDialog
      ref={dialogRef}
      className="max-w-[560px]"
      title={dialogTitle}
      footer={dialogFooter}
      onCloseClick={handleCloseClick}
      showClose={true}
    >
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
          onDone={handleCloseClick}
        />
      )}
    </ModalDialog>
  );
};
