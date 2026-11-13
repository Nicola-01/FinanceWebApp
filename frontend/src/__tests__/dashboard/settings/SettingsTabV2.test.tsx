import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const { ctx } = vi.hoisted(() => ({
  ctx: { current: {} as Record<string, unknown> },
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx.current,
}));
vi.mock("../../../dashboard/settings/ShareSettingsSection.tsx", () => ({
  ShareSettingsSection: () => null,
}));
vi.mock("../../../dashboard/settings/WalletNotificationsCard.tsx", () => ({
  WalletNotificationsCard: () => null,
}));
vi.mock("../../../dashboard/settings/DataTab.tsx", () => ({
  DataTab: () => null,
}));
vi.mock("../../../components/icon/IconPickerButton.tsx", () => ({
  IconPickerButton: () => <div data-testid="icon-picker" />,
}));

import { SettingsTab } from "../../../dashboard/settings/SettingsTab";

const wallet: Wallet = {
  id: "w1",
  name: "Demo Wallet",
  icon: "wallet",
  color: "#f2cc2f",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const onWalletDelete = vi.fn();
const handleUpdateWallet = vi.fn();

describe("SettingsTab (v2)", () => {
  beforeEach(() => {
    ctx.current = { wallet, handleUpdateWallet, onWalletDelete };
  });
  afterEach(() => {
    setUiVersion("v1");
    vi.clearAllMocks();
  });

  it("uses sentence-case box titles and a wallet-named danger button", () => {
    setUiVersion("v2");
    render(<SettingsTab />);

    expect(
      screen.getByRole("heading", { level: 3, name: "General" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Danger zone" }),
    ).toHaveClass("text-app-danger");

    fireEvent.click(screen.getByRole("button", { name: "Delete Demo Wallet" }));
    expect(onWalletDelete).toHaveBeenCalledTimes(1);
  });

  it("shows a live WalletHeroCard preview that follows the edited name", () => {
    setUiVersion("v2");
    render(<SettingsTab />);

    expect(
      screen.getByRole("region", { name: "Demo Wallet" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Wallet name" }), {
      target: { value: "Savings" },
    });
    expect(screen.getByRole("region", { name: "Savings" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Currency" })).toHaveValue(
      "Euro (EUR)",
    );
  });

  it("labels the hero preview and shows a zero amount with the symbol", () => {
    setUiVersion("v2");
    render(<SettingsTab />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("0,00 €")).toBeInTheDocument();
  });

  it("keeps the v1 general box and omits the preview", () => {
    setUiVersion("v1");
    render(<SettingsTab />);

    expect(
      screen.getByRole("heading", { level: 2, name: "General Settings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Demo Wallet" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Delete Wallet" }),
    ).toBeInTheDocument();
  });
});
