import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import {
  readWalletOrder,
  sortWalletsBySavedOrder,
  writeWalletOrder,
} from "../../utils/walletOrder.ts";
import { Badge } from "../../components/ui/Badge";
import {
  CreateWalletWizard,
  type CreateWalletWizardHandle,
} from "../../modals/wallet/CreateWalletWizard.tsx";
import WalletCard, { WalletCardUI } from "./WalletCard.tsx";
import type { Wallet, Invitation } from "../../types/domain.ts";
import { useInvitations } from "./useInvitations";
import { InvitesMobileInline, InvitesDesktopSection } from "./WalletInvites";
import { InviteModal } from "../../modals/wallet/InviteModal";
import { AddWalletTile, WalletSkeleton } from "./WalletBarTiles";
import { useWalletDragReorder } from "./useWalletDragReorder";

import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

interface WalletsAreaProps {
  wallets: Wallet[];
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
  loading: boolean;
  selectedWalletId?: string;
  onSelectWallet: (id: string) => void;
  onRefreshAll: () => void;
}

export const WalletsBar: React.FC<WalletsAreaProps> = ({
  wallets,
  setWallets,
  loading,
  selectedWalletId,
  onSelectWallet,
  onRefreshAll,
}) => {
  const walletModal = useRef<CreateWalletWizardHandle>(null);
  const {
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useWalletDragReorder(setWallets);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const didInitScroll = useRef(false);

  const {
    invites,
    loading: invitesLoading,
    accept,
    reject,
  } = useInvitations(onRefreshAll);
  const [invitesOpen, setInvitesOpen] = useState(false);
  // The invitation currently open in the respond modal (accept / reject live there).
  const [activeInvite, setActiveInvite] = useState<Invitation | null>(null);

  const handleAccept = async (walletId: string) => {
    await accept(walletId);
    setActiveInvite(null);
  };

  const handleReject = async (walletId: string) => {
    await reject(walletId);
    setActiveInvite(null);
  };

  // On first load with NO invitations, start the mobile row scrolled past the
  // (small, left-most) invites badge so the first wallet sits flush-left; the
  // user swipes right to reveal the badge. Desktop is a vertical column, where
  // horizontal scrollLeft is a no-op (and the invites zone is display:none → 0).
  useLayoutEffect(() => {
    if (loading || invitesLoading || didInitScroll.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (invites.length === 0) {
      const inviteZone = scroller.firstElementChild as HTMLElement | null;
      if (inviteZone && inviteZone.offsetWidth > 0) {
        scroller.scrollLeft = inviteZone.offsetWidth + 16; // + the gap-4 spacing
      }
    }
    didInitScroll.current = true;
  }, [loading, invitesLoading, invites.length]);

  // Apply the saved wallet order from localStorage on load.
  useEffect(() => {
    if (!loading && wallets.length > 0) {
      const savedOrder = readWalletOrder();

      if (savedOrder) {
        const sortedWallets = sortWalletsBySavedOrder(wallets, savedOrder);

        const currentIds = wallets.map((w) => w.id).join(",");
        const sortedIds = sortedWallets.map((w) => w.id).join(",");

        const newOrder = sortedWallets.map((w) => w.id);

        // Only update state when the order actually changed.
        if (currentIds !== sortedIds) {
          setWallets(sortedWallets);
        }

        // Rewrite the stored order when it drifted
        // (e.g. deleted wallets, or new ones appended at the end).
        if (JSON.stringify(newOrder) !== JSON.stringify(savedOrder)) {
          writeWalletOrder(newOrder);
        }
      }
    }
  }, [wallets, loading, setWallets]);

  const handleCreate = (walletId: string) => {
    onRefreshAll();
    onSelectWallet(walletId);
  };

  const activeWallet = activeId ? wallets.find((w) => w.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <aside
        className="
                w-full shrink-0 backdrop-blur-md
                xl:flex xl:flex-col xl:w-[320px] xl:h-full xl:min-h-0
                xl:border-r xl:border-app-border xl:bg-app-surface/30 xl:backdrop-blur-xl
            "
      >
        {/* Desktop section header — reads as a real 'wallet filter' panel */}
        <div className="hidden xl:flex items-center justify-between gap-3 px-6 pt-6 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-app-muted">
            Wallets
          </h3>
          {!loading && wallets.length > 0 && (
            <Badge variant="subtle" mono>
              {wallets.length}
            </Badge>
          )}
        </div>

        {/* Scroller: horizontal on mobile, vertical list on desktop */}
        <div
          ref={scrollerRef}
          className="
                  flex flex-row w-full gap-4 p-4 overflow-x-auto overflow-y-hidden
                  xl:flex-1 xl:flex-col xl:gap-3 xl:min-h-0 xl:px-6 xl:pt-0 xl:pb-6 xl:overflow-y-auto xl:overflow-x-hidden
                  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              "
        >
          {/* Mobile-only: invites inline (badge + cards + divider) before wallets */}
          <InvitesMobileInline
            count={invites.length}
            open={invitesOpen}
            onToggle={() => setInvitesOpen((o) => !o)}
            invites={invites}
            onOpen={setActiveInvite}
          />

          {loading && wallets.length === 0 ? (
            <>
              <WalletSkeleton />
              <WalletSkeleton />
              <WalletSkeleton />
            </>
          ) : (
            <SortableContext
              items={wallets.map((w) => w.id)}
              strategy={rectSortingStrategy}
            >
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  isSelected={wallet.id === selectedWalletId}
                  onClick={() => onSelectWallet(wallet.id)}
                />
              ))}
            </SortableContext>
          )}

          {/* Mobile-only Add button — last item in the horizontal row. */}
          {!loading && (
            <AddWalletTile
              onClick={() => walletModal.current?.openModal()}
              className="w-[260px] xl:hidden"
            />
          )}

          <CreateWalletWizard ref={walletModal} onSuccess={handleCreate} />
        </div>

        {/* Desktop-only footer, pinned below the scrolling wallet list:
            invitations section above the aligned "Add New Wallet" button. */}
        <div className="hidden xl:flex xl:flex-col xl:gap-3 xl:border-t xl:border-app-border xl:px-6 xl:py-4">
          <InvitesDesktopSection invites={invites} onOpen={setActiveInvite} />
          {!loading && (
            <AddWalletTile
              onClick={() => walletModal.current?.openModal()}
              className="w-full"
            />
          )}
        </div>
      </aside>

      <InviteModal
        invite={activeInvite}
        onAccept={handleAccept}
        onReject={handleReject}
        onClose={() => setActiveInvite(null)}
      />

      <DragOverlay dropAnimation={{ duration: 250, easing: "ease-out" }}>
        {activeWallet ? (
          <WalletCardUI
            wallet={activeWallet}
            isSelected={activeWallet.id === selectedWalletId}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
