import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStickyNote, faTag } from '@fortawesome/free-solid-svg-icons';

interface Props {
    name: string;
    setName: (val: string) => void;
    notes: string;
    setNotes: (val: string) => void;
    selectedTagName: string;
}

export const TransactionMetadataInputs: React.FC<Props> = ({
                                                               name,
                                                               setName,
                                                               notes,
                                                               setNotes,
                                                               selectedTagName
                                                           }) => {
    return (
        <div className="flex flex-col gap-4">
            {/* NAME - Full Row */}
            <div>
                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                    <FontAwesomeIcon icon={faTag} className="mr-2" />
                    Name
                </label>
                <input
                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                    type="text"
                    placeholder={selectedTagName || "e.g. Groceries"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            {/* NOTES - Full Row, Taller, Not resizable */}
            <div>
                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                    <FontAwesomeIcon icon={faStickyNote} className="mr-2" />
                    Notes
                </label>
                <textarea
                    className="w-full min-h-[100px] resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                    placeholder="Any details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                />
            </div>
        </div>
    );
};