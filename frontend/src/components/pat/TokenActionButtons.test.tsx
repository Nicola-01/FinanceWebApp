import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PatToken } from "../../utils/types";
import { TokenActionButtons } from "./TokenActionButtons";

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

describe("TokenActionButtons (smoke)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders edit and delete only when their handlers are provided", () => {
    const { rerender } = render(<TokenActionButtons token={token()} />);
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<TokenActionButtons token={token()} onEdit={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /edit permissions/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /revoke token/i })).toBeNull();
  });

  it("calls onEdit / onDelete with the token and stops propagation", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const parentClick = vi.fn();
    const t = token();
    render(
      <div onClick={parentClick}>
        <TokenActionButtons token={t} onEdit={onEdit} onDelete={onDelete} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: /edit permissions/i }));
    await user.click(screen.getByRole("button", { name: /revoke token/i }));
    expect(onEdit).toHaveBeenCalledWith(t);
    expect(onDelete).toHaveBeenCalledWith(t);
    // Row-level click must not bubble from the action buttons.
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("disables delete while this token is being revoked", () => {
    render(
      <TokenActionButtons
        token={token({ id: "t1" })}
        onDelete={vi.fn()}
        revokingId="t1"
      />,
    );
    expect(
      screen.getByRole("button", { name: /revoke token/i }),
    ).toBeDisabled();
  });
});
