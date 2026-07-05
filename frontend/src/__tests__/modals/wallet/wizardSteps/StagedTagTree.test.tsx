import { describe, it, expect, vi } from "vitest";
import { type ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  StagedTagTree,
  type StagedTagNode,
} from "../../../../modals/wallet/wizardSteps/StagedTagTree";

const noop = () => {};

const WORK: StagedTagNode[] = [
  { name: "Work", icon: "work", colorHex: "#4caf50" },
  {
    name: "Salary",
    icon: "moneyBill",
    colorHex: "#4caf50",
    parentName: "Work",
  },
  { name: "Bonus", icon: "gift", colorHex: "#81c784", parentName: "Work" },
];

const renderTree = (props: Partial<ComponentProps<typeof StagedTagTree>>) =>
  render(
    <StagedTagTree
      value={WORK}
      onRemoveCategory={noop}
      onRemoveChild={noop}
      onRestoreChild={noop}
      {...props}
    />,
  );

describe("StagedTagTree", () => {
  it("shows a parent row (children hidden until expanded)", async () => {
    const user = userEvent.setup();
    renderTree({});

    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expand work/i }));
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Bonus")).toBeInTheDocument();
  });

  it("expands by pressing anywhere on the row, not only the chevron", async () => {
    const user = userEvent.setup();
    renderTree({});

    // Clicking the category name (part of the row) toggles expansion.
    await user.click(screen.getByText("Work"));
    expect(screen.getByText("Salary")).toBeInTheDocument();
  });

  it("removes the whole category via its × control", async () => {
    const user = userEvent.setup();
    const onRemoveCategory = vi.fn();
    renderTree({ onRemoveCategory });

    await user.click(screen.getByRole("button", { name: /remove work/i }));
    expect(onRemoveCategory).toHaveBeenCalledWith("Work");
  });

  it("strikes an active child via its × control", async () => {
    const user = userEvent.setup();
    const onRemoveChild = vi.fn();
    renderTree({ onRemoveChild });

    await user.click(screen.getByRole("button", { name: /expand work/i }));
    await user.click(screen.getByRole("button", { name: /remove salary/i }));
    expect(onRemoveChild).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Salary" }),
    );
  });

  it("renders an excluded child struck-through with a restore control", async () => {
    const user = userEvent.setup();
    const onRestoreChild = vi.fn();
    const value: StagedTagNode[] = [
      { name: "Work", icon: "work", colorHex: "#4caf50" },
      {
        name: "Salary",
        icon: "moneyBill",
        colorHex: "#4caf50",
        parentName: "Work",
      },
      {
        name: "Bonus",
        icon: "gift",
        colorHex: "#81c784",
        parentName: "Work",
        excluded: true,
      },
    ];
    renderTree({ value, onRestoreChild });

    await user.click(screen.getByRole("button", { name: /expand work/i }));

    // Excluded child has a restore control, not a remove ×, and reads as struck.
    expect(
      screen.queryByRole("button", { name: /remove bonus/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Bonus").className).toContain("line-through");

    await user.click(screen.getByRole("button", { name: /restore bonus/i }));
    expect(onRestoreChild).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Bonus" }),
    );
  });

  it("renders a childless tag as its own row without an expander", () => {
    const solo: StagedTagNode[] = [
      { name: "Misc", icon: "tag", colorHex: "#888" },
    ];
    renderTree({ value: solo });

    expect(screen.getByText("Misc")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand misc/i }),
    ).not.toBeInTheDocument();
  });
});
