import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WalletPermState } from "../../../utils/types";
import { WalletPermissionSelector } from "../../../components/pat/WalletPermissionSelector";

// Factory for a wallet-permission row. Defaults to a fully disabled ("none")
// state so each test opts into exactly the flags it exercises.
const wp = (over: Partial<WalletPermState> = {}): WalletPermState => ({
  walletId: "w1",
  walletName: "Cash",
  walletIcon: "wallet",
  walletColor: "#a78bfa",
  userRole: "OWNER",
  enabled: false,
  read: false,
  write: false,
  ...over,
});

// The shared <Selector> marks the active segment with the "font-bold" class.
const isActive = (btn: HTMLElement) => btn.className.includes("font-bold");

describe("WalletPermissionSelector", () => {
  let setPermission: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setPermission = vi.fn();
  });

  it("renders a three-way control (Unauthorized/Read/Write) per wallet", () => {
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ walletId: "a", walletName: "Alpha" })]}
        setPermission={setPermission}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Unauthorized" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Write" })).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("shows Unauthorized as active for a disabled wallet (contributes no permission)", () => {
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ enabled: false })]}
        setPermission={setPermission}
      />,
    );
    expect(isActive(screen.getByRole("button", { name: "Unauthorized" }))).toBe(
      true,
    );
    expect(isActive(screen.getByRole("button", { name: "Read" }))).toBe(false);
    expect(isActive(screen.getByRole("button", { name: "Write" }))).toBe(false);
  });

  it("shows Read as active for an enabled read-only wallet", () => {
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ enabled: true, read: true, write: false })]}
        setPermission={setPermission}
      />,
    );
    expect(isActive(screen.getByRole("button", { name: "Read" }))).toBe(true);
    expect(isActive(screen.getByRole("button", { name: "Write" }))).toBe(false);
    expect(isActive(screen.getByRole("button", { name: "Unauthorized" }))).toBe(
      false,
    );
  });

  it("SECURITY: write is the superset tier — a write wallet shows Write active, never a bare Read", () => {
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ enabled: true, read: true, write: true })]}
        setPermission={setPermission}
      />,
    );
    // With write enabled the control resolves to the "write" value: Write is the
    // single active tier (write implies read, so read is not shown as a separate
    // lower selection).
    expect(isActive(screen.getByRole("button", { name: "Write" }))).toBe(true);
    expect(isActive(screen.getByRole("button", { name: "Read" }))).toBe(false);
    expect(isActive(screen.getByRole("button", { name: "Unauthorized" }))).toBe(
      false,
    );
  });

  it("emits setPermission(walletId, 'none') when Unauthorized is clicked", async () => {
    const user = userEvent.setup();
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ walletId: "abc", enabled: true, read: true })]}
        setPermission={setPermission}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Unauthorized" }));
    expect(setPermission).toHaveBeenCalledTimes(1);
    expect(setPermission).toHaveBeenCalledWith("abc", "none");
  });

  it("emits setPermission(walletId, 'read') when Read is clicked", async () => {
    const user = userEvent.setup();
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ walletId: "abc", enabled: false })]}
        setPermission={setPermission}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Read" }));
    expect(setPermission).toHaveBeenCalledWith("abc", "read");
  });

  it("emits setPermission(walletId, 'write') when Write is clicked", async () => {
    const user = userEvent.setup();
    render(
      <WalletPermissionSelector
        walletPerms={[wp({ walletId: "abc", enabled: true, read: true })]}
        setPermission={setPermission}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Write" }));
    expect(setPermission).toHaveBeenCalledWith("abc", "write");
  });

  it("SECURITY: a VIEWER cannot escalate to write — Write is disabled and clicking it is a no-op", async () => {
    const user = userEvent.setup();
    render(
      <WalletPermissionSelector
        walletPerms={[
          wp({ walletId: "abc", userRole: "VIEWER", enabled: true }),
        ]}
        setPermission={setPermission}
      />,
    );
    const writeBtn = screen.getByRole("button", { name: "Write" });
    expect(writeBtn).toBeDisabled();
    await user.click(writeBtn);
    expect(setPermission).not.toHaveBeenCalled();
  });

  it("keeps Read/Unauthorized usable for a VIEWER (only write is blocked)", async () => {
    const user = userEvent.setup();
    render(
      <WalletPermissionSelector
        walletPerms={[
          wp({ walletId: "abc", userRole: "VIEWER", enabled: false }),
        ]}
        setPermission={setPermission}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Read" }));
    expect(setPermission).toHaveBeenCalledWith("abc", "read");
  });

  it("SECURITY: routes each click to the correct wallet id (no cross-wallet leakage)", async () => {
    const user = userEvent.setup();
    render(
      <WalletPermissionSelector
        walletPerms={[
          wp({
            walletId: "wa",
            walletName: "Alpha",
            enabled: true,
            read: true,
          }),
          wp({ walletId: "wb", walletName: "Beta", enabled: false }),
        ]}
        setPermission={setPermission}
      />,
    );
    // Buttons are rendered in wallet order: [0] -> Alpha, [1] -> Beta.
    const writeButtons = screen.getAllByRole("button", { name: "Write" });
    await user.click(writeButtons[1]); // Beta's Write
    expect(setPermission).toHaveBeenCalledTimes(1);
    expect(setPermission).toHaveBeenCalledWith("wb", "write");
  });
});
