import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteComposer } from "../../../components/ui/InviteComposer";
import { setUiVersion } from "../../../utils/uiVersion";

const renderComposer = (onSubmit = vi.fn()) => {
  render(
    <InviteComposer
      identifier="ann"
      onIdentifierChange={vi.fn()}
      role="VIEWER"
      onRoleChange={vi.fn()}
      onSubmit={onSubmit}
      accentColor="#ff0000"
    />,
  );
  return { onSubmit };
};

describe("InviteComposer v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("uses a borderless card shell and the wallet fill, ignoring the inline accent", () => {
    renderComposer();
    const shell = screen
      .getByLabelText("Username or email")
      .closest("div.flex") as HTMLElement;
    expect(shell.className).toContain("bg-app-card");
    expect(shell.className).not.toContain("border-app-border");
    const send = screen.getByRole("button", { name: "Send invite" });
    expect(send.className).toContain("bg-wallet");
    expect(send.style.backgroundColor).toBe("");
  });

  it("still submits from the button and from Enter", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderComposer();
    await user.click(screen.getByRole("button", { name: "Send invite" }));
    await user.type(screen.getByLabelText("Username or email"), "{enter}");
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
