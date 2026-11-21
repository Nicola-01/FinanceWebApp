import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faPlug } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
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
      <Input
        readOnly
        value={value}
        aria-label={label}
        className={`${isV2 ? "" : "font-mono "}text-[13px] tabular-nums`}
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleCopy}
        title={`Copy ${label.toLowerCase()}`}
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
};

/** Shown above the token list only when an MCP server URL is configured. */
export const McpConnectGuide: React.FC = () => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  const endpoint = mcpEndpoint();
  if (!endpoint) return null;

  const claudeCodeCommand = `claude mcp add --transport http finance ${endpoint}`;

  return (
    <Card
      icon={faPlug}
      title="Connect an MCP client"
      description={
        <div className="space-y-4">
          <p className="text-[13px] text-app-muted">
            Use your finance data from Claude or any MCP client. You'll sign in
            with this account; access is limited to the wallets you allow.
          </p>
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-app-text">
              MCP server URL
            </p>
            <CopyField label="MCP server URL" value={endpoint} />
          </div>
        </div>
      }
    >
      {/* ui-v2-switch: gap-4 between steps; code snippets use tabular figures. */}
      <ol
        className={`list-decimal pl-5 text-[15px] text-app-text ${isV2 ? "flex flex-col gap-4" : "space-y-3"}`}
      >
        <li>
          <span className="font-semibold">Claude (web/desktop):</span> Settings
          → Connectors → Add custom connector → paste the URL → Connect, then
          approve on the consent page.
        </li>
        <li>
          <span className="font-semibold">Claude Code:</span> run this command,
          then <code className={isV2 ? "tabular-nums" : "font-mono"}>/mcp</code>{" "}
          to sign in.
          <div className="mt-2">
            <CopyField label="Claude Code command" value={claudeCodeCommand} />
          </div>
        </li>
        <li>
          <span className="font-semibold">Other clients:</span> add a remote
          (streamable HTTP) server with this URL; OAuth sign-in starts
          automatically.
        </li>
      </ol>
      <p className="mt-4 text-[13px] text-app-muted">
        Connected apps appear in the list below and can be revoked anytime.
      </p>
    </Card>
  );
};
