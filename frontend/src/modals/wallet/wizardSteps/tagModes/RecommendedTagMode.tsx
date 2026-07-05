import { TagCategoryPicker } from "../TagCategoryPicker";
import {
  RECOMMENDED_TAG_GROUPS,
  type RecommendedTagGroup,
} from "../recommendedTags";

export interface RecommendedTagModeProps {
  /** Names currently staged (lower-cased), to compute each card's state. */
  stagedKeys: Set<string>;
  /** Toggle a whole preset category on/off. */
  onToggle: (group: RecommendedTagGroup) => void;
}

/**
 * "Recommended" mode of the wallet wizard's Tags step: a grid of the curated
 * preset categories. Purely a thin wrapper around {@link TagCategoryPicker} fed
 * with {@link RECOMMENDED_TAG_GROUPS}; the parent (TagsStep) owns the staged
 * list and the toggle logic.
 */
export function RecommendedTagMode({
  stagedKeys,
  onToggle,
}: RecommendedTagModeProps) {
  return (
    <TagCategoryPicker
      groups={RECOMMENDED_TAG_GROUPS}
      stagedKeys={stagedKeys}
      onToggle={onToggle}
    />
  );
}

export default RecommendedTagMode;
