import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBolt,
  faPen,
  faPlus,
  faTrash,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import {
  applyBankRules,
  deleteBankRule,
  getWalletBank,
  listBankRules,
} from "../../api/bankApi";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { Badge } from "../../components/ui/Badge.tsx";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import { DropdownManageButton } from "../../components/ui/DropdownManageButton.tsx";
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
  const { wallet, tags, fetchData } = useWalletContext();
  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState<BankRule[]>([]);
  // undefined = editor closed, null = creating, a rule = editing it.
  const [editing, setEditing] = useState<BankRule | null | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<BankRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [applying, setApplying] = useState(false);
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

  const applyToReview = async () => {
    setApplying(true);
    try {
      const { updated, collisions } = await applyBankRules(wallet.id);
      const done =
        updated === 0
          ? "No imports to categorise matched a rule"
          : `Updated ${updated} import${updated === 1 ? "" : "s"}`;
      triggerToast(
        collisions > 0
          ? `${done}. ${collisions} skipped: more than one rule matched.`
          : done,
        true,
      );
      if (updated > 0) fetchData();
    } catch (err) {
      triggerToast(getApiErrorTitle(err, "Could not apply rules"), false);
    }
    setApplying(false);
  };

  const list = (
    <div className="flex flex-col">
      {rules.length === 0 && (
        <p className="text-sm text-app-muted">
          No rules yet. Add one to tag and rename matching imports for you.
        </p>
      )}
      <ul className="divide-y divide-app-border">
        {rules.map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold text-app-text">
                  {r.name}
                </span>
                {r.tag && <TagBadge tag={r.tag} showParent={false} />}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-app-muted">
                <code className="max-w-full truncate rounded-md border border-app-border bg-app-surface px-2 py-0.5 font-app-mono text-xs text-app-text">
                  {r.matchText}
                </code>
                {r.regex && <Badge size="sm">Regex</Badge>}
                {r.reviewFirst && <Badge size="sm">Review first</Badge>}
                {r.dateFromName && <Badge size="sm">Date from name</Badge>}
                {r.renameTo && (
                  <>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-[10px]"
                      aria-label="renamed to"
                    />
                    <span className="text-app-text">{r.renameTo}</span>
                  </>
                )}
              </div>
              {r.usedBy.length > 0 && (
                <p className="text-xs text-app-muted">
                  Used by {r.usedBy.join(", ")}
                </p>
              )}
            </div>
            {canEdit && (
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${r.name}`}
                  onClick={() => setEditing(r)}
                >
                  <FontAwesomeIcon icon={faPen} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${r.name}`}
                  className="hover:text-app-red!"
                  onClick={() => setDeleteTarget(r)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <DropdownManageButton
          icon={faPlus}
          label="Add rule"
          onClick={() => setEditing(null)}
        />
      )}
      {canEdit && rules.length > 0 && (
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          className="mt-2"
          disabled={applying}
          onClick={applyToReview}
        >
          <FontAwesomeIcon icon={faBolt} />
          {applying ? "Applying…" : "Apply rules to To categorise"}
        </Button>
      )}
    </div>
  );

  const overlays = (
    <>
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
    </>
  );

  // Inside an overlay that already shows the title: no card around the list.
  if (embedded)
    return (
      <>
        {list}
        {overlays}
      </>
    );

  return (
    <Card
      title="Bank rules"
      subtitle="Tag and rename imported transactions automatically"
      icon={faWandMagicSparkles}
      iconColor={wallet.color}
    >
      {list}
      {overlays}
    </Card>
  );
}
