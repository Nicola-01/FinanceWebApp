import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { McpConnectGuide } from "../../../settings/tokens/McpConnectGuide";

describe("McpConnectGuide", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    delete window.__ENV__;
  });

  it("renders nothing when no MCP URL is configured", () => {
    window.__ENV__ = {};
    const { container } = render(<McpConnectGuide />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the /mcp endpoint and the Claude Code command", () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com/" };
    render(<McpConnectGuide />);

    expect(screen.getByText("Connect an MCP client")).toBeInTheDocument();
    expect(screen.getByLabelText("MCP server URL")).toHaveValue(
      "https://mcp.example.com/mcp",
    );
    expect(screen.getByLabelText("Claude Code command")).toHaveValue(
      "claude mcp add --transport http finance https://mcp.example.com/mcp",
    );
  });

  it("copies the endpoint to the clipboard", async () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com" };
    render(<McpConnectGuide />);

    fireEvent.click(screen.getAllByRole("button", { name: /copy/i })[0]);

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("https://mcp.example.com/mcp"),
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
