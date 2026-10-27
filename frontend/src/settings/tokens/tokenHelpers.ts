import type { PatToken } from "../../types/domain";

export type DialogView = "create" | "edit" | "showToken";
export type FilterKey = "all" | "manual" | "mcp";

// An OAuth/MCP-issued token is just a PAT whose name the consent flow prefixes
// with "OAuth:". Until the backend stores a real `source`/`clientName`, this
// name heuristic is the only signal distinguishing MCP connections from manual
// tokens.
export const isMcpToken = (t: PatToken) =>
  t.name.trim().toLowerCase().startsWith("oauth:");

/** Tokens visible under the given filter pill. */
export const filterTokens = (tokens: PatToken[], filter: FilterKey) =>
  tokens.filter((t) =>
    filter === "all" ? true : filter === "mcp" ? isMcpToken(t) : !isMcpToken(t),
  );
