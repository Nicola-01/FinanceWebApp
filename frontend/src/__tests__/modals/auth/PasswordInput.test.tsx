import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { PasswordInput } from "../../../modals/auth/PasswordInput";
import { setUiVersion } from "../../../utils/uiVersion";

describe("PasswordInput v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("renders the borderless raised field and toggles visibility", async () => {
    const user = userEvent.setup();
    render(
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        value="secret"
        icon={faLock}
        onChange={() => {}}
      />,
    );
    const field = screen.getByPlaceholderText("Enter password");
    expect(field).toHaveAttribute("type", "password");
    const wrapper = field.parentElement as HTMLElement;
    expect(wrapper.className).toContain("bg-app-raised");
    expect(wrapper.className).not.toContain("border-app-border");

    await user.click(wrapper.querySelector("button") as HTMLElement);
    expect(field).toHaveAttribute("type", "text");
  });
});
