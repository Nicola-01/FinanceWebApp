import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStickyNote, faTag } from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { FieldLabel } from "../../components/ui/FieldLabel";

interface Props {
  name: string;
  setName: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  selectedTagName: string;
  /** Wallet accent (hex) for the Notes field's focus border/ring. */
  accentColor?: string;
}

export const TransactionMetadataInputs: React.FC<Props> = ({
  name,
  setName,
  notes,
  setNotes,
  selectedTagName,
  accentColor,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* NAME - Full Row */}
      <div>
        <FieldLabel>
          <FontAwesomeIcon icon={faTag} className="mr-2" />
          Name
        </FieldLabel>
        <Input
          type="text"
          placeholder={selectedTagName || "e.g. Groceries"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* NOTES - Full Row, Taller, Not resizable */}
      <div>
        <FieldLabel>
          <FontAwesomeIcon icon={faStickyNote} className="mr-2" />
          Notes
        </FieldLabel>
        <Textarea
          className="min-h-[100px]"
          placeholder="Any details... (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
};
