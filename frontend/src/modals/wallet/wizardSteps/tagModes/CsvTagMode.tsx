import { CsvUploadField } from "../../../../components/ui/CsvUploadField";
import { TagCategoryPicker } from "../TagCategoryPicker";
import { groupTagRequests, type RecommendedTagGroup } from "../recommendedTags";
import type { TagRequest } from "../../../../dashboard/settings/csvImport";

export interface CsvTagModeProps {
  /** Tags parsed from the user's CSV upload(s), kept so they keep showing as
   *  (pre-selected) cards even after being merged into the staged list. */
  csvTags: TagRequest[];
  /** Names currently staged (lower-cased), to compute each card's state. */
  stagedKeys: Set<string>;
  /** Per-wallet accent colour (hex) for the uploader. */
  accentColor?: string;
  /** Called with the parsed tags when a CSV is uploaded. */
  onUpload: (dtos: TagRequest[]) => void;
  /** Toggle a whole category on/off. */
  onToggle: (group: RecommendedTagGroup) => void;
}

/**
 * "CSV" mode of the wallet wizard's Tags step. Before the first upload it shows
 * the full dropzone; afterwards it shrinks the uploader to a compact button and
 * echoes the uploaded tags as {@link TagCategoryPicker} cards (all pre-selected)
 * so more can be toggled off or re-added. The parent (TagsStep) owns the staged
 * list and remembers the uploaded tags.
 */
export function CsvTagMode({
  csvTags,
  stagedKeys,
  accentColor,
  onUpload,
  onToggle,
}: CsvTagModeProps) {
  if (csvTags.length === 0) {
    return (
      <CsvUploadField<TagRequest>
        resource="tags"
        title="Import tags from a CSV"
        columnsHint="Name, Icon, ColorHex, ParentName"
        noun="tag"
        accentColor={accentColor}
        onDtos={onUpload}
      />
    );
  }

  return (
    <div className="space-y-3">
      <CsvUploadField<TagRequest>
        resource="tags"
        title="Import tags from a CSV"
        noun="tag"
        accentColor={accentColor}
        compact
        onDtos={onUpload}
      />
      <TagCategoryPicker
        groups={groupTagRequests(csvTags)}
        stagedKeys={stagedKeys}
        onToggle={onToggle}
      />
    </div>
  );
}

export default CsvTagMode;
