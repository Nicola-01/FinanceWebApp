import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  paused: false,
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

  it("shows the name, the date on the secondary line, wallet badge and no checkbox", () => {
    render(<TokenListItem token={token()} walletsMap={walletsMap} />);
    expect(screen.getByText("CI Bot")).toBeInTheDocument();
    // Date now lives on the secondary line (where the prefix used to be).
    expect(screen.getByText(/Last used/)).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    // The visible checkbox has been removed in favour of long-press selection.
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("hides the token prefix by default and reveals it on the eye toggle", async () => {
    const user = userEvent.setup();
    render(<TokenListItem token={token()} walletsMap={walletsMap} />);
    // Masked by default; the real prefix is not in the DOM.
    expect(screen.getByText("••••••••")).toBeInTheDocument();
    expect(screen.queryByText(/fin_pat_ab12/)).toBeNull();

    await user.click(
      screen.getByRole("button", { name: /show token prefix/i }),
    );
    expect(screen.getByText(/fin_pat_ab12\.\.\./)).toBeInTheDocument();
  });

  it("never offers a token reveal for MCP (oauth:) tokens", () => {
    render(
      <TokenListItem
        token={token({ name: "oauth: Claude Desktop" })}
        walletsMap={walletsMap}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /show token prefix/i }),
    ).toBeNull();
    expect(screen.queryByText("••••••••")).toBeNull();
    expect(screen.queryByText(/fin_pat_ab12/)).toBeNull();
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

  it("toggles selection on a quick click while selection mode is active", async () => {
    const user = userEvent.setup();
    const onToggleSelect = vi.fn();
    const t = token();
    render(
      <TokenListItem
        token={t}
        walletsMap={walletsMap}
        selectionMode
        onToggleSelect={onToggleSelect}
        showActions={false}
      />,
    );
    await user.click(screen.getByText("CI Bot"));
    expect(onToggleSelect).toHaveBeenCalledWith(t);
  });

  it("fires onLongPressSelect after a press-and-hold", () => {
    vi.useFakeTimers();
    const onLongPressSelect = vi.fn();
    const t = token();
    const { container } = render(
      <TokenListItem
        token={t}
        walletsMap={walletsMap}
        onLongPressSelect={onLongPressSelect}
        showActions={false}
      />,
    );
    const row = container.firstChild as HTMLElement;
    fireEvent.pointerDown(row, { clientX: 0, clientY: 0 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPressSelect).toHaveBeenCalledWith(t);
    vi.useRealTimers();
  });
});
