import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { WalletsBar } from "../../../dashboard/wallet/WalletsBar";
import { useInvitations } from "../../../dashboard/wallet/useInvitations";
import type { Invitation, Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const wizardOpenModal = vi.hoisted(() => vi.fn());

vi.mock("../../../dashboard/wallet/useInvitations", () => ({
  useInvitations: vi.fn(),
}));

vi.mock("../../../modals/wallet/CreateWalletWizard.tsx", async () => {
  const React = await import("react");
  const CreateWalletWizard = React.forwardRef((_props: unknown, ref) => {
    React.useImperativeHandle(ref, () => ({ openModal: wizardOpenModal }));
    return null;
  });
  return { CreateWalletWizard, default: CreateWalletWizard };
});

vi.mock("../../../modals/wallet/InviteModal", () => ({
  InviteModal: () => null,
}));

const groceries: Wallet = {
  id: "w1",
  name: "Groceries",
  icon: "wallet",
  color: "#f2cc2f",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const holiday: Wallet = {
  id: "w2",
  name: "Holiday",
  icon: "wallet",
  color: "#f2cc2f",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const invite: Invitation = {
  walletOwner: "Alice",
  role: "VIEWER",
  status: "PENDING",
  invitedAt: "2026-01-02",
  wallet: {
    id: "w3",
    name: "Shared Trip",
    icon: "wallet",
    color: "#22c55e",
    currency: "EUR",
    createdAt: "2026-01-02",
    userRole: "VIEWER",
  },
};

const originalMatchMedia = window.matchMedia;

/** Stub matchMedia so the `(min-width: 1024px)` query matches (desktop) or not (phone). */
function stubDesktop(desktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: desktop,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

function setInvites(invites: Invitation[]) {
  vi.mocked(useInvitations).mockReturnValue({
    invites,
    loading: false,
    accept: vi.fn(),
    reject: vi.fn(),
  } as unknown as ReturnType<typeof useInvitations>);
}

function renderBar(props: Partial<Parameters<typeof WalletsBar>[0]> = {}) {
  const onSelectWallet = vi.fn();
  const utils = render(
    <WalletsBar
      wallets={[groceries, holiday]}
      setWallets={vi.fn()}
      loading={false}
      selectedWalletId="w1"
      onSelectWallet={onSelectWallet}
      onRefreshAll={vi.fn()}
      {...props}
    />,
  );
  return { ...utils, onSelectWallet };
}

describe("WalletsBar (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    wizardOpenModal.mockReset();
    setInvites([]);
  });

  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  });

  describe("desktop sidebar", () => {
    beforeEach(() => {
      stubDesktop(true);
    });

    it("renders the brand, wallet links and the invitations count", () => {
      setInvites([invite]);
      renderBar();

      const aside = screen.getByRole("complementary");
      expect(within(aside).getByText("My Wallet")).toBeInTheDocument();
      expect(within(aside).getByText("Wallets")).toBeInTheDocument();
      expect(
        within(aside).getByRole("button", { name: /Groceries/ }),
      ).toBeInTheDocument();
      expect(
        within(aside).getByRole("button", { name: /Holiday/ }),
      ).toBeInTheDocument();

      const invitesButton = within(aside).getByRole("button", {
        name: /Invitations/,
      });
      expect(within(invitesButton).getByText("1")).toBeInTheDocument();
    });

    it("reveals the invitations when the Invitations button is clicked", () => {
      setInvites([invite]);
      renderBar();

      const invitesButton = screen.getByRole("button", { name: /Invitations/ });
      expect(invitesButton).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByRole("button", {
          name: "Respond to invitation for Shared Trip",
        }),
      ).not.toBeInTheDocument();

      fireEvent.click(invitesButton);

      expect(invitesButton).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("button", {
          name: "Respond to invitation for Shared Trip",
        }),
      ).toBeInTheDocument();
    });

    it("opens the create-wallet wizard from the New wallet button", () => {
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: /New wallet/ }));

      expect(wizardOpenModal).toHaveBeenCalledTimes(1);
    });

    it("selects a wallet when its link is clicked", () => {
      const { onSelectWallet } = renderBar();

      fireEvent.click(screen.getByRole("button", { name: /Holiday/ }), {
        button: 0,
      });

      expect(onSelectWallet).toHaveBeenCalledWith("w2");
    });
  });

  describe("phone switcher", () => {
    beforeEach(() => {
      stubDesktop(false);
    });

    it("shows the selected wallet name and the actions slot", () => {
      renderBar({ actions: <button type="button">Sync now</button> });

      const switchButton = screen.getByRole("button", {
        name: "Switch wallet",
      });
      expect(within(switchButton).getByText("Groceries")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sync now" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    });

    it("opens the drawer with wallets and New wallet, without Invitations when empty", () => {
      renderBar();

      // SwipeableDrawer keeps its content mounted while closed; hidden content is excluded from role queries.
      expect(
        screen.queryByRole("button", { name: /Holiday/ }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Switch wallet" }));

      expect(screen.getByText("Wallets")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Holiday/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /New wallet/ }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Invitations")).not.toBeInTheDocument();
    });

    it("lists invitations in the drawer when there are any", () => {
      setInvites([invite]);
      renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Switch wallet" }));

      expect(screen.getByText("Invitations")).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Respond to invitation for Shared Trip",
        }),
      ).toBeInTheDocument();
    });

    it("selects the clicked wallet and closes the drawer", async () => {
      const { onSelectWallet } = renderBar();

      fireEvent.click(screen.getByRole("button", { name: "Switch wallet" }));
      fireEvent.click(screen.getByRole("button", { name: /Holiday/ }), {
        button: 0,
      });

      expect(onSelectWallet).toHaveBeenCalledWith("w2");
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: /Holiday/ }),
        ).not.toBeInTheDocument(),
      );
    });
  });

  it("keeps the v1 'Add New Wallet' tile in the v1 layout", () => {
    setUiVersion("v1");
    stubDesktop(false);
    renderBar();

    expect(screen.getAllByText("Add New Wallet").length).toBeGreaterThan(0);
  });
});
