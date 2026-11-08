import type React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { BankRule } from "../../../types/domain";

// Flat list of option buttons: options carry rich labels (rule name + tag badge).
vi.mock("../../../components/ui/CustomSelect.tsx", () => ({
  CustomSelect: ({
    onChange,
    options,
    footer,
  }: {
    onChange: (v: string) => void;
    options: { value: string; label: React.ReactNode }[];
    footer?: (close: () => void) => React.ReactNode;
  }) => (
    <div>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-testid={`opt-${o.value || "none"}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
      {footer?.(() => {})}
    </div>
  ),
}));
vi.mock("../../../dashboard/settings/BankRulesSection.tsx", () => ({
  BankRulesSection: () => <div>rules manager</div>,
}));

import { BankMatchSection } from "../../../modals/subscription/BankMatchSection";

const rules: BankRule[] = [
  {
    id: "r1",
    name: "Netflix",
    matchText: "NETFLIX",
    regex: false,
    ignoreCase: true,
    tag: {
      name: "Streaming",
      icon: "tag",
      colorHex: "#ff0000",
    } as BankRule["tag"],
    usedBy: [],
  },
  {
    id: "r2",
    name: "Rent",
    matchText: "LANDLORD",
    regex: false,
    ignoreCase: true,
    usedBy: [],
  },
];

describe("BankMatchSection", () => {
  it("lists None plus the wallet's rules, each with its tag badge", () => {
    render(
      <BankMatchSection
        value={{ ruleId: null }}
        onChange={() => {}}
        rules={rules}
      />,
    );
    expect(screen.getByTestId("opt-none")).toHaveTextContent("None");
    expect(screen.getByTestId("opt-r1")).toHaveTextContent("Netflix");
    // Same tag element as the transactions (icon + coloured name).
    expect(screen.getByTestId("opt-r1")).toHaveTextContent("Streaming");
    expect(screen.getByTestId("opt-r2")).toHaveTextContent("Rent");
  });

  it("selecting a rule reports its id; None reports null", () => {
    const onChange = vi.fn();
    render(
      <BankMatchSection
        value={{ ruleId: "r1" }}
        onChange={onChange}
        rules={rules}
      />,
    );
    fireEvent.click(screen.getByTestId("opt-r2"));
    expect(onChange).toHaveBeenLastCalledWith({ ruleId: "r2" });
    fireEvent.click(screen.getByTestId("opt-none"));
    expect(onChange).toHaveBeenLastCalledWith({ ruleId: null });
  });

  it("has no date-from-bank toggle", () => {
    render(
      <BankMatchSection
        value={{ ruleId: "r1" }}
        onChange={() => {}}
        rules={rules}
      />,
    );
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("opens the bank rules manager from the dropdown and reloads on close", async () => {
    const onRulesChanged = vi.fn();
    render(
      <BankMatchSection
        value={{ ruleId: null }}
        onChange={() => {}}
        rules={rules}
        onRulesChanged={onRulesChanged}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /manage bank rules/i }));
    expect(await screen.findByText("rules manager")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^(back|close)$/i }));
    expect(onRulesChanged).toHaveBeenCalled();
  });
});
