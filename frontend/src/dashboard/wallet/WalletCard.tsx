import React, { useState, useRef, forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import type { Wallet } from "../../utils/types.ts";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { walletSlug } from "../../utils/walletSlug.ts";

export interface WalletProps {
  wallet: Wallet;
  isSelected: boolean;
  onClick?: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export const WalletCardUI = forwardRef<
  HTMLAnchorElement,
  WalletProps & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(
  (
    { wallet, isSelected, onClick, isDragging, isOverlay, style, ...props },
    ref,
  ) => {
    const [ripples, setRipples] = useState<
      Array<{ x: number; y: number; id: number }>
    >([]);
    // Remember how the last interaction started so the context-menu handler can
    // tell a mouse right-click (allow native menu) from a touch long-press
    // (which is the drag-reorder gesture — suppress the menu).
    const lastPointerType = useRef<string>("mouse");
    // Where the current press started. dnd-kit leaves a trailing `click` on the
    // anchor after a drag-reorder; if the pointer moved past the drag threshold
    // between press and click we treat that click as drag debris and swallow it
    // (otherwise it would navigate and drop the URL query string).
    const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
    const DRAG_CLICK_THRESHOLD = 5; // px — matches MouseSensor activation distance

    const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
      lastPointerType.current = e.pointerType;
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      if (isOverlay) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      if (props.onPointerDown) {
        props.onPointerDown(e);
      }
    };

    const combinedStyle = {
      ...style,
      borderColor: isSelected ? wallet.color : "transparent",
      boxShadow: isOverlay
        ? `0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 40px ${wallet.color}40`
        : isSelected
          ? `0 0 25px ${wallet.color}20`
          : "none",
      opacity: isDragging && !isOverlay ? 0.3 : 1,
      zIndex: isOverlay ? 50 : isSelected ? 10 : 1,
    };

    // Render the card as a real link so the browser gives us open-in-new-tab
    // for free on desktop: middle-click and ⌘/Ctrl+click open a new tab, and
    // right-click shows the native "Open in new tab" menu. (On mobile the
    // long-press stays reserved for drag-reorder — see handleContextMenu.)
    const href = `/dashboard/${walletSlug(wallet)}`;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Let modifier / middle / right clicks fall through to the browser's
      // native link handling; only a plain left-click does SPA navigation.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      e.preventDefault(); // no full-page reload — navigate within the SPA
      // Ignore the synthetic click dnd-kit fires at the end of a drag-reorder:
      // if the pointer travelled past the drag threshold, this was a drag, not
      // a tap — don't navigate (which would reset the URL / current view).
      const start = pointerDownPos.current;
      if (start) {
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (moved > DRAG_CLICK_THRESHOLD) return;
      }
      onClick?.();
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Mouse right-click keeps the browser's native "Open in new tab" menu.
      // On touch/pen the long-press is the drag-reorder gesture, so suppress
      // the menu to keep dragging clean (no new-tab option on mobile).
      if (lastPointerType.current !== "mouse") {
        e.preventDefault();
      }
    };

    return (
      <a
        ref={ref}
        href={href}
        draggable={false}
        style={combinedStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        {...props}
        onPointerDown={handlePointerDown}
        className={`
                group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md shrink-0

                /* Fixed mobile width; fills the sidebar column on desktop */
                w-[260px] xl:w-full
                
                ${isOverlay || isDragging ? "cursor-move ring-2 ring-app-border shadow-2xl scale-[1.02]" : "cursor-pointer hover:bg-app-input/50"}
                
                transition-all duration-300
                bg-app-surface/60 ${isSelected ? "" : "border-app-border"}
            `}
      >
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${isSelected ? "bg-app-input opacity-100" : "bg-app-input opacity-0 group-hover:opacity-100"}`}
        />

        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full"
              style={{
                top: ripple.y,
                left: ripple.x,
                width: 100,
                height: 100,
                marginTop: -50,
                marginLeft: -50,
                backgroundColor: wallet.color,
                animation: "custom-ripple 0.6s ease-out forwards",
              }}
            />
          ))}
        </div>

        <div
          className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-app-input text-xl shadow-inner"
          style={{ color: wallet.color || "var(--color-app-green)" }}
        >
          <FontAwesomeIcon
            icon={ICONS[wallet.icon as IconKey] || ICONS["wallet"]}
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col min-w-0">
          <h4
            className="m-0 truncate font-app-mono text-sm font-black tracking-tight transition-colors"
            style={{
              color: isSelected ? wallet.color : "var(--text-secondary)",
            }}
          >
            {wallet.name}
          </h4>
          <p className="mt-1 w-fit rounded-lg bg-app-input px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-app-muted transition-all group-hover:bg-app-surface group-hover:text-app-text border border-app-border shadow-sm">
            {wallet.currency}
          </p>
        </div>
      </a>
    );
  },
);

// 2. IL COMPONENTE SMART (Gestisce la logica del Drag & Drop)
const WalletCard: React.FC<WalletProps> = ({ wallet, isSelected, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wallet.id });

  const style = {
    // IL FIX: Ora permettiamo di nuovo al segnaposto di muoversi e farsi spazio!
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <WalletCardUI
      ref={setNodeRef}
      wallet={wallet}
      isSelected={isSelected}
      onClick={onClick}
      isDragging={isDragging}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

export default WalletCard;
