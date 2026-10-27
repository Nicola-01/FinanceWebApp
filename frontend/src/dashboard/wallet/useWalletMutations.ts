import type React from "react";
import type { Tag, Wallet } from "../../types/domain";
import * as walletOps from "../../api/walletOps";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import { invalidate } from "../../api/walletDataCache";

interface WalletMutationsArgs {
  wallet: Wallet;
  tags: Tag[];
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  onWalletUpdate: () => void;
}

/**
 * Tag CRUD + wallet update handlers. Online results are applied to the served
 * state; offline (queued) writes are left to the pending-ops overlay.
 */
export function useWalletMutations({
  wallet,
  tags,
  setWallet,
  setTags,
  onWalletUpdate,
}: WalletMutationsArgs) {
  const handleAddTag = async (newTag: Partial<Tag>): Promise<boolean> => {
    try {
      const res = await walletOps.createTag(
        wallet.id,
        newTag as Record<string, unknown>,
      );
      // Offline: the overlay renders the queued create (SYNC_QUEUE_CHANGED →
      // pendingOps), so skip the local mutation and flag it as saved offline.
      if (!res.queued) {
        setTags((prev) => [...prev, res.data as Tag]);
      }
      invalidate(wallet.id);
      triggerToast(
        res.queued
          ? "Saved offline — will sync when you're back online"
          : "Tag created successfully!",
        true,
      );
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error creating tag"), false);
      return false;
    }
  };

  const handleUpdateTag = async (
    oldName: string,
    updatedTag: Partial<Tag>,
  ): Promise<boolean> => {
    try {
      const base = tags.find((t) => t.name === oldName);
      const res = await walletOps.updateTag(
        wallet.id,
        oldName,
        updatedTag as Record<string, unknown>,
        base?.updatedAt ?? null,
      );

      if (!res.queued) {
        setTags((prev) =>
          prev.map((tag) => {
            if (tag.name === oldName) {
              return { ...tag, ...updatedTag } as Tag;
            }
            if (
              tag.parentName === oldName &&
              updatedTag.name &&
              updatedTag.name !== oldName
            ) {
              return { ...tag, parentName: updatedTag.name };
            }
            return tag;
          }),
        );
      }
      invalidate(wallet.id);
      if (res.queued) {
        triggerToast("Saved offline — will sync when you're back online", true);
      }

      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating tag"), false);
      return false;
    }
  };

  const handleDeleteTag = async (tagName: string): Promise<boolean> => {
    try {
      const base = tags.find((t) => t.name === tagName);
      const res = await walletOps.deleteTag(
        wallet.id,
        tagName,
        base?.updatedAt ?? null,
      );
      if (!res.queued) {
        setTags((prev) =>
          prev.filter(
            (tag) => tag.name !== tagName && tag.parentName !== tagName,
          ),
        );
      }
      invalidate(wallet.id);
      triggerToast(
        res.queued
          ? "Saved offline — will sync when you're back online"
          : "Tag deleted!",
        true,
      );
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting tag"), false);
      return false;
    }
  };

  const handleUpdateWallet = async (
    updatedInfo: Partial<Wallet>,
  ): Promise<boolean> => {
    try {
      const res = await walletOps.updateWallet(
        wallet.id,
        updatedInfo as Record<string, unknown>,
      );
      if (!res.queued) {
        setWallet(res.data as Wallet);
      }
      invalidate(wallet.id);
      triggerToast(
        res.queued
          ? "Saved offline — will sync when you're back online"
          : "Wallet updated successfully!",
        true,
      );
      onWalletUpdate();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating wallet"), false);
      return false;
    }
  };

  return { handleAddTag, handleUpdateTag, handleDeleteTag, handleUpdateWallet };
}
