import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";

interface PatShowTokenViewProps {
  generatedToken: string;
  copied: boolean;
  onCopy: () => void;
  onDone: () => void;
}

export const PatShowTokenView: React.FC<PatShowTokenViewProps> = ({
  generatedToken,
  copied,
  onCopy,
  onDone,
}) => {
  return (
    <div className="space-y-5">
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/10 p-4">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="mt-0.5 shrink-0 text-app-yellow"
        />
        <div>
          <p className="text-sm font-bold text-app-yellow">
            Copy your token now!
          </p>
          <p className="mt-0.5 text-xs text-app-muted">
            This token will only be shown once. You won't be able to see it
            again after closing this dialog.
          </p>
        </div>
      </div>

      {/* Token display */}
      <div className="relative">
        <div className="rounded-xl border border-app-border bg-app-bg p-4 pr-14">
          <code
            id="pat-generated-token"
            className="block w-full break-all text-sm font-mono text-app-green leading-relaxed select-all"
          >
            {generatedToken}
          </code>
        </div>

        {/* Copy button */}
        <button
          id="pat-copy-btn"
          type="button"
          onClick={onCopy}
          className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--r-sm)] transition-colors ${
            copied
              ? "bg-app-green/15 text-app-green"
              : "bg-app-input text-app-muted hover:bg-app-hover hover:text-app-text"
          }`}
          title="Copy to clipboard"
        >
          <FontAwesomeIcon
            icon={copied ? faCheck : faCopy}
            className="text-sm"
          />
        </button>
      </div>

      {/* Done button */}
      <Button id="pat-done-btn" variant="secondary" fullWidth onClick={onDone}>
        I've copied the token
      </Button>
    </div>
  );
};
