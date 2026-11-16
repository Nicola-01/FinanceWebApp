import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../../wallet/WalletContext.tsx";
import { deleteBankRule } from "../../../api/bankApi";
import Button from "../../../components/ui/Button.tsx";
import { Badge } from "../../../components/ui/Badge.tsx";
import { SearchInput } from "../../../components/ui/SearchInput.tsx";
import { TagBadge } from "../../../components/ui/TagBadge.tsx";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import {
  getApiErrorDetail,
  getApiErrorTitle,
} from "../../../utils/apiError.ts";
import { ConfirmModal } from "../../../modals/common/ConfirmModal.tsx";
import { BankRuleEditor } from "../BankRuleEditor.tsx";
import type { BankRule } from "../../../types/domain";
import { applyRulesWithToast } from "./applyRulesWithToast.ts";
import { BankRuleRow } from "./BankRuleRow.tsx";
import { filterRules, groupRules } from "./bankRulesView.ts";

/** The wallet's rules: search, optional category groups, and the editor for each one. */
export function BankRulesPanel({
  rules,
  reload,
  onChildOpenChange,
}: {
  rules: BankRule[];
  reload: () => Promise<void>;
  /** Reports whether a nested dialog (editor, delete confirm) is open. */
  onChildOpenChange?: (open: boolean) => void;
}) {
  const { wallet, tags, toCategorise, fetchData } = useWalletContext();
  const canEdit = wallet.userRole !== "VIEWER";
  const [query, setQuery] = useState("");
  // undefined = editor closed, null = creating, a rule = editing it.
  const [editing, setEditing] = useState<BankRule | null | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<BankRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [applying, setApplying] = useState(false);

  const childOpen = editing !== undefined || deleteTarget !== null;
  useEffect(() => {
    onChildOpenChange?.(childOpen);
  }, [childOpen, onChildOpenChange]);

  const visible = filterRules(rules, query);
  // Grouped by category unless searching: a search result reads better as one flat list.
  const groups = query.trim() ? null : groupRules(visible);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBankRule(wallet.id, deleteTarget.id);
      await reload();
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

  const apply = async () => {
    setApplying(true);
    await applyRulesWithToast(wallet.id);
    fetchData();
    setApplying(false);
  };

  const renderRows = (list: BankRule[]) => (
    <ul className="divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] bg-app-raised">
      {list.map((r) => (
        <li key={r.id}>
          <BankRuleRow
            rule={r}
            onOpen={canEdit ? (rule) => setEditing(rule) : undefined}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-app-text">
          Rules
        </h3>
        <span className="text-[13px] tabular-nums text-app-muted">
          {query.trim() ? `${visible.length} of ${rules.length}` : rules.length}
        </span>
        <span className="flex-1" />
        {canEdit && rules.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            disabled={toCategorise.length === 0 || applying}
            onClick={apply}
          >
            <FontAwesomeIcon icon={faBolt} />
            Apply
            <Badge size="sm" tone="neutral">
              {toCategorise.length}
            </Badge>
          </Button>
        )}
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            accentColor={wallet.color}
            onClick={() => setEditing(null)}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add rule
          </Button>
        )}
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-app-muted">
          No rules yet. Add one to tag and rename matching imports for you.
        </p>
      ) : (
        <>
          <SearchInput
            value={query}
            onChange={setQuery}
            color={wallet.color}
            placeholder="Search by name, bank text or category"
            aria-label="Search rules"
          />
          {visible.length === 0 && (
            <p className="text-sm text-app-muted">No rule matches</p>
          )}
          {groups
            ? groups.map((g) => (
                <div
                  key={g.tag?.name ?? "none"}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 px-1 pt-2">
                    {g.tag ? (
                      <TagBadge tag={g.tag} showParent={false} />
                    ) : (
                      <span className="text-xs font-semibold text-app-muted">
                        No category
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-app-faint">
                      {g.rules.length}
                    </span>
                  </div>
                  {renderRows(g.rules)}
                </div>
              ))
            : visible.length > 0 && renderRows(visible)}
          <p className="text-xs text-app-faint">
            Tap a rule to edit or delete it. Apply runs every rule on the{" "}
            {toCategorise.length} transactions still to categorise.
          </p>
        </>
      )}

      <BankRuleEditor
        open={editing !== undefined}
        walletId={wallet.id}
        rule={editing ?? null}
        draft={editing ? undefined : { matchText: query.trim() }}
        pending={toCategorise}
        tags={tags}
        accentColor={wallet.color}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          reload();
        }}
        // Delete goes through the confirm dialog; the editor closes first.
        onDelete={
          editing && canEdit
            ? () => {
                setDeleteTarget(editing);
                setEditing(undefined);
              }
            : undefined
        }
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
    </section>
  );
}
