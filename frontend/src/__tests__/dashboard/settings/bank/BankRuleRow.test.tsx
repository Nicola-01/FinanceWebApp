import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BankRule, Tag } from "../../../../types/domain";
import { BankRuleRow } from "../../../../dashboard/settings/bank/BankRuleRow";

const streaming = {
  name: "Streaming",
  icon: "tag",
  colorHex: "#ff0000",
} as Tag;
const base = {
  id: "r1",
  name: "Netflix",
  matchText: "NETFLIX",
  regex: false,
  ignoreCase: true,
  tag: streaming,
  renameTo: null,
  reviewFirst: false,
  dateFromName: false,
  clearName: false,
  usedBy: [],
  transactionCount: 0,
} as BankRule;

describe("BankRuleRow", () => {
  it("shows the name, bank text, category and count on one row", () => {
    render(<BankRuleRow rule={{ ...base, transactionCount: 12 }} />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("NETFLIX")).toBeInTheDocument();
    expect(screen.getByText("Streaming")).toBeInTheDocument();
    expect(screen.getByText("12 tx")).toBeInTheDocument();
  });

  it("shows zero counts too", () => {
    render(<BankRuleRow rule={base} />);
    expect(screen.getByText("0 tx")).toBeInTheDocument();
  });

  it("marks rename, regex and subscription use with labelled glyphs", () => {
    render(
      <BankRuleRow
        rule={{
          ...base,
          regex: true,
          renameTo: "Netflix TV",
          usedBy: ["Netflix plan", "Family"],
        }}
      />,
    );
    expect(screen.getByRole("img", { name: "Renames" })).toHaveAttribute(
      "title",
      "Renames",
    );
    expect(screen.getByRole("img", { name: "Regex" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Used by: Netflix plan, Family" }),
    ).toBeInTheDocument();
  });

  it("shows no marks for a plain rule", () => {
    render(<BankRuleRow rule={base} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("opens the rule when clicked", async () => {
    const onOpen = vi.fn();
    render(<BankRuleRow rule={base} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith(base);
  });

  it("is inert without an open handler (viewers)", () => {
    render(<BankRuleRow rule={base} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
