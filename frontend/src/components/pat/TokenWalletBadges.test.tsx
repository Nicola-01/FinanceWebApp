import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PatToken, Wallet } from "../../utils/types";
import { TokenWalletBadges } from "./TokenWalletBadges";

const token = (over: Partial<PatToken> = {}): PatToken => ({
  id: "t1",
  name: "CI Bot",
  tokenPrefix: "fin_pat_ab12",
  walletPermissions: [],
  createdAt: "2026-01-01T00:00:00Z",
  expiresAt: null,
  lastUsedAt: null,
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

describe("TokenWalletBadges (smoke)", () => {
  it("renders nothing when there are no wallet permissions", () => {
    const { container } = render(
      <TokenWalletBadges
        token={token({ walletPermissions: [] })}
        walletsMap={{}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a badge per wallet permission with the right access icon", () => {
    const { container } = render(
      <TokenWalletBadges
        token={token({
          walletPermissions: [
            { walletId: "wa", permissions: ["READ", "WRITE"] },
            { walletId: "wb", permissions: ["READ"] },
            { walletId: "wc", permissions: [] },
          ],
        })}
        walletsMap={{
          wa: wallet({ id: "wa", name: "Alpha" }),
          wb: wallet({ id: "wb", name: "Beta" }),
        }}
      />,
    );
    // WRITE -> pen, READ -> eye, empty -> ban.
    expect(container.querySelector('[data-icon="pen"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="eye"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="ban"]')).toBeInTheDocument();
  });

  it("resolves known wallet names and truncates unknown ids", () => {
    render(
      <TokenWalletBadges
        token={token({
          walletPermissions: [
            { walletId: "wa", permissions: ["READ"] },
            { walletId: "unknown-wallet-id", permissions: ["READ"] },
          ],
        })}
        walletsMap={{ wa: wallet({ id: "wa", name: "Alpha" }) }}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    // Unknown wallet falls back to a truncated id, never a blank label.
    expect(screen.getByText("unknown-...")).toBeInTheDocument();
  });
});
