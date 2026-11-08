import { useEffect, useState } from "react";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import Button from "../../components/ui/Button.tsx";
import Toggle from "../../components/ui/Toggle.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { TagPicker } from "../../modals/transaction/TagPicker";
import { createBankRule, updateBankRule } from "../../api/bankApi";
import { getApiErrorDetail, getApiErrorTitle } from "../../utils/apiError.ts";
import type { BankRule, Tag } from "../../types/domain";

const REGEX_ERROR = "Invalid bank match regex";

interface Props {
  open: boolean;
  walletId: string;
  /** Rule to edit; null creates a new one. */
  rule: BankRule | null;
  tags: Tag[];
  accentColor?: string;
  onClose: () => void;
  onSaved: (rule: BankRule) => void;
}

/** Create/edit form for a wallet bank rule. */
export function BankRuleEditor({
  open,
  walletId,
  rule,
  tags,
  accentColor,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [regex, setRegex] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [tagName, setTagName] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [reviewFirst, setReviewFirst] = useState(false);
  const [textError, setTextError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(rule?.name ?? "");
    setText(rule?.matchText ?? "");
    setRegex(rule?.regex ?? false);
    setIgnoreCase(rule?.ignoreCase ?? true);
    setTagName(rule?.tag?.name ?? "");
    setRenameTo(rule?.renameTo ?? "");
    setReviewFirst(rule?.reviewFirst ?? false);
    setTextError(undefined);
  }, [open, rule]);

  const canSave = name.trim() !== "" && text.trim() !== "" && !saving;

  const save = async () => {
    setSaving(true);
    setTextError(undefined);
    const req = {
      name: name.trim(),
      matchText: text.trim(),
      regex,
      ignoreCase,
      tag: tagName || null,
      renameTo: renameTo.trim() || null,
      reviewFirst,
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

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title={rule ? "Edit bank rule" : "New bank rule"}
      accentColor={accentColor}
      footer={
        <Button
          type="button"
          onClick={save}
          disabled={!canSave}
          accentColor={accentColor}
          fullWidth
          size="lg"
          aria-label="Save rule"
        >
          {saving ? "Saving…" : rule ? "Save changes" : "Add rule"}
        </Button>
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
          {textError && (
            <p className="mt-1 text-xs text-app-red">{textError}</p>
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
            onChange={(e) => setRenameTo(e.target.value)}
          />
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
        <p className="text-xs text-app-muted">
          Imports matching this rule get its tag and name. When a subscription
          uses the rule, the subscription wins. If several rules match, nothing
          is applied and the transaction stays to categorise.
        </p>
      </div>
    </ResponsiveOverlay>
  );
}
