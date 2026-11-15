import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { TagBadge } from "../../../components/ui/TagBadge.tsx";
import type { BankRule } from "../../../types/domain";

const MARK =
  "inline-grid h-5 min-w-5 place-items-center rounded-[6px] border border-app-border px-1 text-[11px] leading-none text-app-faint";

/**
 * One rule as a single line (two lines on a phone). The whole row opens the editor;
 * `onOpen` undefined makes it read-only (viewers).
 */
export function BankRuleRow({
  rule,
  onOpen,
}: {
  rule: BankRule;
  onOpen?: (rule: BankRule) => void;
}) {
  const usedBy = rule.usedBy.join(", ");
  return (
    <button
      type="button"
      disabled={!onOpen}
      onClick={() => onOpen?.(rule)}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2.5 text-left transition-colors hover:bg-app-card disabled:cursor-default disabled:hover:bg-transparent sm:grid-cols-[150px_minmax(0,1fr)_auto_auto_auto]"
    >
      <span className="truncate text-sm font-semibold text-app-text max-sm:col-start-1 max-sm:row-start-1">
        {rule.name}
      </span>
      <span className="min-w-0 truncate rounded-[var(--r-sm)] bg-app-raised px-2 py-0.5 text-[13px] text-app-text max-sm:col-start-1 max-sm:row-start-2">
        {rule.matchText}
      </span>
      <span className="flex items-center gap-1.5 justify-self-end max-sm:col-start-2 max-sm:row-start-2">
        {(rule.renameTo || rule.clearName) && (
          <span
            className={MARK}
            role="img"
            title="Renames"
            aria-label="Renames"
          >
            ✎
          </span>
        )}
        {rule.regex && (
          <span className={MARK} role="img" title="Regex" aria-label="Regex">
            .*
          </span>
        )}
        {rule.usedBy.length > 0 && (
          <span
            className={MARK}
            role="img"
            title={`Used by: ${usedBy}`}
            aria-label={`Used by: ${usedBy}`}
          >
            ↻
          </span>
        )}
        <span
          className="text-xs tabular-nums text-app-faint"
          title="Transactions handled by this rule"
        >
          {rule.transactionCount} tx
        </span>
      </span>
      <FontAwesomeIcon
        icon={faArrowRight}
        className="hidden text-app-faint sm:block"
      />
      <span className="justify-self-end max-sm:col-start-2 max-sm:row-start-1">
        <TagBadge tag={rule.tag ?? undefined} showParent={false} />
      </span>
    </button>
  );
}
