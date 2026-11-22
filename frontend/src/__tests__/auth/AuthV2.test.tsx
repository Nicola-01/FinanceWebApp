import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setUiVersion } from "../../utils/uiVersion";

const { authorize, deny } = vi.hoisted(() => ({
  authorize: vi.fn(),
  deny: vi.fn(),
}));

vi.mock("../../auth/AnimateBackground", () => ({
  AnimateBackground: () => <div data-testid="bg" />,
}));
vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../modals/pat/PatFormView", () => ({
  PatFormView: () => <div data-testid="pat-form" />,
}));
vi.mock("../../auth/oauth/useOAuthAuthorize", () => ({
  useOAuthAuthorize: () => ({
    walletPerms: [
      {
        walletId: "w1",
        walletName: "Main",
        enabled: true,
        read: true,
        write: false,
      },
    ],
    authorizing: false,
    hasReplayError: false,
    handleAuthorize: authorize,
    handleDeny: deny,
    setPermission: vi.fn(),
  }),
}));

import AuthLayout from "../../auth/AuthLayout";
import { LoginForm } from "../../auth/LoginForm";
import { AuthErrorCard } from "../../auth/AuthErrorCard";
import OAuthConsent from "../../auth/OAuthConsent";

const VALID_QS =
  "/oauth/authorize?client_id=cli&redirect_uri=https://app/cb" +
  "&scope=read%20write&code_challenge=chal&state=xyz";

afterEach(() => setUiVersion("v1"));

describe("auth screens (v2)", () => {
  beforeEach(() => setUiVersion("v2"));

  it("AuthLayout follows the theme: no dark class and no animated background", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<div>child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveClass("dark");
    expect(root).toHaveClass("bg-app-bg", "flex", "min-h-dvh");
    expect(screen.queryByTestId("bg")).not.toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("LoginForm renders the fields and a submit button", () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("AuthErrorCard shows the message and runs the back action", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(
      <AuthErrorCard
        title="Reset failed"
        message="Link expired"
        onBack={onBack}
      />,
    );
    expect(screen.getByText("Reset failed")).toBeInTheDocument();
    expect(screen.getByText("Link expired")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to login" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("OAuthConsent approve and deny call their handlers", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[VALID_QS]}>
        <Routes>
          <Route path="/oauth/authorize" element={<OAuthConsent />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Authorize access")).toBeInTheDocument();
    expect(screen.getByText("cli")).toBeInTheDocument();
    expect(screen.getByText("write")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(authorize).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Deny" }));
    expect(deny).toHaveBeenCalledTimes(1);
  });
});
