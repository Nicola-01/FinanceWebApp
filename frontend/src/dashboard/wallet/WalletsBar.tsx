import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CreateWalletWizard,
  type CreateWalletWizardHandle,
} from "../../modals/wallet/CreateWalletWizard.tsx";
import WalletCard, { WalletCardUI } from "./WalletCard.tsx";
import type { Wallet, Invitation } from "../../utils/types.ts";
import { useInvitations } from "./useInvitations";
import { InvitesMobileInline, InvitesDesktopSection } from "./WalletInvites";
import { InviteModal } from "../../modals/wallet/InviteModal";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

interface WalletsAreaProps {
  wallets: Wallet[];
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
  loading: boolean;
  selectedWalletId?: string;
  onSelectWallet: (id: string) => void;
  onRefreshAll: () => void;
}

const WalletSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-app-border bg-app-input animate-pulse shrink-0 w-[260px] xl:w-full">
    <div className="h-12 w-12 rounded-full bg-app-surface shrink-0"></div>
    <div className="flex flex-1 flex-col min-w-0 gap-2">
      <div className="h-4 w-3/4 rounded bg-app-surface"></div>
      <div className="h-5 w-10 rounded-md bg-app-surface mt-0.5"></div>
    </div>
  </div>
);

/** Dashed "Add New Wallet" tile — reused for the mobile row and the desktop footer. */
const AddWalletTile: React.FC<{ onClick: () => void; className?: string }> = ({
  onClick,
  className = "",
}) => (
  <button
    onClick={onClick}
    className={`cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-app-border bg-app-input/60 transition-all hover:bg-app-input hover:border-app-green/50 shrink-0 text-left ${className}`}
  >
    <div className="flex justify-center items-center w-12 h-12 rounded-full bg-app-surface text-xl text-app-muted group-hover:text-app-green transition-colors shrink-0">
      <FontAwesomeIcon icon={faPlus} />
    </div>
    <div className="flex flex-col min-w-0">
      <h4 className="m-0 text-sm font-bold text-app-muted group-hover:text-app-text transition-colors truncate">
        Add New Wallet
      </h4>
    </div>
  </button>
);

export const WalletsBar: React.FC<WalletsAreaProps> = ({
  wallets,
  setWallets,
  loading,
  selectedWalletId,
  onSelectWallet,
  onRefreshAll,
}) => {
  const walletModal = useRef<CreateWalletWizardHandle>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
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

  // --- 1. SINCRONIZZAZIONE ORDINE INIZIALE DA LOCAL STORAGE ---
  useEffect(() => {
    if (!loading && wallets.length > 0) {
      const savedOrderStr = localStorage.getItem("wallet_order");

      if (savedOrderStr) {
        try {
          const savedOrder = JSON.parse(savedOrderStr) as string[];

          // Riordiniamo i wallet basandoci sugli ID salvati nel localStorage
          const sortedWallets = [...wallets].sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);

            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return indexA - indexB;
          });

          const currentIds = wallets.map((w) => w.id).join(",");
          const sortedIds = sortedWallets.map((w) => w.id).join(",");

          // Creiamo la nuova stringa pulita per il localStorage
          const newOrderStr = JSON.stringify(sortedWallets.map((w) => w.id));

          // 1. Aggiorniamo la UI SOLO se l'ordine degli elementi è diverso
          if (currentIds !== sortedIds) {
            setWallets(sortedWallets);
          }

          // 2. Puliamo il Local Storage se ci sono disallineamenti
          // (es. wallet eliminati o wallet nuovi aggiunti in coda)
          if (newOrderStr !== savedOrderStr) {
            localStorage.setItem("wallet_order", newOrderStr);
          }
        } catch (e) {
          console.error("Error parsing wallet_order from localStorage", e);
        }
      }
    }
  }, [wallets, loading, setWallets]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // --- 2. SALVATAGGIO ORDINE AL TERMINE DEL DRAG ---
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWallets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(
          "wallet_order",
          JSON.stringify(newArray.map((w) => w.id)),
        );
        return newArray;
      });
    }
  };

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
      onDragCancel={() => setActiveId(null)}
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
            <span className="rounded-full bg-app-input px-2 py-0.5 font-app-mono text-[11px] font-bold tabular-nums text-app-muted">
              {wallets.length}
            </span>
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
