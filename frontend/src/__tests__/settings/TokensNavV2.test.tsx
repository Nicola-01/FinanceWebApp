import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faUser, faKey } from "@fortawesome/free-solid-svg-icons";
import type { PatToken } from "../../types/domain";
import { setUiVersion } from "../../utils/uiVersion";

const hoisted = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  handleRevoke: vi.fn(),
  tokens: [] as unknown[],
}));

vi.mock("../../settings/tokens/useTokens", () => ({
  useTokens: () => ({
    tokens: hoisted.tokens,
    loading: false,
    walletsMap: {},
    revokingId: null,
    pausingId: null,
    selected: new Set<string>(),
    clearSelection: vi.fn(),
    bulkConfirm: false,
    setBulkConfirm: vi.fn(),
    bulkDeleting: false,
    bulkPausing: false,
    fetchTokens: vi.fn(),
    handleRevoke: hoisted.handleRevoke,
    handlePauseToggle: vi.fn(),
    toggleSelect: vi.fn(),
    selectAll: vi.fn(),
    handleBulkDelete: vi.fn(),
    handleBulkPause: vi.fn(),
  }),
}));
vi.mock("../../settings/tokens/useTokenDialog", () => ({
  useTokenDialog: () => ({ openCreate: vi.fn(), openEdit: vi.fn() }),
}));
vi.mock("../../settings/tokens/TokenDialog", () => ({
  TokenDialog: () => null,
}));
vi.mock("../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: { deleteObject: hoisted.deleteObject } }),
}));

import { TokensSection } from "../../settings/sections/TokensSection";
import { SettingsNav } from "../../settings/SettingsNav";
import type { SettingsSectionDef } from "../../settings/sections";

const manual: PatToken = {
  id: "t-manual",
  name: "My script",
  tokenPrefix: "fin_pat_aaa",
  walletPermissions: [],
  createdAt: "2026-01-02T10:00:00Z",
  expiresAt: null,
  lastUsedAt: null,
  paused: false,
};
const mcp: PatToken = {
  ...manual,
  id: "t-mcp",
  name: "OAuth: Claude",
  tokenPrefix: "fin_pat_bbb",
};

describe("Settings tokens + nav (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    window.__ENV__ = {};
    hoisted.deleteObject.mockReset();
    hoisted.handleRevoke.mockReset();
    hoisted.tokens = [manual, mcp];
  });

  it("renders token rows with a type badge and a revoke button that calls the handler", async () => {
    const user = userEvent.setup();
    render(<TokensSection />);

    const manualRow = screen.getByText("My script").closest("div.group");
    expect(manualRow).not.toBeNull();
    expect(manualRow).toHaveClass("min-h-14");
    expect(manualRow?.parentElement).toHaveClass("divide-y");
    expect(within(manualRow as HTMLElement).getByText("Manual")).toHaveClass(
      "bg-app-raised",
    );
    expect(screen.getByText("MCP", { selector: "span" })).toBeInTheDocument();

    const revokeButtons = screen.getAllByTitle("Revoke Token");
    expect(revokeButtons).toHaveLength(2);
    await user.click(revokeButtons[0]);

    expect(hoisted.deleteObject).toHaveBeenCalledWith(
      manual,
      "token",
      expect.any(Function),
      1,
    );
    // The confirm callback forwards to the revoke handler.
    const confirm = hoisted.deleteObject.mock
      .calls[0][2] as () => Promise<void>;
    await confirm();
    expect(hoisted.handleRevoke).toHaveBeenCalledWith("t-manual");
  });

  it("shows no bulk action bar and no selection hint without a selection", () => {
    render(<TokensSection />);

    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Hold a token to select/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pause" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("filters the list when a filter pill is chosen", async () => {
    const user = userEvent.setup();
    render(<TokensSection />);

    expect(screen.getByText("My script")).toBeInTheDocument();
    expect(screen.getByText("OAuth: Claude")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^MCP/ }));

    expect(screen.queryByText("My script")).not.toBeInTheDocument();
    expect(screen.getByText("OAuth: Claude")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Manual/ }));

    expect(screen.getByText("My script")).toBeInTheDocument();
    expect(screen.queryByText("OAuth: Claude")).not.toBeInTheDocument();
  });

  it("marks the active nav item and fires onNavigate on click", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const sections: SettingsSectionDef[] = [
      { id: "account", label: "Account", icon: faUser },
      { id: "tokens", label: "Tokens", icon: faKey, danger: true },
    ];
    render(
      <SettingsNav
        sections={sections}
        activeId="tokens"
        onNavigate={onNavigate}
      />,
    );

    const active = screen.getByRole("button", { name: "Tokens" });
    expect(active).toHaveAttribute("aria-current", "true");
    expect(active).toHaveClass("bg-app-raised", "text-app-text");
    expect(screen.getByRole("button", { name: "Account" })).not.toHaveAttribute(
      "aria-current",
    );

    await user.click(screen.getByRole("button", { name: "Account" }));
    expect(onNavigate).toHaveBeenCalledWith("account");
  });
});
