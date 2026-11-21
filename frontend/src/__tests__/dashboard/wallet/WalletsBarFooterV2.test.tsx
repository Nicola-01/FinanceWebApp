import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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

const wallet: Wallet = {
  id: "w1",
  name: "Groceries",
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

function stubDesktop() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: true,
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

function renderBar() {
  render(
    <WalletsBar
      wallets={[wallet]}
      setWallets={vi.fn()}
      loading={false}
      selectedWalletId="w1"
      onSelectWallet={vi.fn()}
      onRefreshAll={vi.fn()}
    />,
  );
  return screen.getByRole("complementary");
}

describe("WalletsBar desktop footer (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    stubDesktop();
    wizardOpenModal.mockReset();
    setInvites([]);
  });

  afterEach(() => {
    setUiVersion("v1");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  });

  it("opens the invitations list with the v2 empty state on toggle", () => {
    const aside = renderBar();
    const toggle = within(aside).getByRole("button", { name: /Invitations/ });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      within(aside).queryByText("No pending invitations."),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      within(aside).getByText("No pending invitations."),
    ).toBeInTheDocument();
  });

  it("shows the invitation count as a pill on the toggle", () => {
    setInvites([invite]);
    const aside = renderBar();
    const toggle = within(aside).getByRole("button", { name: /Invitations/ });

    expect(within(toggle).getByText("1")).toBeInTheDocument();
  });

  it("opens the create-wallet wizard from New wallet", () => {
    const aside = renderBar();

    fireEvent.click(within(aside).getByRole("button", { name: /New wallet/ }));

    expect(wizardOpenModal).toHaveBeenCalledTimes(1);
  });
});
