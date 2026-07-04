import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteSection } from "../../../dashboard/settings/InviteSection";

const renderInvite = (
  onInvite: (id: string, role: "EDITOR" | "VIEWER") => Promise<boolean>,
) => render(<InviteSection walletColor="#8b5cf6" onInvite={onInvite} />);

const sendButton = () => screen.getByRole("button", { name: /send invite/i });
const identifierInput = () => screen.getByRole("textbox", { name: /username or email/i });

describe("InviteSection", () => {
  it("keeps the Send button disabled until a 3+ char identifier is entered", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(true);
    renderInvite(onInvite);

    expect(sendButton()).toBeDisabled();

    await user.type(identifierInput(), "ab"); // 2 chars -> still disabled
    expect(sendButton()).toBeDisabled();

    await user.type(identifierInput(), "c"); // now "abc" -> enabled
    expect(sendButton()).not.toBeDisabled();
  });

  it("does not invite when the identifier is too short", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(true);
    renderInvite(onInvite);

    await user.type(identifierInput(), "ab");
    await user.click(sendButton()); // disabled -> click is a no-op

    expect(onInvite).not.toHaveBeenCalled();
  });

  it("invites with the entered identifier and the default VIEWER role", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(true);
    renderInvite(onInvite);

    await user.type(identifierInput(), "alice");
    await user.click(sendButton());

    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith("alice", "VIEWER"),
    );
  });

  it("invites with the EDITOR role once Editor is selected", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(true);
    renderInvite(onInvite);

    await user.type(identifierInput(), "bobby");
    await user.click(screen.getByRole("button", { name: /editor/i }));
    await user.click(sendButton());

    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith("bobby", "EDITOR"),
    );
  });

  it("clears the identifier field after a successful invite", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(true);
    renderInvite(onInvite);

    await user.type(identifierInput(), "alice");
    await user.click(sendButton());

    await waitFor(() => expect(identifierInput()).toHaveValue(""));
  });

  it("keeps the identifier when the invite fails", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(false);
    renderInvite(onInvite);

    await user.type(identifierInput(), "alice");
    await user.click(sendButton());

    await waitFor(() => expect(onInvite).toHaveBeenCalled());
    expect(identifierInput()).toHaveValue("alice");
  });
});
