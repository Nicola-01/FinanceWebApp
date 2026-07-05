import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StagedTagTree } from "../../../../modals/wallet/wizardSteps/StagedTagTree";
import type { TagRequest } from "../../../../dashboard/settings/csvImport";

const WORK: TagRequest[] = [
  { name: "Work", icon: "work", colorHex: "#4caf50" },
  {
    name: "Salary",
    icon: "moneyBill",
    colorHex: "#4caf50",
    parentName: "Work",
  },
  { name: "Bonus", icon: "gift", colorHex: "#81c784", parentName: "Work" },
];

describe("StagedTagTree", () => {
  it("shows a parent row (children hidden until expanded)", async () => {
    const user = userEvent.setup();
    render(<StagedTagTree value={WORK} onRemoveCategory={() => {}} />);

    expect(screen.getByText("Work")).toBeInTheDocument();
    // The child-count badge reflects the two sub-categories.
    expect(screen.getByText("2")).toBeInTheDocument();
    // Collapsed by default — children not rendered yet.
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expand work/i }));
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Bonus")).toBeInTheDocument();
  });

  it("removes the whole category via its × control", async () => {
    const user = userEvent.setup();
    const onRemoveCategory = vi.fn();
    render(<StagedTagTree value={WORK} onRemoveCategory={onRemoveCategory} />);

    await user.click(screen.getByRole("button", { name: /remove work/i }));
    expect(onRemoveCategory).toHaveBeenCalledWith("Work");
  });

  it("renders a childless tag as its own row without an expander", () => {
    const solo: TagRequest[] = [
      { name: "Misc", icon: "tag", colorHex: "#888" },
    ];
    render(<StagedTagTree value={solo} onRemoveCategory={() => {}} />);

    expect(screen.getByText("Misc")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand misc/i }),
    ).not.toBeInTheDocument();
  });
});
