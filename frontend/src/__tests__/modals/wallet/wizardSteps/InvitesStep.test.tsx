import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  InvitesStep,
  type WalletInvite,
} from "../../../../modals/wallet/wizardSteps/InvitesStep";

const identifierInput = () =>
  screen.getByLabelText("Email or username") as HTMLInputElement;
const addButton = () => screen.getByRole("button", { name: "Add" });

describe("InvitesStep", () => {
  it("adds a trimmed invite with the default EDITOR role", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InvitesStep value={[]} onChange={onChange} />);

    await user.type(identifierInput(), "  alice@example.com  ");
    await user.click(addButton());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      { user: "alice@example.com", role: "EDITOR" },
    ]);
  });

  it("adds an invite with the selected VIEWER role", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InvitesStep value={[]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /viewer/i }));
    await user.type(identifierInput(), "bob");
    await user.click(addButton());

    expect(onChange).toHaveBeenCalledWith([{ user: "bob", role: "VIEWER" }]);
  });

  it("does not add a blank identifier", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InvitesStep value={[]} onChange={onChange} />);

    await user.type(identifierInput(), "   ");
    expect(addButton()).toBeDisabled();
    await user.click(addButton());

    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the input after adding", async () => {
    const user = userEvent.setup();
    // Wrapper feeds value back so the list reflects adds.
    function Wrapper() {
      const [value, setValue] = useState<WalletInvite[]>([]);
      return <InvitesStep value={value} onChange={setValue} />;
    }
    render(<Wrapper />);

    await user.type(identifierInput(), "carol");
    await user.click(addButton());

    expect(identifierInput()).toHaveValue("");
    expect(screen.getByText("carol")).toBeInTheDocument();
  });

  it("ignores a case-insensitive duplicate identifier", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <InvitesStep
        value={[{ user: "Alice", role: "EDITOR" }]}
        onChange={onChange}
      />,
    );

    await user.type(identifierInput(), "alice");
    expect(addButton()).toBeDisabled();
    await user.click(addButton());

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the invitee visible and switches its role via a compact icon toggle", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <InvitesStep
        value={[{ user: "alice@example.com", role: "EDITOR" }]}
        onChange={onChange}
      />,
    );

    const row = screen.getByText("alice@example.com").closest("li")!;
    // The email stays visible alongside the switch.
    expect(within(row).getByText("alice@example.com")).toBeInTheDocument();
    // The per-row switch is icon-only (no "Editor"/"Viewer" text labels).
    expect(within(row).queryByText("Editor")).not.toBeInTheDocument();
    expect(within(row).queryByText("Viewer")).not.toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: /viewer/i }));
    expect(onChange).toHaveBeenCalledWith([
      { user: "alice@example.com", role: "VIEWER" },
    ]);
  });

  it("removes an invite via its × control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <InvitesStep
        value={[
          { user: "alice", role: "EDITOR" },
          { user: "bob", role: "VIEWER" },
        ]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove alice" }));

    expect(onChange).toHaveBeenCalledWith([{ user: "bob", role: "VIEWER" }]);
  });
});
