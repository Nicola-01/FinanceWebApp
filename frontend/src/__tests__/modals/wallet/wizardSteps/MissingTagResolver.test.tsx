import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MissingTagActions,
  MissingTagChip,
} from "../../../../modals/wallet/wizardSteps/MissingTagResolver";
import { findRecommendedTagWithParent } from "../../../../modals/wallet/wizardSteps/recommendedTags";

const tag = (name: string) => ({ name, icon: "tag", colorHex: "#123456" });

describe("MissingTagChip", () => {
  it("shows the name and, when known, the parent", () => {
    const { rerender } = render(<MissingTagChip name="Netflix" />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    rerender(<MissingTagChip name="Netflix" parentName="Subscriptions" />);
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
  });
});

describe("MissingTagActions", () => {
  const base = {
    name: "Gym",
    tags: [tag("Fun")],
    placeholder: "Pick one",
    className: "row",
    onCreate: vi.fn(),
    onReassign: vi.fn(),
  };

  it("creates the tag, naming its Recommended parent", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const recommended = findRecommendedTagWithParent("Salary");
    expect(recommended).not.toBeNull();
    render(
      <MissingTagActions
        {...base}
        name="Salary"
        recommended={recommended}
        onCreate={onCreate}
      />,
    );
    const btn = screen.getByRole("button", { name: "Create tag Salary" });
    expect(btn).toHaveTextContent(/in.*Work/);
    await user.click(btn);
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("reassigns to an existing tag via the select", async () => {
    const user = userEvent.setup();
    const onReassign = vi.fn();
    render(<MissingTagActions {...base} onReassign={onReassign} />);
    await user.click(screen.getByRole("button", { name: "Pick one" }));
    await user.click(screen.getByRole("button", { name: "Fun" }));
    expect(onReassign).toHaveBeenCalledWith("Fun");
  });

  it("hides the select without staged tags and renders extra actions", () => {
    render(
      <MissingTagActions {...base} tags={[]}>
        <button type="button">Extra</button>
      </MissingTagActions>,
    );
    expect(
      screen.queryByRole("button", { name: "Pick one" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument();
  });
});
