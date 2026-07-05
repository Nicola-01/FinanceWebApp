import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PatToken, Wallet } from "../../../utils/types";
import { PatListView } from "../../../modals/pat/PatListView";

const token = (over: Partial<PatToken> = {}): PatToken => ({
  id: "t1",
  name: "CI Bot",
  tokenPrefix: "fin_pat_ab12",
  walletPermissions: [{ walletId: "wa", permissions: ["READ"] }],
  createdAt: "2026-01-01T00:00:00Z",
  expiresAt: null,
  lastUsedAt: null,
  paused: false,
  ...over,
});

const wallet = (over: Partial<Wallet> = {}): Wallet => ({
  id: "wa",
  name: "Alpha",
  icon: "wallet",
  color: "#a78bfa",
  currency: "EUR",
  createdAt: "2026-01-01T00:00:00Z",
  userRole: "OWNER",
  ...over,
});

const walletsMap: Record<string, Wallet> = { wa: wallet() };

describe("PatListView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a loading spinner and no token content while loading", () => {
    const { container } = render(
      <PatListView loadingTokens tokens={[]} walletsMap={walletsMap} />,
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("No API tokens yet")).toBeNull();
  });

  it("renders the empty state and wires the Create button", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <PatListView
        loadingTokens={false}
        tokens={[]}
        walletsMap={walletsMap}
        onCreate={onCreate}
      />,
    );
    expect(screen.getByText("No API tokens yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create token/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("renders each provided token by name, with the prefix masked", () => {
    render(
      <PatListView
        loadingTokens={false}
        tokens={[
          token({ id: "t1", name: "CI Bot", tokenPrefix: "fin_pat_ab12" }),
          token({ id: "t2", name: "Budget", tokenPrefix: "fin_pat_cd34" }),
        ]}
        walletsMap={walletsMap}
      />,
    );
    expect(screen.getByText("CI Bot")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    // The raw prefix is hidden by default now; the row shows a masked placeholder.
    expect(screen.getAllByText("••••••••")).toHaveLength(2);
    expect(screen.queryByText(/fin_pat_ab12/)).toBeNull();
  });

  it("invokes onRevoke with the token id when the revoke action is used", async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn();
    render(
      <PatListView
        loadingTokens={false}
        tokens={[token({ id: "t9" })]}
        walletsMap={walletsMap}
        onRevoke={onRevoke}
      />,
    );
    await user.click(screen.getByRole("button", { name: /revoke token/i }));
    expect(onRevoke).toHaveBeenCalledWith("t9");
  });

  it("invokes onEdit with the token when the edit action is used", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const t = token({ id: "t9", name: "CI Bot" });
    render(
      <PatListView
        loadingTokens={false}
        tokens={[t]}
        walletsMap={walletsMap}
        onEdit={onEdit}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit permissions/i }));
    expect(onEdit).toHaveBeenCalledWith(t);
  });

  it("SECURITY: disables the revoke button for the token currently being revoked (no double-revoke)", () => {
    render(
      <PatListView
        loadingTokens={false}
        tokens={[token({ id: "t9" })]}
        walletsMap={walletsMap}
        onRevoke={vi.fn()}
        revokingId="t9"
      />,
    );
    expect(
      screen.getByRole("button", { name: /revoke token/i }),
    ).toBeDisabled();
  });

  it("select mode: clicking a row calls onSelect and hides revoke/edit actions", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onRevoke = vi.fn();
    const t = token({ id: "t9", name: "CI Bot" });
    render(
      <PatListView
        loadingTokens={false}
        tokens={[t]}
        walletsMap={walletsMap}
        isSelectMode
        onSelect={onSelect}
        onRevoke={onRevoke}
        onEdit={vi.fn()}
      />,
    );
    // No destructive actions are exposed in select mode.
    expect(screen.queryByRole("button", { name: /revoke token/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /edit permissions/i }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: /CI Bot/i }));
    expect(onSelect).toHaveBeenCalledWith(t);
    expect(onRevoke).not.toHaveBeenCalled();
  });

  it("resolves wallet names from walletsMap in the permission badges", () => {
    render(
      <PatListView
        loadingTokens={false}
        tokens={[
          token({
            walletPermissions: [{ walletId: "wa", permissions: ["READ"] }],
          }),
        ]}
        walletsMap={walletsMap}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
