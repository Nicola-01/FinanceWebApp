import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PatToken, Wallet } from "../../../utils/types";
import { TokenListItem } from "../../../components/pat/TokenListItem";

const token = (over: Partial<PatToken> = {}): PatToken => ({
  id: "t1",
  name: "CI Bot",
  tokenPrefix: "fin_pat_ab12",
  walletPermissions: [{ walletId: "wa", permissions: ["READ"] }],
  createdAt: "2026-01-01T00:00:00Z",
  expiresAt: null,
  lastUsedAt: "2026-02-02T00:00:00Z",
  ...over,
});

const wallet = (over: Partial<Wallet> = {}): Wallet => ({
  id: "wa",
  name: "Alpha",
  icon: "💰",
  color: "#a78bfa",
  currency: "EUR",
  createdAt: "2026-01-01T00:00:00Z",
  userRole: "OWNER",
  ...over,
});

const walletsMap: Record<string, Wallet> = { wa: wallet() };

describe("TokenListItem (smoke)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the token name, masked prefix, wallet badge and metadata", () => {
    render(<TokenListItem token={token()} walletsMap={walletsMap} />);
    expect(screen.getByText("CI Bot")).toBeInTheDocument();
    expect(screen.getByText(/fin_pat_ab12\.\.\./)).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText(/Last used:/)).toBeInTheDocument();
  });

  it("renders as a clickable button and calls onClick with the token in select mode", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const t = token();
    render(
      <TokenListItem
        token={t}
        walletsMap={walletsMap}
        onClick={onClick}
        showActions={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /CI Bot/i }));
    expect(onClick).toHaveBeenCalledWith(t);
  });

  it("exposes edit/delete actions that fire their callbacks", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const t = token();
    render(
      <TokenListItem
        token={t}
        walletsMap={walletsMap}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit permissions/i }));
    await user.click(screen.getByRole("button", { name: /revoke token/i }));
    expect(onEdit).toHaveBeenCalledWith(t);
    expect(onDelete).toHaveBeenCalledWith(t);
  });

  it("copies the prefix (never the full token) when the copy affordance is used", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(
      <TokenListItem
        token={token()}
        walletsMap={walletsMap}
        showCopy
        onCopy={onCopy}
      />,
    );
    await user.click(screen.getByRole("button", { name: /copy prefix/i }));
    expect(onCopy).toHaveBeenCalledWith("fin_pat_ab12");
  });
});
