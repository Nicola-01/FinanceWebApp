import type { Transaction } from "../../types/domain";

type RuleDraftHandler = (tx: Transaction, tagName?: string) => void;

// Module-level, like ToastNotification: any row or toast can open the draft without prop drilling.
let draftHandler: RuleDraftHandler | null = null;

/** Opens the new-rule editor pre-filled from an import. */
export const openRuleDraft = (tx: Transaction, tagName?: string) => {
  draftHandler?.(tx, tagName);
};

/**
 * Registers the draft host. Returns an unsubscribe that only clears the handler
 * if it is still the one registered.
 */
export const registerRuleDraftHandler = (handler: RuleDraftHandler) => {
  draftHandler = handler;
  return () => {
    if (draftHandler === handler) draftHandler = null;
  };
};
