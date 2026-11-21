import { afterEach, describe, expect, it } from "vitest";
import { mcpEndpoint } from "../../utils/mcpUrl";

describe("mcpEndpoint", () => {
  afterEach(() => {
    delete window.__ENV__;
  });

  it("returns null when no URL is configured", () => {
    expect(mcpEndpoint()).toBeNull();
  });

  it("appends /mcp to the runtime URL", () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com" };
    expect(mcpEndpoint()).toBe("https://mcp.example.com/mcp");
  });

  it("strips trailing slashes before appending /mcp", () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com//" };
    expect(mcpEndpoint()).toBe("https://mcp.example.com/mcp");
  });

  it("treats a blank runtime URL as unset", () => {
    window.__ENV__ = { mcpUrl: "   " };
    expect(mcpEndpoint()).toBeNull();
  });
});
