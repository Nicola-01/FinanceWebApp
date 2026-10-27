import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { findRecommendedTagWithParent } from "../recommendedTags";
import { MissingTagActions } from "../MissingTagResolver";
import { subscriptionTagUnresolved } from "./subscriptionTags";
import { StagedSubscriptionRowHeader } from "./StagedSubscriptionRowHeader";
import { StagedSubscriptionEditor } from "./StagedSubscriptionEditor";
import type { Tag } from "../../../../types/domain";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

const tagKey = (s: string) => s.trim().toLowerCase();

export interface StagedSubscriptionRowProps {
  /** The single staged subscription this row renders. */
  sub: SubscriptionRequest;
  /** Staged tags — resolves the subscription's tag (and its parent chain). */
  tags: TagRequest[];
  /** Wallet-currency symbol shown next to the amount. */
  currencySymbol: string;
  /** Wallet accent colour, used when the tag itself has none. */
  accentColor?: string;
  /** Whether this row's editor/resolver panel is open. */
  open: boolean;
  /** Toggle this row's expanded state. */
  onToggle: () => void;
  /** Remove this subscription. */
  onRemove: () => void;
  /** Point this subscription at an existing tag (closes the row). */
  onReassignTag: (tagName: string) => void;
  /** Create the missing tag for this subscription (closes the row). */
  onCreateTag: () => void;
  /** Patch this subscription (amount, scheduling, dates…). */
  onEdit: (patch: Partial<SubscriptionRequest>) => void;
}

/**
 * One row of the "subscriptions ready" list. Its header shows the subscription's
 * {@link TagBadge} (or an amber flag when the tag isn't staged), recurrence and
 * signed amount; tapping it expands either the editor (amount, start date,
 * recurrence) or, for an unresolved tag, a reassign/create panel. Self-contained
 * and fully controlled — expansion and every mutation are delegated to the
 * parent {@link StagedSubscriptionList} through no-arg callbacks.
 */
export function StagedSubscriptionRow({
  sub,
  tags,
  currencySymbol,
  accentColor,
  open,
  onToggle,
  onRemove,
  onReassignTag,
  onCreateTag,
  onEdit,
}: StagedSubscriptionRowProps) {
  // The expand animation clips overflow while the height grows; once it settles
  // we release the clip so the tag dropdown (absolutely positioned) can spill
  // out of the row. Resets naturally on collapse (the panel unmounts).
  const [settled, setSettled] = useState(false);

  const missing = subscriptionTagUnresolved(sub, tags);
  const matched = tags.find((t) => tagKey(t.name) === tagKey(sub.tag));
  const accent = matched?.colorHex ?? accentColor;
  // A missing tag that is a known Recommended leaf carries a parent category
  // (e.g. "Netflix" → "Subscriptions"); surface it so the user sees — and
  // creates — the whole hierarchy, not a lone orphan tag.
  const recommended = missing
    ? findRecommendedTagWithParent(sub.tag)
    : undefined;
  const parentName = recommended?.parent.name;

  // TagBadge resolves a parent from this list; the wizard has no WalletProvider.
  const contextTags: Tag[] = tags.map((t) => ({
    name: t.name,
    icon: t.icon,
    colorHex: t.colorHex,
    parentName: t.parentName ?? null,
  }));

  return (
    <li className="px-3 py-2">
      <StagedSubscriptionRowHeader
        sub={sub}
        missing={missing}
        parentName={parentName}
        matched={matched}
        contextTags={contextTags}
        currencySymbol={currencySymbol}
        open={open}
        onToggle={onToggle}
        onRemove={onRemove}
      />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: open && settled ? "visible" : "hidden" }}
            onAnimationComplete={() => open && setSettled(true)}
          >
            {missing ? (
              <div className="mt-2 rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 p-3">
                <p className="text-xs text-app-text">
                  No tag named{" "}
                  <span className="font-semibold">&ldquo;{sub.tag}&rdquo;</span>{" "}
                  in this wallet. Reassign it to an existing tag, or create it
                  {parentName ? (
                    <>
                      {" "}
                      under{" "}
                      <span className="font-semibold">
                        &ldquo;{parentName}&rdquo;
                      </span>
                    </>
                  ) : null}
                  .
                </p>
                <MissingTagActions
                  name={sub.tag}
                  recommended={recommended}
                  tags={tags}
                  placeholder="Use an existing tag"
                  accentColor={accentColor}
                  className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
                  onCreate={onCreateTag}
                  onReassign={onReassignTag}
                />
              </div>
            ) : (
              <StagedSubscriptionEditor
                sub={sub}
                accent={accent}
                currencySymbol={currencySymbol}
                contextTags={contextTags}
                onEdit={onEdit}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default StagedSubscriptionRow;
