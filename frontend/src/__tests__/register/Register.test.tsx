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

import Register from "../../register/Register";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";

const get = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;
const post = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Register />
    </MemoryRouter>,
  );

describe("Register", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    get.mockReset().mockResolvedValue({
      data: { email: "a@b.com", status: "PENDING" },
    });
    post.mockReset().mockResolvedValue({ data: {} });
    toast.mockReset();
  });

  it("shows an error when no token is present in the URL", async () => {
    renderAt("/register");
    expect(
      await screen.findByText(/No registration token provided/i),
    ).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects an invitation that is not PENDING", async () => {
    get.mockResolvedValue({ data: { email: "a@b.com", status: "REVOKED" } });
    renderAt("/register?token=abc");
    expect(
      await screen.findByText(/already been used or was revoked/i),
    ).toBeInTheDocument();
  });

  it("shows an error when the token verification call fails", async () => {
    const err = new AxiosError("bad", "ERR");
    err.response = {
      status: 404,
      data: { title: "Invalid or expired invitation link." },
    } as unknown as AxiosResponse;
    get.mockRejectedValue(err);
    renderAt("/register?token=abc");
    expect(
      await screen.findByText(/Invalid or expired invitation link/i),
    ).toBeInTheDocument();
  });

  it("SECURITY: keeps submit disabled until username + password policy pass", async () => {
    const user = userEvent.setup();
    renderAt("/register?token=abc");
    await screen.findByLabelText("Username");

    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).toBeDisabled();

    // Valid username but a password that fails the policy → still disabled.
    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Password"), "weak");
    await user.type(screen.getByLabelText("Confirm password"), "weak");
    expect(submit).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });

  it("registers and redirects to /login on a valid submit", async () => {
    const user = userEvent.setup();
    renderAt("/register?token=abc");
    await screen.findByLabelText("Username");

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Password"), "Secret1!");
    await user.type(screen.getByLabelText("Confirm password"), "Secret1!");

    const submit = screen.getByRole("button", { name: /create account/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/register/abc", {
        username: "alice",
        password: "Secret1!",
      }),
    );
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("Registration successful"),
      true,
    );
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
