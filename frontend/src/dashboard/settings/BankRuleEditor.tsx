import { useEffect, useState } from "react";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import Button from "../../components/ui/Button.tsx";
import Toggle from "../../components/ui/Toggle.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { useUiVersion } from "../../hooks/useUiVersion";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { TagPicker } from "../../modals/transaction/TagPicker";
import { createBankRule, updateBankRule } from "../../api/bankApi";
import { getApiErrorDetail, getApiErrorTitle } from "../../utils/apiError.ts";
import type { BankRule, Tag, Transaction } from "../../types/domain";
import { bankNameOf, ruleMatches } from "./bankRuleMatch";

const REGEX_ERROR = "Invalid bank match regex";

interface Props {
  open: boolean;
  walletId: string;
  /** Rule to edit; null creates a new one. */
  rule: BankRule | null;
  /** Pre-fills a new rule (only used when `rule` is null). */
  draft?: Partial<Pick<BankRule, "name" | "matchText">> & { tagName?: string };
  /** Imports still to categorise, to show how many the rule would match. */
  pending?: Transaction[];
  tags: Tag[];
  accentColor?: string;
  onClose: () => void;
  onSaved: (rule: BankRule) => void;
  /** Shows a "Delete rule" button when editing an existing rule. */
  onDelete?: () => void;
}

/** Create/edit form for a wallet bank rule. */
export function BankRuleEditor({
  open,
  walletId,
  rule,
  draft,
  pending,
  tags,
  accentColor,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [regex, setRegex] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [tagName, setTagName] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [reviewFirst, setReviewFirst] = useState(false);
  const [dateFromName, setDateFromName] = useState(false);
  const [clearName, setClearName] = useState(false);
  const [textError, setTextError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Draft fields are read as primitives: the parent passes a fresh object each render.
  const draftName = draft?.name;
  const draftText = draft?.matchText;
  const draftTag = draft?.tagName;

  useEffect(() => {
    if (!open) return;
    setName(rule?.name ?? draftName ?? "");
    setText(rule?.matchText ?? draftText ?? "");
    setRegex(rule?.regex ?? false);
    setIgnoreCase(rule?.ignoreCase ?? true);
    setTagName(rule?.tag?.name ?? draftTag ?? "");
    setRenameTo(rule?.renameTo ?? "");
    setReviewFirst(rule?.reviewFirst ?? false);
    setDateFromName(rule?.dateFromName ?? false);
    setClearName(rule?.clearName ?? false);
    setTextError(undefined);
  }, [open, rule, draftName, draftText, draftTag]);

  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  const canSave = name.trim() !== "" && text.trim() !== "" && !saving;
  const matchCount =
    pending && text.trim() !== ""
      ? pending.filter((tx) =>
          ruleMatches({ matchText: text, regex, ignoreCase }, bankNameOf(tx)),
        ).length
      : undefined;

  const save = async () => {
    setSaving(true);
    setTextError(undefined);
    const req = {
      name: name.trim(),
      matchText: text.trim(),
      regex,
      ignoreCase,
      tag: tagName || null,
      renameTo: !clearName && renameTo.trim() ? renameTo.trim() : null,
      reviewFirst,
      dateFromName,
      clearName,
    };
    try {
      const saved = rule
        ? await updateBankRule(walletId, rule.id, req)
        : await createBankRule(walletId, req);
      onSaved(saved);
    } catch (err) {
      const detail = getApiErrorDetail(
        err,
        getApiErrorTitle(err, "Could not save rule"),
      );
      if (detail.startsWith(REGEX_ERROR)) setTextError(detail);
      else triggerToast(detail, false);
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (
    <Button
      type="button"
      onClick={save}
      disabled={!canSave}
      accentColor={accentColor}
      fullWidth={!onDelete}
      className={onDelete ? "flex-1" : undefined}
      size="lg"
      aria-label="Save rule"
    >
      {saving ? "Saving…" : rule ? "Save changes" : "Add rule"}
    </Button>
  );

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title={rule ? "Edit bank rule" : "New bank rule"}
      accentColor={accentColor}
      footer={
        onDelete && rule ? (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="!text-app-danger hover:!text-app-danger"
              onClick={onDelete}
            >
              Delete rule
            </Button>
            {saveButton}
          </div>
        ) : (
          saveButton
        )
      }
    >
      <div className="flex flex-col gap-5 text-left">
        <div>
          <FieldLabel>Name *</FieldLabel>
          <Input
            type="text"
            aria-label="Rule name"
            placeholder="Bank rule name"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Trigger text *</FieldLabel>
          <Input
            type="text"
            aria-label="Trigger text"
            placeholder="Text in the bank transaction name"
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={!!textError}
          />
          {matchCount !== undefined && !textError && (
            <p className="mt-1 text-xs text-app-muted">
              {matchCount === 0
                ? "No transaction to categorise matches yet"
                : `Matches ${matchCount} transaction${matchCount === 1 ? "" : "s"} to categorise`}
            </p>
          )}
          {textError && (
            <p
              className={`mt-1 text-xs ${isV2 ? "text-app-danger" : "text-app-red"}`}
            >
              {textError}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle
            checked={regex}
            onChange={setRegex}
            accentColor={accentColor}
            size="sm"
            label="Use regex"
            aria-label="Use regex"
          />
          <Toggle
            checked={ignoreCase}
            onChange={setIgnoreCase}
            accentColor={accentColor}
            size="sm"
            label="Ignore case"
            aria-label="Ignore case"
          />
        </div>
        <div>
          <TagPicker
            tags={tags}
            selectedTagName={tagName}
            onSelectTag={setTagName}
          />
          {tagName && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => setTagName("")}
            >
              No tag
            </Button>
          )}
        </div>
        <div>
          <FieldLabel>Transaction Name</FieldLabel>
          <Input
            type="text"
            aria-label="Transaction name"
            placeholder="(Optional)"
            value={renameTo}
            maxLength={100}
            disabled={clearName}
            onChange={(e) => setRenameTo(e.target.value)}
          />
          <div className="mt-2">
            <Toggle
              checked={clearName}
              onChange={setClearName}
              accentColor={accentColor}
              size="sm"
              label="Leave the name empty"
              aria-label="Leave the name empty"
            />
          </div>
        </div>
        <div>
          <Toggle
            checked={reviewFirst}
            onChange={setReviewFirst}
            accentColor={accentColor}
            size="sm"
            label="Review before confirming"
            aria-label="Review before confirming"
          />
          <p className="mt-1 text-xs text-app-muted">
            Tag and name are filled in, but the transaction stays in To
            categorise so you can adjust it first.
          </p>
        </div>
        <div>
          <Toggle
            checked={dateFromName}
            onChange={setDateFromName}
            accentColor={accentColor}
            size="sm"
            label="Date from transaction name"
            aria-label="Date from transaction name"
          />
          <p className="mt-1 text-xs text-app-muted">
            Use the purchase date written in the bank description (e.g.
            &quot;... 03.11.2026 ...&quot;) instead of the booking date.
          </p>
        </div>
        <p className="text-xs text-app-muted">
          Imports matching this rule get its tag and name. When a subscription
          uses the rule, the subscription wins. If several rules match, nothing
          is applied and the transaction stays to categorise.
        </p>
      </div>
    </ResponsiveOverlay>
  );
}
