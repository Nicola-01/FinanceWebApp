import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { post: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { useEmailChange } from "../../../settings/account/useEmailChange";

const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as unknown as ReturnType<typeof vi.fn>;

describe("useEmailChange", () => {
  beforeEach(() => vi.clearAllMocks());

  it("walks request → verify → confirm and reports the new email", async () => {
    mockedPost
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { email: "n***@x.io" } });
    const onUpdated = vi.fn();
    const { result } = renderHook(() => useEmailChange(onUpdated));

    act(() => result.current.startEditEmail());
    expect(result.current.emailStep).toBe("request");
    act(() => result.current.setNewEmail(" new@x.io "));
    await act(() => result.current.requestEmailChange());
    expect(mockedPost).toHaveBeenCalledWith("/users/me/email/change-request", {
      newEmail: "new@x.io",
    });
    expect(result.current.emailStep).toBe("verify");

    // Confirm is a no-op until both codes have 6 digits.
    act(() => result.current.setCurrentEmailCode("123456"));
    await act(() => result.current.confirmEmailChange());
    expect(mockedPost).toHaveBeenCalledTimes(1);

    act(() => result.current.setNewEmailCode("654321"));
    await act(() => result.current.confirmEmailChange());
    expect(mockedPost).toHaveBeenLastCalledWith(
      "/users/me/email/change-confirm",
      { currentEmailCode: "123456", newEmailCode: "654321" },
    );
    expect(onUpdated).toHaveBeenCalledWith("n***@x.io");
    expect(result.current.emailStep).toBe("idle");
  });

  it("cancels a pending change server-side and resets even on failure", async () => {
    mockedDelete.mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useEmailChange(vi.fn()));
    act(() => result.current.startEditEmail());
    await act(() => result.current.cancelPendingEmailChange());
    expect(mockedDelete).toHaveBeenCalledWith("/users/me/email/change");
    expect(result.current.emailStep).toBe("idle");
  });
});
