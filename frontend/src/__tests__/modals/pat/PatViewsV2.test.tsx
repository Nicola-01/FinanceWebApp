import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WalletPermState } from "../../../types/domain";
import { PatFormView } from "../../../modals/pat/PatFormView";
import { PatShowTokenView } from "../../../modals/pat/PatShowTokenView";
import { setUiVersion } from "../../../utils/uiVersion";

const SECRET = "fin_pat_live_2b7f9c1d4e6a8b0c2d4e6f8a0b1c3d5e";

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

describe("PAT views (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  describe("PatFormView", () => {
    it("renders the token name as a card row with a flattened input", () => {
      render(
        <PatFormView
          isEdit={false}
          tokenName=""
          setTokenName={vi.fn()}
          walletPerms={[wp()]}
          setPermission={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
        />,
      );
      expect(screen.getByText("Name")).toBeInTheDocument();
      const input = screen.getByPlaceholderText(/CI\/CD Bot/i);
      expect(input).toHaveClass("text-right", "shadow-none", "bg-transparent");
      expect(input).not.toHaveClass("uppercase");
      expect(screen.queryByText("Token Name")).toBeNull();
    });

    it("keeps the locked name in edit mode (v2 row)", () => {
      render(
        <PatFormView
          isEdit
          tokenName="Existing"
          setTokenName={vi.fn()}
          walletPerms={[wp()]}
          setPermission={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
        />,
      );
      expect(screen.getByPlaceholderText(/CI\/CD Bot/i)).toBeDisabled();
    });

    it("renders one permission row per wallet under the Wallet access label", () => {
      render(
        <PatFormView
          isEdit={false}
          tokenName="CI Bot"
          setTokenName={vi.fn()}
          walletPerms={[
            wp({ walletId: "a", walletName: "Cash" }),
            wp({
              walletId: "b",
              walletName: "Savings",
              enabled: true,
              read: true,
            }),
          ]}
          setPermission={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          hideSubmit
        />,
      );
      expect(
        screen.getByRole("heading", { name: "Wallet access" }),
      ).toHaveClass("text-[13px]", "text-app-muted");
      expect(screen.getByText("Cash")).toBeInTheDocument();
      expect(screen.getByText("Savings")).toBeInTheDocument();
      expect(screen.getAllByRole("tab", { name: "Write" })).toHaveLength(2);
      expect(screen.queryByText("Wallet Permissions")).toBeNull();
    });

    it("delegates per-wallet permission picks to setPermission", async () => {
      const user = userEvent.setup();
      const setPermission = vi.fn();
      render(
        <PatFormView
          isEdit={false}
          tokenName="CI Bot"
          setTokenName={vi.fn()}
          walletPerms={[wp({ walletId: "wx", enabled: true, read: true })]}
          setPermission={setPermission}
          onSubmit={vi.fn()}
          isSubmitting={false}
          hideSubmit
        />,
      );
      await user.click(screen.getByRole("tab", { name: "Write" }));
      expect(setPermission).toHaveBeenCalledWith("wx", "write");
    });

    it("shows a spinner under the label while permissions load", () => {
      render(
        <PatFormView
          isEdit={false}
          tokenName="CI Bot"
          setTokenName={vi.fn()}
          walletPerms={[]}
          setPermission={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          hideSubmit
        />,
      );
      expect(
        screen.getByRole("heading", { name: "Wallet access" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Write" })).toBeNull();
    });

    it("hides the name row for OAuth consent but keeps the access rows", () => {
      render(
        <PatFormView
          isEdit={false}
          tokenName="Auto"
          setTokenName={vi.fn()}
          walletPerms={[wp({ enabled: true, read: true })]}
          setPermission={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          hideName
          hideSubmit
        />,
      );
      expect(screen.queryByText("Name")).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Wallet access" }),
      ).toBeInTheDocument();
    });
  });

  describe("PatShowTokenView", () => {
    it("shows the token inside a card with tabular numerals and no monospace", () => {
      render(
        <PatShowTokenView
          generatedToken={SECRET}
          copied={false}
          onCopy={vi.fn()}
          onDone={vi.fn()}
        />,
      );
      const code = screen.getByText(SECRET);
      expect(code.tagName.toLowerCase()).toBe("code");
      expect(code).toHaveAttribute("id", "pat-generated-token");
      const card = code.parentElement as HTMLElement;
      expect(card).toHaveClass(
        "bg-app-raised",
        "break-all",
        "tabular-nums",
        "text-[13px]",
      );
      expect(card.className).not.toContain("font-mono");
    });

    it("calls onCopy from the shared secondary Copy button", async () => {
      const user = userEvent.setup();
      const onCopy = vi.fn();
      render(
        <PatShowTokenView
          generatedToken={SECRET}
          copied={false}
          onCopy={onCopy}
          onDone={vi.fn()}
        />,
      );
      const copy = screen.getByRole("button", { name: /copy/i });
      expect(copy).toHaveAttribute("title", "Copy to clipboard");
      expect(copy).toHaveTextContent("Copy");
      await user.click(copy);
      expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it("shows the copied state after a copy", () => {
      render(
        <PatShowTokenView
          generatedToken={SECRET}
          copied
          onCopy={vi.fn()}
          onDone={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Copied" }),
      ).toBeInTheDocument();
    });

    it("renders the one-time warning as an inset-accent card", () => {
      render(
        <PatShowTokenView
          generatedToken={SECRET}
          copied={false}
          onCopy={vi.fn()}
          onDone={vi.fn()}
        />,
      );
      const title = screen.getByText(/copy your token now/i);
      const card = title.parentElement?.parentElement as HTMLElement;
      expect(card.className).toContain(
        "shadow-[inset_3px_0_0_var(--color-app-warn),var(--box-ring)]",
      );
      expect(card.querySelector("p:last-child")).toHaveClass("mt-0.5");
      expect(title.parentElement).toHaveClass("text-[13px]", "text-app-text");
      expect(screen.getByText(/only be shown once/i)).toBeInTheDocument();
    });

    it("calls onDone from the done button", async () => {
      const user = userEvent.setup();
      const onDone = vi.fn();
      render(
        <PatShowTokenView
          generatedToken={SECRET}
          copied={false}
          onCopy={vi.fn()}
          onDone={onDone}
        />,
      );
      await user.click(
        screen.getByRole("button", { name: /copied the token/i }),
      );
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
