import type {Tag} from "../utils/types.ts";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {type IconKey, ICONS} from "../utils/icons.ts";
import {faChevronRight, faTags} from "@fortawesome/free-solid-svg-icons";
import {useWalletContext} from "../dashboard/wallet/WalletContext.tsx";

export const TagBadge = ({tag, showParent = true, forceShowParent = false}: { tag: Tag | any, showParent?: boolean, forceShowParent?: boolean }) => {
    if (!tag) return null;
    const {tags} = useWalletContext();

    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-max shrink-0"
                style={{
                    backgroundColor: `${tag.colorHex}15`,
                    color: tag.colorHex,
                    border: `1px solid ${tag.colorHex}30`
                }}
            >
                <FontAwesomeIcon icon={ICONS[tag.icon as IconKey] || faTags} className="text-[10px] opacity-70"/>
                {tag.name}
            </span>

            {showParent && tag.parentName && (
                <span className={`${forceShowParent ? "flex" : "hidden sm:flex"} items-center gap-1.5`}>
                    <FontAwesomeIcon icon={faChevronRight} className="text-[8px] text-white/20 shrink-0"/>
                    <TagBadge tag={tags.find(t => t.name === tag.parentName)} forceShowParent={forceShowParent}/>
                </span>
            )}
        </span>
    );
};