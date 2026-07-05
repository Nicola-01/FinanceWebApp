import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";

// The icon/colour and currency pickers are heavy (grids, lazy currency fetch);
// double them so this test focuses on BasicsStep's wiring.
vi.mock("../../../../components/icon/IconColorSelector", () => ({
  IconColorSelector: (p: {
    onChangeIcon: (k: string) => void;
    onChangeColor: (c: string) => void;
  }) => (
    <div data-testid="icon-color">
      <button onClick={() => p.onChangeIcon("piggyBank")}>set-icon</button>
      <button onClick={() => p.onChangeColor("#ff0000")}>set-color</button>
    </div>
  ),
}));

vi.mock("../../../../components/selectors/CurrencySelector", () => ({
  CurrencySelector: (p: { value: string; onChange: (c: string) => void }) => (
    <button data-testid="currency" onClick={() => p.onChange("USD")}>
      {p.value}
    </button>
  ),
}));

import {
  BasicsStep,
  type WalletBasicsValue,
} from "../../../../modals/wallet/wizardSteps/BasicsStep";

function Wrap({ onChange }: { onChange?: (v: WalletBasicsValue) => void }) {
  const [v, setV] = useState<WalletBasicsValue>({
    name: "",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
  });
  return (
    <BasicsStep
      value={v}
      onChange={(nv) => {
        setV(nv);
        onChange?.(nv);
      }}
    />
  );
}

describe("BasicsStep", () => {
  it("updates the name", () => {
    const onChange = vi.fn();
    render(<Wrap onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Personal Savings"), {
      target: { value: "Travel" },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "Travel" }),
    );
  });

  it("toggles the icon/colour popover on preview click", () => {
    render(<Wrap />);
    expect(screen.queryByTestId("icon-color")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Change Icon or Color"));
    expect(screen.getByTestId("icon-color")).toBeInTheDocument();
  });

  it("propagates icon and colour changes", () => {
    const onChange = vi.fn();
    render(<Wrap onChange={onChange} />);
    fireEvent.click(screen.getByTitle("Change Icon or Color"));
    fireEvent.click(screen.getByText("set-color"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: "#ff0000" }),
    );
    fireEvent.click(screen.getByText("set-icon"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "piggyBank" }),
    );
  });

  it("propagates a currency change", () => {
    const onChange = vi.fn();
    render(<Wrap onChange={onChange} />);
    fireEvent.click(screen.getByTestId("currency"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ currency: "USD" }),
    );
  });
});
