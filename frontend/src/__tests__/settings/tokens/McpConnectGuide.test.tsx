import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { McpConnectGuide } from "../../../settings/tokens/McpConnectGuide";

describe("McpConnectGuide", () => {
  const writeText = vi.fn();

  const openSteps = () =>
    fireEvent.click(screen.getByRole("button", { name: "Show setup steps" }));

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

  it("keeps the setup steps hidden until the toggle is clicked", () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com" };
    render(<McpConnectGuide />);

    expect(screen.getByText("Connect an MCP client")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Show setup steps" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("MCP server URL")).not.toBeInTheDocument();
    expect(screen.queryByText(/Add custom connector/)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(
      screen.getByRole("button", { name: "Hide setup steps" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("MCP server URL")).toHaveValue(
      "https://mcp.example.com/mcp",
    );
    expect(screen.getByText(/Add custom connector/)).toBeInTheDocument();
  });

  it("shows the Claude Code command for the Claude Code client", () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com/" };
    render(<McpConnectGuide />);
    openSteps();

    fireEvent.click(screen.getByRole("tab", { name: "Claude Code" }));

    expect(screen.getByLabelText("Claude Code command")).toHaveValue(
      "claude mcp add --transport http finance https://mcp.example.com/mcp",
    );
    expect(screen.queryByText(/Add custom connector/)).not.toBeInTheDocument();
  });

  it("shows the Developer mode step when ChatGPT is selected", () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com" };
    render(<McpConnectGuide />);
    openSteps();

    fireEvent.click(screen.getByRole("tab", { name: "ChatGPT" }));

    expect(screen.getByText(/then turn on Developer mode/)).toBeInTheDocument();
    expect(
      screen.getByText("Developer mode needs a paid ChatGPT plan."),
    ).toBeInTheDocument();
  });

  it("copies the endpoint to the clipboard", async () => {
    window.__ENV__ = { mcpUrl: "https://mcp.example.com" };
    render(<McpConnectGuide />);
    openSteps();

    fireEvent.click(screen.getAllByRole("button", { name: /copy/i })[0]);

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("https://mcp.example.com/mcp"),
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
