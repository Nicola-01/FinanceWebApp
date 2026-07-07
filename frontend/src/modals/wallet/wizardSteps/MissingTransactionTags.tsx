import { type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faPlus,
  faChevronRight,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { Icon } from "../../../components/icon/Icon";
import { findRecommendedTagWithParent } from "./recommendedTags";
import type { MissingTagGroup } from "./transactionTags";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

export interface MissingTransactionTagsProps {
  /** One entry per distinct unresolved tag (with its affected-row count). */
  groups: MissingTagGroup[];
  /** Tags staged so far — the reassign targets. */
  tags: TagRequest[];
  /** Wallet accent colour, used for a created tag and the reassign highlight. */
  accentColor?: string;
  /** Create the missing tag in the draft (recreating its hierarchy if known). */
  onCreate: (name: string) => void;
  /** Point every transaction tagged `key` at an existing tag `toName`. */
  onReassign: (key: string, toName: string) => void;
  /** Drop every transaction tagged `key`. */
  onRemove: (key: string) => void;
}

/**
 * Resolution panel for staged transactions whose tag isn't in the wallet. Unlike
 * the Subscriptions step (per-row), transactions arrive in bulk, so conflicts are
 * grouped **per missing tag**: each amber card names the tag, says how many rows
 * use it, and offers three ways out — **create** it (rebuilding its Recommended
 * parent category when known), **reassign** all those rows to an existing tag, or
 * **remove** them. Resolving a card clears it (the rows are no longer unresolved).
 */
export function MissingTransactionTags({
  groups,
  tags,
  accentColor,
  onCreate,
  onReassign,
  onRemove,
}: MissingTransactionTagsProps): JSX.Element | null {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-xs font-semibold text-app-yellow">
        <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
        {groups.length === 1
          ? "1 tag used by these transactions isn't in this wallet."
          : `${groups.length} tags used by these transactions aren't in this wallet.`}
      </p>

      {groups.map((g) => {
        // A missing tag that is a known Recommended leaf carries a parent
        // category (e.g. "Netflix" → "Subscriptions"); surface it so the user
        // sees — and creates — the whole hierarchy, not a lone orphan tag.
        const recommended = findRecommendedTagWithParent(g.name);
        const parentName = recommended?.parent.name;

        const tagOptions = [
          { value: "", label: "Change tag…" },
          ...tags.map((t) => ({
            value: t.name,
            label: (
              <span className="flex items-center gap-2">
                <Icon icon={t.icon} color={t.colorHex} />
                {t.name}
              </span>
            ),
          })),
        ];

        return (
          <div
            key={g.key}
            className="rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 p-3"
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="flex items-center gap-1 rounded-[var(--r-sm)] border border-app-yellow/40 bg-app-yellow/10 px-2 py-0.5 text-[11px] font-medium text-app-yellow">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="text-[10px]"
                />
                {g.name}
                {parentName && (
                  <>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-[8px] opacity-60"
                    />
                    <span className="opacity-80">{parentName}</span>
                  </>
                )}
              </span>
              <span className="text-app-muted">
                {g.count === 1
                  ? "1 transaction uses it"
                  : `${g.count} transactions use it`}
              </span>
            </p>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                aria-label={`Create tag ${g.name}`}
                onClick={() => onCreate(g.name)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="inline-flex flex-wrap items-center justify-center gap-1">
                  Create
                  <span className="inline-flex items-center">
                    &ldquo;
                    {recommended && (
                      <Icon
                        icon={recommended.child.icon}
                        color={recommended.child.colorHex}
                        className="mr-1 text-sm"
                      />
                    )}
                    {g.name}&rdquo;
                  </span>
                  {parentName && (
                    <>
                      in
                      <span className="inline-flex items-center">
                        &ldquo;
                        {recommended && (
                          <Icon
                            icon={recommended.parent.icon}
                            color={recommended.parent.colorHex}
                            className="mr-1 text-sm"
                          />
                        )}
                        {parentName}&rdquo;
                      </span>
                    </>
                  )}
                </span>
              </Button>

              {tags.length > 0 && (
                <CustomSelect
                  value=""
                  onChange={(name) => name && onReassign(g.key, name)}
                  options={tagOptions}
                  activeColor={accentColor}
                  className="w-full rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3 py-2 text-sm text-app-text sm:w-56"
                />
              )}

              <button
                type="button"
                aria-label={`Remove transactions tagged ${g.name}`}
                onClick={() => onRemove(g.key)}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-semibold text-app-red transition-colors hover:bg-app-red/10"
              >
                <FontAwesomeIcon icon={faTrashCan} />
                {g.count === 1 ? "Remove 1" : `Remove ${g.count}`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MissingTransactionTags;
