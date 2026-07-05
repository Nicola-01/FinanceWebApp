import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import type { Invitation } from "../../utils/types";
import { InviteCard } from "./InviteCard";

interface ListProps {
  invites: Invitation[];
  /** Open the respond-to-invitation modal for a given invite. */
  onOpen: (invite: Invitation) => void;
}

const InvitesList: React.FC<ListProps> = ({ invites, onOpen }) =>
  invites.length > 0 ? (
    <>
      {invites.map((inv) => (
        <InviteCard key={inv.wallet.id} invite={inv} onOpen={onOpen} />
      ))}
    </>
  ) : (
    <p className="py-4 text-center text-sm italic text-app-muted">
      No pending invitations.
    </p>
  );

/** Count pill — yellow when there's at least one pending invite, grey at zero. */
const CountPill: React.FC<{ count: number }> = ({ count }) => (
  <span
    className={`rounded-full px-2 py-0.5 font-app-mono text-[11px] font-bold tabular-nums ${
      count >= 1
        ? "bg-app-yellow/15 text-app-yellow"
        : "bg-app-input text-app-muted"
    }`}
  >
    {count}
  </span>
);

// ── Mobile: square badge (first item in the horizontal scroller) ──────────────
export const InvitesBadge: React.FC<{
  count: number;
  open: boolean;
  onToggle: () => void;
}> = ({ count, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    aria-label={`Invitations (${count})`}
    className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors xl:hidden ${
      count >= 1
        ? "border-app-yellow/40 bg-app-yellow/10 text-app-yellow"
        : "border-app-border bg-app-input/60 text-app-muted"
    }`}
  >
    <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
    <span className="font-app-mono text-[11px] font-black leading-none tabular-nums">
      {count}
    </span>
  </button>
);

// ── Mobile: badge + (when open) invite cards inline in the wallet row, with a
//    vertical divider separating the invites zone from the wallets. ────────────
export const InvitesMobileInline: React.FC<
  ListProps & { count: number; open: boolean; onToggle: () => void }
> = ({ count, open, onToggle, invites, onOpen }) => (
  <div className="flex shrink-0 flex-row items-center gap-4 xl:hidden">
    <InvitesBadge count={count} open={open} onToggle={onToggle} />
    <AnimatePresence initial={false}>
      {open &&
        invites.map((inv) => (
          <motion.div
            key={inv.wallet.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="shrink-0 overflow-hidden"
          >
            <InviteCard invite={inv} onOpen={onOpen} />
          </motion.div>
        ))}
    </AnimatePresence>
    <div className="w-px shrink-0 self-stretch bg-app-border" />
  </div>
);

// ── Desktop: collapsible section above "Add New Wallet" ───────────────────────
export const InvitesDesktopSection: React.FC<ListProps> = ({
  invites,
  onOpen,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="hidden xl:block">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mb-2 flex flex-col gap-3">
              <InvitesList invites={invites} onOpen={onOpen} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left"
      >
        <FontAwesomeIcon icon={faEnvelope} className="text-app-muted" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-muted">
          Invitations
        </span>
        <CountPill count={invites.length} />
        <FontAwesomeIcon
          icon={faChevronUp}
          className={`ml-auto text-[10px] text-app-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
};
