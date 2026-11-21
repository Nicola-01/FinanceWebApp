import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import api from "../../api/axiosConfig";
import { setUiVersion } from "../../utils/uiVersion";
import { AccountSection } from "../../settings/sections/AccountSection";
import { AboutSection } from "../../settings/sections/AboutSection";
import { DeleteAccountSection } from "../../settings/sections/DeleteAccountSection";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: null }),
}));

const profile = {
  id: "u1",
  username: "nicola",
  email: "n***@example.com",
  role: "ADMIN",
  createdAt: "2024-01-02",
};

describe("Account settings (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    vi.mocked(api.get).mockResolvedValue({ data: profile });
  });
  afterEach(() => setUiVersion("v1"));

  it("renders each account fact as a label and value row", async () => {
    render(<AccountSection />);

    expect(await screen.findByText("nicola")).toBeInTheDocument();
    expect(screen.getByText("n***@example.com")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Member since")).toBeInTheDocument();
    // v2 is sentence case: no uppercase label transform.
    expect(screen.queryByText("USERNAME")).not.toBeInTheDocument();
  });

  it("exposes the edit actions with accessible names", async () => {
    render(<AccountSection />);
    await screen.findByText("nicola");

    expect(
      screen.getByRole("button", { name: "Edit username" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change email" }),
    ).toBeInTheDocument();
  });

  it("shows the admin role as a neutral sentence-case chip", async () => {
    render(<AccountSection />);
    const chip = await screen.findByText("Admin");
    expect(chip).toHaveClass("bg-app-raised", "rounded-full");
    expect(chip).not.toHaveClass("uppercase", "text-app-yellow");
  });

  it("renders the danger zone with a danger button", () => {
    render(<DeleteAccountSection />);
    expect(screen.getByRole("button", { name: "Delete account" })).toHaveClass(
      "bg-app-danger",
    );
  });

  it("renders the about facts as rows", () => {
    render(<AboutSection />);
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Published on")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open source on GitHub/ }),
    ).toBeInTheDocument();
  });
});
