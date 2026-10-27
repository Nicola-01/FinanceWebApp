import { type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { MissingTagActions, MissingTagChip } from "./MissingTagResolver";
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

        return (
          <div
            key={g.key}
            className="rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 p-3"
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <MissingTagChip name={g.name} parentName={parentName} />
              <span className="text-app-muted">
                {g.count === 1
                  ? "1 transaction uses it"
                  : `${g.count} transactions use it`}
              </span>
            </p>

            <MissingTagActions
              name={g.name}
              recommended={recommended}
              tags={tags}
              placeholder="Change tag…"
              accentColor={accentColor}
              className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
              onCreate={() => onCreate(g.name)}
              onReassign={(name) => onReassign(g.key, name)}
            >
              <button
                type="button"
                aria-label={`Remove transactions tagged ${g.name}`}
                onClick={() => onRemove(g.key)}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-semibold text-app-red transition-colors hover:bg-app-red/10"
              >
                <FontAwesomeIcon icon={faTrashCan} />
                {g.count === 1 ? "Remove 1" : `Remove ${g.count}`}
              </button>
            </MissingTagActions>
          </div>
        );
      })}
    </div>
  );
}

export default MissingTransactionTags;
