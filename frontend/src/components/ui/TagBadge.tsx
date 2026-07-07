import type React from "react";
import { useContext } from "react";
import type { Tag } from "../../utils/types.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { faChevronRight, faTags } from "@fortawesome/free-solid-svg-icons";
import { WalletContext } from "../../dashboard/wallet/WalletContext.tsx";

export const TagBadge = ({
  tag,
  tags: tagsProp,
  showParent = true,
  forceShowParent = false,
  compact = false,
  onClick,
}: {
  tag?: Tag;
  /** Tag list used to resolve `parentName`. Defaults to the wallet context;
   *  pass it explicitly when rendering outside a WalletProvider (e.g. the
   *  wallet-creation wizard) so the badge still shows the parent chain. */
  tags?: Tag[];
  showParent?: boolean;
  forceShowParent?: boolean;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  // Read the wallet context when present, but don't require it: TagBadge is also
  // used where no WalletProvider exists, in which case the caller supplies `tags`.
  const ctx = useContext(WalletContext);
  const tags = tagsProp ?? ctx?.tags ?? [];
  if (!tag) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${compact ? "min-w-0 w-full" : ""}`}
      onClick={onClick}
    >
      {showParent && tag.parentName && (
        <span
          className={`${forceShowParent ? "flex" : "hidden sm:flex"} items-center gap-1.5`}
        >
          <TagBadge
            tag={tags.find((t) => t.name === tag.parentName)}
            tags={tags}
            forceShowParent={forceShowParent}
          />
          <FontAwesomeIcon
            icon={faChevronRight}
            className="text-[8px] text-app-muted shrink-0"
          />
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider ${
          compact
            ? "px-1 py-px text-[8px] sm:text-[10px] sm:px-2 sm:py-0.5 min-w-0 truncate"
            : "px-2 py-0.5 text-[10px] gap-1.5 w-max shrink-0"
        }`}
        style={{
          backgroundColor: `${tag.colorHex}15`,
          color: tag.colorHex,
          border: `1px solid ${tag.colorHex}30`,
        }}
      >
        <FontAwesomeIcon
          icon={ICONS[tag.icon as IconKey] || faTags}
          className={`${compact ? "text-[8px] sm:text-[10px]" : "text-[10px]"} opacity-70 shrink-0`}
        />
        <span className={compact ? "truncate" : ""}>{tag.name}</span>
      </span>
    </span>
  );
};
