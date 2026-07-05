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
vi.mock("../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import ForgotPassword from "../../auth/ForgotPassword";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";

const post = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const renderForm = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>,
  );

describe("ForgotPassword", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    post.mockReset().mockResolvedValue({ data: {} });
    toast.mockReset();
  });

  it("does not call the API for an invalid email", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(post).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("valid email"),
      false,
    );
  });

  it("sends the reset email and switches to the confirmation state", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      }),
    );
    expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("sent successfully"),
      true,
    );
  });

  it("returns to the form with the email preserved when editing it", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Email"), "typo@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await screen.findByText(/Check your email/i);
    await user.click(
      screen.getByRole("button", { name: /use a different email/i }),
    );

    // Back on the input state, with the previously typed value kept for editing.
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("typo@example.com");
  });

  it("shows a toast and stays on the form when sending fails", async () => {
    const user = userEvent.setup();
    const err = new AxiosError("bad", "ERR");
    err.response = {
      status: 500,
      data: { title: "Failed to send reset email." },
    } as unknown as AxiosResponse;
    post.mockRejectedValue(err);
    renderForm();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send"),
        false,
      ),
    );
    expect(screen.queryByText(/Check your email/i)).not.toBeInTheDocument();
  });
});
