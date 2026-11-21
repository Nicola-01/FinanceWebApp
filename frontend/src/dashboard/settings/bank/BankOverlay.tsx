import { useState } from "react";
import { useWalletContext } from "../../wallet/WalletContext.tsx";
import type { BankConnection } from "../../../api/bankApi";
import type { BankRule } from "../../../types/domain";
import { ResponsiveOverlay } from "../../../components/ui/ResponsiveOverlay.tsx";
import { useUiVersion } from "../../../hooks/useUiVersion.ts";
import { BankAccountsList } from "./BankAccountsList.tsx";
import { BankRulesPanel } from "./BankRulesPanel.tsx";

/** The Bank screen: accounts and rules, in the shared overlay shell. */
export function BankOverlay({
  open,
  onClose,
  connections,
  reloadAccounts,
  rules,
  reloadRules,
}: {
  open: boolean;
  onClose: () => void;
  connections: BankConnection[];
  reloadAccounts: () => Promise<void>;
  rules: BankRule[];
  reloadRules: () => Promise<void>;
}) {
  const { wallet } = useWalletContext();
  const [ui] = useUiVersion();
  // A dialog stacked on top (link form, editor, confirm) also listens for Escape:
  // keep this overlay open then, so one press closes only the top one.
  const [accountsBusy, setAccountsBusy] = useState(false);
  const [rulesBusy, setRulesBusy] = useState(false);

  return (
    <ResponsiveOverlay
      open={open}
      onClose={() => {
        if (!accountsBusy && !rulesBusy) onClose();
      }}
      title="Bank"
      accentColor={wallet.color}
      width={520}
    >
      <div
        className={`flex flex-col ${ui === "v2" ? "gap-6" : "gap-8"}`} // ui-v2-switch
      >
        <BankAccountsList
          connections={connections}
          reload={reloadAccounts}
          onChildOpenChange={setAccountsBusy}
        />
        {connections.length > 0 && (
          <BankRulesPanel
            rules={rules}
            reload={reloadRules}
            onChildOpenChange={setRulesBusy}
          />
        )}
      </div>
    </ResponsiveOverlay>
  );
}
