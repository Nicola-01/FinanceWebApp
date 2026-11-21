import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import { useUiVersion } from "../../hooks/useUiVersion";

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
  const [ui] = useUiVersion(); // ui-v2-switch
  const isV2 = ui === "v2";

  if (isV2) {
    return (
      <div className="flex flex-col gap-4">
        {/* Warning card */}
        <div className="flex items-start gap-3 rounded-[var(--r-card)] bg-app-card p-4 shadow-[inset_3px_0_0_var(--color-app-warn),var(--box-ring)]">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="mt-0.5 shrink-0 text-app-warn"
          />
          <div className="text-[13px] text-app-text">
            <p className="font-semibold">Copy your token now!</p>
            <p className="mt-0.5">
              This token will only be shown once. You won't be able to see it
              again after closing this dialog.
            </p>
          </div>
        </div>

        {/* Token display */}
        <div className="flex flex-col gap-3">
          <div className="rounded-[var(--r-card)] bg-app-raised p-4 break-all tabular-nums text-[13px]">
            <code
              id="pat-generated-token"
              className="block select-all text-app-text"
            >
              {generatedToken}
            </code>
          </div>
          <div className="flex justify-end">
            <Button
              id="pat-copy-btn"
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCopy}
              title="Copy to clipboard"
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Done button */}
        <Button
          id="pat-done-btn"
          variant="secondary"
          fullWidth
          onClick={onDone}
        >
          I've copied the token
        </Button>
      </div>
    );
  }

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
