import { useCallback, useEffect, useState } from "react";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import {
  deleteBankRule,
  getWalletBank,
  listBankRules,
} from "../../api/bankApi";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { Badge } from "../../components/ui/Badge.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorDetail, getApiErrorTitle } from "../../utils/apiError.ts";
import { ConfirmModal } from "../../modals/common/ConfirmModal.tsx";
import { BankRuleEditor } from "./BankRuleEditor.tsx";
import type { BankRule } from "../../types/domain";

/** The wallet's bank rules: tag/rename imports, or route them to subscriptions. */
export function BankRulesSection({
  embedded = false,
}: {
  /** Inside an overlay that already shows the title: drop the card header. */
  embedded?: boolean;
} = {}) {
  const { wallet, tags } = useWalletContext();
  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState<BankRule[]>([]);
  // undefined = editor closed, null = creating, a rule = editing it.
  const [editing, setEditing] = useState<BankRule | null | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<BankRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const canEdit = wallet.userRole !== "VIEWER";

  const load = useCallback(
    () =>
      listBankRules(wallet.id)
        .then(setRules)
        .catch(() => setRules([])),
    [wallet.id],
  );

  useEffect(() => {
    let alive = true;
    getWalletBank(wallet.id)
      .then((b) => {
        if (!alive) return;
        setEnabled(b.enabled);
        if (b.enabled) load();
      })
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, [wallet.id, load]);

  if (!enabled) return null;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBankRule(wallet.id, deleteTarget.id);
      await load();
    } catch (err) {
      // A rule in use comes back as 409 "Used by: …".
      triggerToast(
        getApiErrorDetail(err, getApiErrorTitle(err, "Could not delete rule")),
        false,
      );
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <Card
      {...(!embedded && {
        title: "Bank rules",
        subtitle: "Tag and rename imported transactions automatically",
        icon: faWandMagicSparkles,
        iconColor: wallet.color,
      })}
    >
      <div className="flex flex-col gap-3">
        {rules.length === 0 && (
          <p className="text-sm text-app-muted">
            No rules yet. Add one to categorise matching imports for you.
          </p>
        )}
        {rules.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-2 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-app-text">{r.name}</span>
              {r.tag && <Badge color={r.tag.colorHex}>{r.tag.name}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-app-muted">
              <span className="font-app-mono text-app-text">{r.matchText}</span>
              {r.regex && <Badge size="sm">Regex</Badge>}
              {r.renameTo && <span>→ {r.renameTo}</span>}
            </div>
            {r.usedBy.length > 0 && (
              <p className="text-xs text-app-muted">
                Used by {r.usedBy.join(", ")}
              </p>
            )}
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing(r)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteTarget(r)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
        {canEdit && (
          <div>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Add rule
            </Button>
          </div>
        )}
      </div>

      <BankRuleEditor
        open={editing !== undefined}
        walletId={wallet.id}
        rule={editing ?? null}
        tags={tags}
        accentColor={wallet.color}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          load();
        }}
      />
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete rule"
        message={`Delete "${deleteTarget?.name ?? ""}"? Future imports will no longer match it.`}
        confirmLabel="Delete rule"
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
