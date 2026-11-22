import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: null, pathname: "/login" }),
  };
});
vi.mock("../../api/axiosConfig", () => ({ default: { post: vi.fn() } }));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import { LoginForm } from "../../auth/LoginForm";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";
import { setUiVersion } from "../../utils/uiVersion";

const post = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const renderForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );

const fillCredentials = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Username"), "alice");
  await user.type(screen.getByLabelText("Password"), "secret");
};

describe("LoginForm", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigateMock.mockReset();
    post.mockReset();
    toast.mockReset();
  });

  it("does not call the API when fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("SECURITY: stores the token in sessionStorage when Remember me is OFF", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      data: { token: "T", passwordMustChange: false },
    });
    renderForm();
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(sessionStorage.getItem("jwtToken")).toBe("T"));
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(localStorage.getItem("mustChangePWD")).toBe("false");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("SECURITY: stores the token in localStorage when Remember me is ON", async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      data: { token: "T", passwordMustChange: false },
    });
    renderForm();
    await fillCredentials(user);
    await user.click(screen.getByRole("checkbox", { name: "Remember me" }));
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(localStorage.getItem("jwtToken")).toBe("T"));
    expect(sessionStorage.getItem("jwtToken")).toBeNull();
  });

  it("shows a toast and stores no token on failed login", async () => {
    const user = userEvent.setup();
    const err = new AxiosError("bad", "ERR");
    err.response = {
      status: 401,
      data: { title: "Invalid credentials" },
    } as unknown as AxiosResponse;
    post.mockRejectedValue(err);
    renderForm();
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Invalid credentials", false),
    );
    expect(sessionStorage.getItem("jwtToken")).toBeNull();
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe("LoginForm (v2 layout)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigateMock.mockReset();
    post.mockReset();
    toast.mockReset();
    setUiVersion("v2");
  });

  afterEach(() => setUiVersion("v1"));

  it("renders the wallet fan, the 'Welcome back.' heading and no brand lockup", () => {
    const { container } = renderForm();
    expect(
      container.querySelectorAll('img[src="/hero-cat.webp"]'),
    ).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: "Welcome back." }),
    ).toBeInTheDocument();
    expect(screen.queryByAltText("My Wallet")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Finance")).not.toBeInTheDocument();
  });

  it("a rejected login marks both fields invalid until either field is edited", async () => {
    const user = userEvent.setup();
    const err = new AxiosError("bad", "ERR");
    err.response = {
      status: 401,
      data: { title: "Invalid credentials" },
    } as unknown as AxiosResponse;
    post.mockRejectedValue(err);
    renderForm();
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByLabelText("Username")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await user.type(screen.getByLabelText("Username"), "x");
    expect(screen.getByLabelText("Username")).not.toHaveAttribute(
      "aria-invalid",
    );
    expect(screen.getByLabelText("Password")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("Enter in a filled username focuses the password without calling the API", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Username"), "alice");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Password")).toHaveFocus();
    expect(post).not.toHaveBeenCalled();
  });

  it("Enter in an empty username still submits (validation)", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByLabelText("Username"));
    await user.keyboard("{Enter}");
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("Username is required")).toBeInTheDocument();
  });
});

describe("LoginForm (v1 layout)", () => {
  it("still renders the brand lockup and the in-card heading", () => {
    renderForm();
    expect(screen.getByAltText("Finance")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Welcome back.")).not.toBeInTheDocument();
  });
});
