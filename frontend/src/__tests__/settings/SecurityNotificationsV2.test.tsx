import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setUiVersion } from "../../utils/uiVersion";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));
vi.mock("../../push/pushClient", () => ({
  getEnrollment: vi.fn(),
  subscribeThisDevice: vi.fn(),
  unsubscribeThisDevice: vi.fn(),
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../api/axiosConfig";
import { getEnrollment, subscribeThisDevice } from "../../push/pushClient";
import { ChangePasswordCard } from "../../settings/security/ChangePasswordCard";
import { MfaMethods } from "../../settings/security/MfaMethods";
import { NotificationsSection } from "../../settings/sections/NotificationsSection";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedGetEnrollment = getEnrollment as unknown as ReturnType<
  typeof vi.fn
>;
const mockedSubscribe = subscribeThisDevice as unknown as ReturnType<
  typeof vi.fn
>;

describe("Security and notifications (UI v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedSubscribe.mockReset();
    mockedGetEnrollment.mockReset();
    mockedPost.mockResolvedValue({ data: {} });
    mockedGetEnrollment.mockResolvedValue("unsubscribed");
    mockedGet.mockResolvedValue({
      data: {
        invites: true,
        monthlyReport: false,
        yearlyReport: false,
        wallets: [],
      },
    });
  });

  afterEach(() => setUiVersion("v1"));

  it("password form fields render and submit calls the change-password API", async () => {
    render(<ChangePasswordCard forced={false} />);

    expect(
      screen.getByPlaceholderText("Enter current password"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter new password"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm new password"),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText("Enter current password"),
      "OldPass1!",
    );
    await user.type(
      screen.getByPlaceholderText("Enter new password"),
      "NewPass1!",
    );
    await user.type(
      screen.getByPlaceholderText("Confirm new password"),
      "NewPass1!",
    );

    const submit = screen.getByRole("button", { name: "Update password" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith("/auth/change-password", {
        currentPassword: "OldPass1!",
        newPassword: "NewPass1!",
        confirmPassword: "NewPass1!",
      }),
    );
  });

  it("MFA rows show a status pill per method", () => {
    render(<MfaMethods />);

    expect(screen.getByText("Passkey")).toBeInTheDocument();
    expect(screen.getByText("Authenticator app")).toBeInTheDocument();
    expect(screen.getByText("Email code")).toBeInTheDocument();
    expect(screen.getAllByText("Not set up")).toHaveLength(3);
  });

  it("a notification toggle still calls its handler", async () => {
    mockedSubscribe.mockResolvedValue("subscribed");
    render(<NotificationsSection />);

    const toggle = await screen.findByRole("switch", {
      name: "Enable push notifications on this device",
    });
    await userEvent.click(toggle);

    expect(mockedSubscribe).toHaveBeenCalledTimes(1);
  });
});
