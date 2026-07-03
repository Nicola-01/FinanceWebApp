import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});
vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import ResetPassword from "../../auth/ResetPassword";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";

const get = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;
const post = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ResetPassword />
    </MemoryRouter>,
  );

describe("ResetPassword", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    get.mockReset().mockResolvedValue({
      data: { email: "a@b.com", status: "FORGOTPASSWORD" },
    });
    post.mockReset().mockResolvedValue({ data: {} });
    toast.mockReset();
  });

  it("shows an error when no token is present", async () => {
    renderAt("/reset-password");
    expect(
      await screen.findByText(/No reset token provided/i),
    ).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects a link whose status is not FORGOTPASSWORD", async () => {
    get.mockResolvedValue({ data: { email: "a@b.com", status: "USED" } });
    renderAt("/reset-password?token=abc");
    expect(await screen.findByText(/already been used/i)).toBeInTheDocument();
  });

  it("shows an error when token verification fails", async () => {
    const err = new AxiosError("bad", "ERR");
    err.response = {
      status: 410,
      data: { title: "Invalid or expired reset link." },
    } as unknown as AxiosResponse;
    get.mockRejectedValue(err);
    renderAt("/reset-password?token=abc");
    expect(
      await screen.findByText(/Invalid or expired reset link/i),
    ).toBeInTheDocument();
  });

  it("SECURITY: keeps submit disabled until the password policy passes", async () => {
    const user = userEvent.setup();
    renderAt("/reset-password?token=abc");
    await screen.findByLabelText("New password");

    const submit = screen.getByRole("button", { name: /reset password/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("New password"), "weak");
    await user.type(screen.getByLabelText("Confirm password"), "weak");
    expect(submit).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });

  it("resets the password and redirects to /login on a valid submit", async () => {
    const user = userEvent.setup();
    renderAt("/reset-password?token=abc");
    await screen.findByLabelText("New password");

    await user.type(screen.getByLabelText("New password"), "Secret1!");
    await user.type(screen.getByLabelText("Confirm password"), "Secret1!");

    const submit = screen.getByRole("button", { name: /reset password/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/reset-password/abc", {
        newPassword: "Secret1!",
        confirmPassword: "Secret1!",
      }),
    );
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("reset successfully"),
      true,
    );
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
