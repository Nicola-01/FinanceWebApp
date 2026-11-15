import { useEffect, useState } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import type { Transaction } from "../../types/domain";
import { BankRuleEditor } from "./BankRuleEditor.tsx";
import { registerRuleDraftHandler } from "./bankRuleDraft.ts";
import { applyRulesWithToast } from "./bank/applyRulesWithToast.ts";
import {
  bankNameOf,
  suggestMatchText,
  suggestRuleName,
} from "./bankRuleMatch.ts";

interface Draft {
  tx: Transaction;
  tagName?: string;
}

/** Mounted once per wallet: the "create rule from this import" editor, opened via openRuleDraft. */
export function BankRuleDraftHost() {
  const { wallet, tags, toCategorise, fetchData } = useWalletContext();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      registerRuleDraftHandler((tx, tagName) => {
        setDraft({ tx, tagName });
        setOpen(true);
      }),
    [],
  );

  if (wallet.userRole === "VIEWER") return null;

  const bankName = draft ? bankNameOf(draft.tx) : "";

  const onSaved = async () => {
    setOpen(false);
    await applyRulesWithToast(wallet.id);
    fetchData();
  };

  // Stays mounted while closed so the overlay can animate out with its last draft.
  return (
    <BankRuleEditor
      open={open}
      walletId={wallet.id}
      rule={null}
      draft={{
        name: suggestRuleName(bankName),
        matchText: suggestMatchText(bankName),
        tagName: draft?.tagName,
      }}
      pending={toCategorise}
      tags={tags}
      accentColor={wallet.color}
      onClose={() => setOpen(false)}
      onSaved={onSaved}
    />
  );
}
