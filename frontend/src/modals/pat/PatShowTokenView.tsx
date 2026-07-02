import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

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
      <div className="flex items-start gap-3 rounded-xl border theme-border-warning theme-bg-warning-transparent p-4">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="mt-0.5 shrink-0 theme-text-warning"
        />
        <div>
          <p className="text-sm font-bold theme-text-warning-light">
            Copy your token now!
          </p>
          <p className="mt-0.5 text-xs theme-text-warning-muted">
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
          onClick={onCopy}
          className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            copied
              ? "bg-app-green/15 text-app-green"
              : "bg-app-input text-app-muted hover:bg-app-border hover:text-app-text"
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
      <button
        id="pat-done-btn"
        onClick={onDone}
        className="w-full rounded-xl border border-app-border bg-app-input py-3 text-sm font-semibold text-app-text transition-all hover:bg-app-border"
      >
        I've copied the token
      </button>
    </div>
  );
};
