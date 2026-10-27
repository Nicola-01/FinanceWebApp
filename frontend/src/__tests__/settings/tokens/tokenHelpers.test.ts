import { describe, it, expect } from "vitest";
import type { PatToken } from "../../../types/domain";
import {
  filterTokens,
  isMcpToken,
} from "../../../settings/tokens/tokenHelpers";

const tok = (name: string) => ({ id: name, name }) as PatToken;

describe("tokenHelpers", () => {
  it("detects OAuth-prefixed names as MCP tokens", () => {
    expect(isMcpToken(tok("  OAuth: Claude"))).toBe(true);
    expect(isMcpToken(tok("CI script"))).toBe(false);
  });

  it("filters by pill", () => {
    const list = [tok("oauth:x"), tok("manual")];
    expect(filterTokens(list, "all")).toHaveLength(2);
    expect(filterTokens(list, "mcp").map((t) => t.id)).toEqual(["oauth:x"]);
    expect(filterTokens(list, "manual").map((t) => t.id)).toEqual(["manual"]);
  });
});
