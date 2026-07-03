import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { stubLocation } from "../../test/testUtils";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});
vi.mock("../../utils/authHelper", () => ({ isTokenValid: vi.fn() }));
vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../auth/AnimateBackground", () => ({
  AnimateBackground: () => <div data-testid="bg" />,
}));
vi.mock("../../modals/pat/PatListView", () => ({
  PatListView: () => <div data-testid="pat-list" />,
}));
vi.mock("../../modals/pat/PatFormView", () => ({
  PatFormView: () => <div data-testid="pat-form" />,
}));

import OAuthConsent from "../../auth/OAuthConsent";
import { isTokenValid } from "../../utils/authHelper";
import api from "../../api/axiosConfig";

const tokenValid = isTokenValid as unknown as ReturnType<typeof vi.fn>;
const get = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;

const VALID_QS =
  "/oauth/authorize?client_id=cli&redirect_uri=https://app/cb" +
  "&scope=read%20write&code_challenge=chal&state=xyz";

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <OAuthConsent />
    </MemoryRouter>,
  );

describe("OAuthConsent", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    tokenValid.mockReset().mockReturnValue(true);
    get.mockReset().mockResolvedValue({ data: [] });
    sessionStorage.clear();
  });

  it("SECURITY: redirects unauthenticated users to /login", () => {
    tokenValid.mockReturnValue(false);
    renderAt(VALID_QS);
    expect(navigateMock).toHaveBeenCalledWith(
      "/login",
      expect.objectContaining({ replace: true }),
    );
  });

  it("shows an Invalid Request screen when OAuth params are missing", () => {
    renderAt("/oauth/authorize");
    expect(screen.getByText("Invalid Request")).toBeInTheDocument();
  });

  it("SECURITY: shows a replay screen when the state was already used", () => {
    sessionStorage.setItem("oauth_used_state_xyz", "true");
    renderAt(VALID_QS);
    expect(screen.getByText(/Richiesta Scaduta/i)).toBeInTheDocument();
  });

  it("renders the consent screen with client and scopes when authorized", async () => {
    renderAt(VALID_QS);
    expect(await screen.findByText("Authorize Access")).toBeInTheDocument();
    expect(screen.getByText("cli")).toBeInTheDocument();
    expect(screen.getByText("read")).toBeInTheDocument();
    expect(screen.getByText("write")).toBeInTheDocument();
  });

  it("denies access by redirecting to the client with an error", async () => {
    const loc = stubLocation();
    const user = userEvent.setup();
    renderAt(VALID_QS);
    await screen.findByText("Authorize Access");
    await user.click(screen.getByRole("button", { name: /deny access/i }));
    expect(loc.href).toBe("https://app/cb?error=access_denied&state=xyz");
  });
});
