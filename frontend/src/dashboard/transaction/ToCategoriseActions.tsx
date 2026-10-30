import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../types/domain.ts";
import * as walletOps from "../../api/walletOps.ts";
import Button from "../../components/ui/Button.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import { TagPicker } from "../../modals/transaction/TagPicker.tsx";
import { categoriseTransaction } from "./categoriseTransaction.ts";
import { useDeleteModal } from "../../modals/common/DeleteModalContext";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { suggestTagName } from "../wallet/toCategorize.ts";

/** Inline category picker + delete for a bank import still on the "To categorise" placeholder. */
export const ToCategoriseActions: React.FC<{ transaction: Transaction }> = ({
  transaction: tx,
}) => {
  const { wallet, tags, transactions, fetchData } = useWalletContext();
  const deleteModalRef = useDeleteModal();
  if (wallet.userRole === "VIEWER") return null;
  const suggested = suggestTagName(tx, transactions);

  const changeTag = async (tagName: string) => {
    if (await categoriseTransaction(wallet, tx, tagName)) fetchData();
  };

  const remove = () =>
    deleteModalRef.current?.deleteObject(
      tx,
      "transaction",
      async () => {
        try {
          await walletOps.deleteTransaction(
            wallet.id,
            tx.id,
            tx.updatedAt ?? null,
          );
          fetchData();
        } catch (err: unknown) {
          triggerToast(
            getApiErrorTitle(err, "Error deleting transaction"),
            false,
          );
        }
      },
      0,
    );

  return (
    // The row opens the details modal on click; these controls must not.
    <div
      className="flex w-full items-center gap-1 sm:w-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
        <TagPicker
          tags={tags}
          showLabel={false}
          selectedTagName={suggested}
          onSelectTag={changeTag}
          // The inline trigger is narrow: widen the dropdown, growing leftwards inside the row.
          dropdownClassName="right-0 mt-1 w-full min-w-80"
        />
      </div>
      {suggested && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => changeTag(suggested)}
          aria-label={`Confirm ${suggested} for ${tx.name}`}
        >
          <FontAwesomeIcon icon={faCheck} />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={remove}
        aria-label={`Delete ${tx.name}`}
      >
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </div>
  );
};
