import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WalletPermState } from "../../../utils/types";
import { PatFormView } from "../../../modals/pat/PatFormView";

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

interface FormOverrides {
  isEdit?: boolean;
  tokenName?: string;
  walletPerms?: WalletPermState[];
  isSubmitting?: boolean;
  submitText?: string;
  submittingText?: string;
}

const renderForm = (over: FormOverrides = {}) => {
  const setTokenName = vi.fn();
  const setPermission = vi.fn();
  const onSubmit = vi.fn();
  render(
    <PatFormView
      isEdit={over.isEdit ?? false}
      tokenName={over.tokenName ?? ""}
      setTokenName={setTokenName}
      walletPerms={over.walletPerms ?? [wp({ enabled: true })]}
      setPermission={setPermission}
      onSubmit={onSubmit}
      isSubmitting={over.isSubmitting ?? false}
      submitText={over.submitText}
      submittingText={over.submittingText}
    />,
  );
  return { setTokenName, setPermission, onSubmit };
};

const submitBtn = () =>
  screen.getByRole("button", { name: /generate token|save changes|\.\.\.$/i });

describe("PatFormView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("SECURITY: submit is blocked when the token name is empty", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      tokenName: "",
      walletPerms: [wp({ enabled: true })],
    });
    expect(submitBtn()).toBeDisabled();
    await user.click(submitBtn());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("SECURITY: submit is blocked when the name is whitespace only", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      tokenName: "   ",
      walletPerms: [wp({ enabled: true })],
    });
    expect(submitBtn()).toBeDisabled();
    await user.click(submitBtn());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("SECURITY: submit is blocked when no wallet is enabled", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      tokenName: "CI Bot",
      walletPerms: [
        wp({ enabled: false }),
        wp({ walletId: "w2", enabled: false }),
      ],
    });
    expect(submitBtn()).toBeDisabled();
    await user.click(submitBtn());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("enables submit and calls onSubmit once when a name and at least one wallet are set", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      tokenName: "CI Bot",
      walletPerms: [wp({ enabled: true, read: true })],
    });
    expect(submitBtn()).toBeEnabled();
    await user.click(submitBtn());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("forwards edits to setTokenName", async () => {
    const user = userEvent.setup();
    const { setTokenName } = renderForm({ tokenName: "" });
    await user.type(screen.getByPlaceholderText(/CI\/CD Bot/i), "B");
    expect(setTokenName).toHaveBeenCalledWith("B");
  });

  it("locks the name field in edit mode (name is immutable)", () => {
    renderForm({ isEdit: true, tokenName: "Existing" });
    expect(screen.getByPlaceholderText(/CI\/CD Bot/i)).toBeDisabled();
  });

  it("shows a spinner and no wallet controls while permissions load, keeping submit disabled", () => {
    renderForm({ tokenName: "CI Bot", walletPerms: [] });
    // No wallet rows yet -> the Selector segments are absent.
    expect(screen.queryByRole("button", { name: "Write" })).toBeNull();
    expect(submitBtn()).toBeDisabled();
  });

  it("reflects the submitting state (disabled + submitting label)", () => {
    renderForm({
      tokenName: "CI Bot",
      walletPerms: [wp({ enabled: true })],
      isSubmitting: true,
    });
    expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
  });

  it("honours custom submit / submitting labels", () => {
    const { rerender } = render(
      <PatFormView
        isEdit={false}
        tokenName="CI Bot"
        setTokenName={vi.fn()}
        walletPerms={[wp({ enabled: true })]}
        setPermission={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        submitText="Create it"
        submittingText="Working..."
      />,
    );
    expect(
      screen.getByRole("button", { name: "Create it" }),
    ).toBeInTheDocument();
    rerender(
      <PatFormView
        isEdit={false}
        tokenName="CI Bot"
        setTokenName={vi.fn()}
        walletPerms={[wp({ enabled: true })]}
        setPermission={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={true}
        submitText="Create it"
        submittingText="Working..."
      />,
    );
    expect(screen.getByRole("button", { name: "Working..." })).toBeDisabled();
  });

  it("delegates permission changes to setPermission", async () => {
    const user = userEvent.setup();
    const { setPermission } = renderForm({
      tokenName: "CI Bot",
      walletPerms: [wp({ walletId: "wx", enabled: true, read: true })],
    });
    await user.click(screen.getByRole("button", { name: "Write" }));
    expect(setPermission).toHaveBeenCalledWith("wx", "write");
  });
});
