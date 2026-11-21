// Public MCP endpoint for connecting clients. Runtime value (prod, from
// config.js) wins over the build-time VITE_MCP_URL (local dev).
export const mcpEndpoint = (): string | null => {
  const base = (window.__ENV__?.mcpUrl || import.meta.env.VITE_MCP_URL || "")
    .trim()
    .replace(/\/+$/, "");
  return base ? `${base}/mcp` : null;
};
