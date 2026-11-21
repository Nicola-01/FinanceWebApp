import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setUiVersion } from "../../../utils/uiVersion";
import {
  BasicsStep,
  type WalletBasicsValue,
} from "../../../modals/wallet/wizardSteps/BasicsStep";
import {
  InvitesStep,
  type WalletInvite,
} from "../../../modals/wallet/wizardSteps/InvitesStep";
import { WalletCompletionScreen } from "../../../modals/wallet/WalletCompletionScreen";
import type { WizardCompletionState } from "../../../components/ui/Wizard";
import type { WalletCreationResult } from "../../../modals/wallet/walletCreation";

// Heavy pickers are doubled, as in the v1 wizard step tests.
vi.mock("../../../components/icon/IconColorSelector", () => ({
  IconColorSelector: () => <div data-testid="icon-color" />,
}));
vi.mock("../../../components/selectors/CurrencySelector", () => ({
  CurrencySelector: (p: { value: string; onChange: (c: string) => void }) => (
    <button data-testid="currency" onClick={() => p.onChange("USD")}>
      {p.value}
    </button>
  ),
}));

function BasicsWrap({
  onChange,
}: {
  onChange: (v: WalletBasicsValue) => void;
}) {
  const [v, setV] = useState<WalletBasicsValue>({
    name: "",
    description: "",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
  });
  return (
    <BasicsStep
      value={v}
      onChange={(nv) => {
        setV(nv);
        onChange(nv);
      }}
    />
  );
}

function InvitesWrap({ initial = [] }: { initial?: WalletInvite[] }) {
  const [v, setV] = useState<WalletInvite[]>(initial);
  return <InvitesStep value={v} onChange={setV} />;
}

const completion = (
  over: Partial<WizardCompletionState<WalletCreationResult>>,
): WizardCompletionState<WalletCreationResult> => ({
  status: "done",
  goToStep: vi.fn(),
  ...over,
});

describe("Wallet wizard steps (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  describe("BasicsStep", () => {
    it("groups the fields into labelled cards", () => {
      render(<BasicsWrap onChange={vi.fn()} />);
      expect(screen.getByRole("heading", { name: "Details" })).toHaveClass(
        "text-[13px]",
        "text-app-muted",
      );
      expect(
        screen.getByRole("heading", { name: "Currency" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Wallet name")).toBeInTheDocument();
      expect(screen.getByText("3–25 characters")).toBeInTheDocument();
      expect(screen.getByTestId("currency")).toBeInTheDocument();
    });

    it("still updates name, description, currency and colour", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<BasicsWrap onChange={onChange} />);

      fireEvent.change(screen.getByLabelText("Wallet name"), {
        target: { value: "Travel" },
      });
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Travel" }),
      );

      fireEvent.change(screen.getByLabelText("Description"), {
        target: { value: "Holiday fund" },
      });
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ description: "Holiday fund" }),
      );

      await user.click(screen.getByTestId("currency"));
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ currency: "USD" }),
      );

      await user.click(screen.getByTitle("Change icon or colour"));
      expect(screen.getByTestId("icon-color")).toBeInTheDocument();
    });
  });

  describe("InvitesStep", () => {
    it("renders the composer inside a card", () => {
      render(<InvitesWrap />);
      expect(
        screen.getByRole("heading", { name: "Add people" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    });

    it("lists staged invites with a count and removes them", async () => {
      const user = userEvent.setup();
      render(
        <InvitesWrap
          initial={[{ user: "alice@example.com", role: "VIEWER" }]}
        />,
      );
      expect(screen.getByText("Staged invites (1)")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Remove alice@example.com" }),
      );
      expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
    });
  });

  describe("WalletCompletionScreen", () => {
    it("shows tabular counts per resource and calls onFinish from the CTA", () => {
      const onFinish = vi.fn();
      render(
        <WalletCompletionScreen
          accentColor="#8b5cf6"
          onFinish={onFinish}
          state={completion({
            result: {
              walletId: "w9",
              anyFailed: false,
              outcomes: [
                { resource: "tags", ok: true, created: 3 },
                { resource: "invites", ok: true, sent: 2, failed: 0 },
              ],
            },
          })}
        />,
      );
      expect(screen.getByText("Wallet ready")).toBeInTheDocument();
      expect(screen.getByText("3 created")).toHaveClass("tabular-nums");
      expect(screen.getByText("2/2 sent")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Go to wallet" }));
      expect(onFinish).toHaveBeenCalledWith("w9");
    });

    it("shows the processing and error states", () => {
      const { rerender } = render(
        <WalletCompletionScreen
          onFinish={vi.fn()}
          state={completion({ status: "processing" })}
        />,
      );
      expect(screen.getByText("Creating your wallet…")).toBeInTheDocument();

      rerender(
        <WalletCompletionScreen
          onFinish={vi.fn()}
          state={completion({ status: "error", error: new Error("boom") })}
        />,
      );
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });
});
