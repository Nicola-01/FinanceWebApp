import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faPlus,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { Icon } from "../../../components/icon/Icon";
import type { findRecommendedTagWithParent } from "./recommendedTags";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

type RecommendedMatch = ReturnType<typeof findRecommendedTagWithParent>;

/** Amber flag naming a tag that isn't in the wallet (plus its known parent). */
export function MissingTagChip({
  name,
  parentName,
}: {
  name: string;
  parentName?: string;
}) {
  return (
    <span className="flex items-center gap-1 rounded-[var(--r-sm)] border border-app-yellow/40 bg-app-yellow/10 px-2 py-0.5 text-[11px] font-medium text-app-yellow">
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
      {name}
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
  );
}

export interface MissingTagActionsProps {
  /** The missing tag's name. */
  name: string;
  /** Its Recommended match (child + parent), when it is a known preset leaf. */
  recommended?: RecommendedMatch;
  /** Staged tags — the reassign targets (the select hides when empty). */
  tags: TagRequest[];
  /** Placeholder option of the reassign select. */
  placeholder: string;
  accentColor?: string;
  /** Layout classes of the action row. */
  className: string;
  onCreate: () => void;
  onReassign: (toName: string) => void;
  /** Extra trailing actions (e.g. a remove button). */
  children?: ReactNode;
}

/**
 * The resolve actions shared by the wizard's missing-tag panels: **create** the
 * tag (rebuilding its Recommended parent when known) or **reassign** to an
 * existing staged tag.
 */
export function MissingTagActions({
  name,
  recommended,
  tags,
  placeholder,
  accentColor,
  className,
  onCreate,
  onReassign,
  children,
}: MissingTagActionsProps) {
  const parentName = recommended?.parent.name;
  const tagOptions = [
    { value: "", label: placeholder },
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
    <div className={className}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        aria-label={`Create tag ${name}`}
        onClick={onCreate}
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
            {name}&rdquo;
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
          onChange={(toName) => toName && onReassign(toName)}
          options={tagOptions}
          activeColor={accentColor}
          className="w-full rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3 py-2 text-sm text-app-text sm:w-56"
        />
      )}

      {children}
    </div>
  );
}
