import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { BankRule } from "../../../types/domain";

vi.mock("../../../components/ui/CustomSelect.tsx", () => ({
  CustomSelect: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      aria-label="Bank rule"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

import { BankMatchSection } from "../../../modals/subscription/BankMatchSection";

const rules: BankRule[] = [
  {
    id: "r1",
    name: "Netflix",
    matchText: "NETFLIX",
    regex: false,
    ignoreCase: true,
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
  it("lists None plus the wallet's rules", () => {
    render(
      <BankMatchSection
        value={{ ruleId: null, bankDriven: false }}
        onChange={() => {}}
        rules={rules}
      />,
    );
    const names = screen
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).textContent);
    expect(names).toEqual(["None", "Netflix", "Rent"]);
  });

  it("selecting a rule reports its id; None reports null", () => {
    const onChange = vi.fn();
    render(
      <BankMatchSection
        value={{ ruleId: "r1", bankDriven: true }}
        onChange={onChange}
        rules={rules}
      />,
    );
    fireEvent.change(screen.getByLabelText("Bank rule"), {
      target: { value: "r2" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ruleId: "r2",
      bankDriven: true,
    });
    fireEvent.change(screen.getByLabelText("Bank rule"), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ruleId: null,
      bankDriven: false,
    });
  });

  it("disables date from bank without a rule", () => {
    render(
      <BankMatchSection
        value={{ ruleId: null, bankDriven: false }}
        onChange={() => {}}
        rules={rules}
      />,
    );
    expect(
      screen.getByRole("switch", { name: "Date from bank" }),
    ).toBeDisabled();
  });
});
