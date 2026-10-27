import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletCompletionScreen } from "../../../modals/wallet/WalletCompletionScreen";
import type { WizardCompletionState } from "../../../components/ui/Wizard";
import type { WalletCreationResult } from "../../../modals/wallet/walletCreation";

const state = (
  over: Partial<WizardCompletionState<WalletCreationResult>>,
): WizardCompletionState<WalletCreationResult> => ({
  status: "done",
  goToStep: vi.fn(),
  ...over,
});

describe("WalletCompletionScreen", () => {
  it("shows the processing message", () => {
    render(
      <WalletCompletionScreen
        state={state({ status: "processing" })}
        onFinish={vi.fn()}
      />,
    );
    expect(screen.getByText("Creating your wallet…")).toBeInTheDocument();
  });

  it("shows the error and returns to the first step", () => {
    const s = state({ status: "error", error: new Error("boom") });
    render(<WalletCompletionScreen state={s} onFinish={vi.fn()} />);
    expect(screen.getByText("boom")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Return to setup"));
    expect(s.goToStep).toHaveBeenCalledWith(0);
  });

  it("falls back to a generic message for non-Error failures", () => {
    render(
      <WalletCompletionScreen
        state={state({ status: "error", error: "nope" })}
        onFinish={vi.fn()}
      />,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("summarizes each resource outcome", () => {
    const onFinish = vi.fn();
    render(
      <WalletCompletionScreen
        state={state({
          result: {
            walletId: "w1",
            anyFailed: true,
            outcomes: [
              { resource: "tags", ok: true, created: 2, updated: 1 },
              { resource: "subscriptions", ok: true },
              { resource: "transactions", ok: false },
              { resource: "invites", ok: false, sent: 1, failed: 2 },
            ],
          },
        })}
        onFinish={onFinish}
      />,
    );
    expect(
      screen.getByText("Wallet created with some issues"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 created, 1 updated")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("1/3 sent")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Go to wallet"));
    expect(onFinish).toHaveBeenCalledWith("w1");
  });
});
