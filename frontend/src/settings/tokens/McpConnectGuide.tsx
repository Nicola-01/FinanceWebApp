import React, { useEffect, useId, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faCopy,
  faPlug,
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { mcpEndpoint } from "../../utils/mcpUrl";
import { useUiVersion } from "../../hooks/useUiVersion";

const CopyField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const [copied, setCopied] = useState(false);
  const [ui] = useUiVersion();
  // ui-v2-switch: tabular figures instead of monospace.
  const isV2 = ui === "v2";

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard unavailable (insecure context); the field stays selectable.
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* The wrapper takes the free width so long URLs scroll inside the field. */}
      <div className="min-w-0 flex-1">
        <Input
          readOnly
          value={value}
          aria-label={label}
          className={`w-full ${isV2 ? "" : "font-mono "}text-[13px] tabular-nums`}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0"
        onClick={handleCopy}
        title={`Copy ${label.toLowerCase()}`}
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
};

type ClientId = "claude" | "claude-code" | "chatgpt" | "other";

const CLIENT_OPTIONS: { value: ClientId; label: string }[] = [
  { value: "claude", label: "Claude" },
  { value: "claude-code", label: "Claude Code" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "other", label: "Other" },
];

/** Shown above the token list only when an MCP server URL is configured. */
export const McpConnectGuide: React.FC = () => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  const endpoint = mcpEndpoint();
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState<ClientId>("claude");
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  if (!endpoint) return null;

  const claudeCodeCommand = `claude mcp add --transport http finance ${endpoint}`;

  const steps: Record<ClientId, React.ReactNode> = {
    claude: (
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        <li>
          Settings → Connectors → Add custom connector, then paste the URL.
        </li>
        <li>Click Connect, then approve access on the consent page.</li>
      </ol>
    ),
    "claude-code": (
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        <li>
          Run this command in your terminal:
          <div className="mt-2">
            <CopyField label="Claude Code command" value={claudeCodeCommand} />
          </div>
        </li>
        <li>
          Run <code className={isV2 ? "tabular-nums" : "font-mono"}>/mcp</code>{" "}
          in Claude Code and pick finance to sign in.
        </li>
      </ol>
    ),
    chatgpt: (
      <>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>
            Settings → Apps &amp; Connectors → Advanced settings, then turn on
            Developer mode.
          </li>
          <li>Back in Apps &amp; Connectors, choose Create.</li>
          <li>
            Name it (for example Finance), paste the URL, set Authentication to
            OAuth, then Create.
          </li>
          <li>Sign in and approve access on the consent page.</li>
        </ol>
        <p className="text-app-muted">
          Developer mode needs a paid ChatGPT plan.
        </p>
      </>
    ),
    other: (
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        <li>
          Add a remote MCP server (streamable HTTP) with this URL; OAuth sign-in
          starts automatically.
        </li>
      </ol>
    ),
  };

  return (
    <Card
      icon={faPlug}
      title="Connect an MCP client"
      description={
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-app-muted">
            Use your finance data from Claude or any MCP client. You'll sign in
            with this account; access is limited to the wallets you allow.
          </p>
          <div className="flex flex-col items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Hide setup steps" : "Show setup steps"}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
              />
            </Button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="setup-steps"
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.2,
                    ease: "easeOut",
                  }}
                  className="w-full overflow-hidden"
                >
                  <div
                    className={`flex flex-col gap-3 rounded-[var(--r-input)] p-4 text-[13px] text-app-text ${isV2 ? "bg-app-raised" : "bg-app-input"}`}
                  >
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">Server URL</p>
                      <CopyField label="MCP server URL" value={endpoint} />
                    </div>
                    <SegmentedControl
                      aria-label="MCP client"
                      size="sm"
                      value={client}
                      onChange={setClient}
                      options={CLIENT_OPTIONS}
                    />
                    {steps[client]}
                    <p className="text-app-muted">
                      Connected apps show up in the list below; you can pause or
                      revoke them anytime.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      }
    />
  );
};
