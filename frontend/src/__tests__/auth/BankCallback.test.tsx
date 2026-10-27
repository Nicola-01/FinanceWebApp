import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const { complete } = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("../../api/bankApi", () => ({ completeBankCallback: complete }));
vi.mock("../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import BankCallback from "../../auth/BankCallback";

const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;
const Where = () => <div data-testid="loc">{useLocation().pathname}</div>;
const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/bank/callback" element={<BankCallback />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe("BankCallback", () => {
  it("posts code+state and navigates to the wallet", async () => {
    complete.mockResolvedValue({ walletId: "w9" });
    renderAt("/bank/callback?code=abc&state=xyz");
    await waitFor(() =>
      expect(screen.getByTestId("loc")).toHaveTextContent("/dashboard/w9"),
    );
    expect(complete).toHaveBeenCalledWith("abc", "xyz");
  });

  it("toasts success only for an ACTIVE link", async () => {
    complete.mockResolvedValue({ walletId: "w9", status: "ACTIVE" });
    renderAt("/bank/callback?code=abc&state=xyz");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Bank linked successfully", true),
    );
  });

  it("toasts the connection error when the link did not become ACTIVE", async () => {
    complete.mockResolvedValue({
      walletId: "w9",
      status: "ERROR",
      lastError: "This account is already linked in this wallet",
    });
    renderAt("/bank/callback?code=abc&state=xyz");
    await waitFor(() =>
      expect(screen.getByTestId("loc")).toHaveTextContent("/dashboard/w9"),
    );
    expect(toast).toHaveBeenCalledWith(
      "This account is already linked in this wallet",
      false,
    );
  });

  it("falls back to a generic warning without lastError", async () => {
    complete.mockResolvedValue({ walletId: "w9", status: "ERROR" });
    renderAt("/bank/callback?code=abc&state=xyz");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "The bank link needs attention",
        false,
      ),
    );
  });

  it("shows the bank error without calling the API", () => {
    renderAt("/bank/callback?error=access_denied");
    expect(screen.getByText(/access_denied/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
  });

  it("errors without calling the API when code/state are missing", async () => {
    renderAt("/bank/callback?code=abc");
    await waitFor(() =>
      expect(screen.getByTestId("loc")).toHaveTextContent("/dashboard"),
    );
    expect(complete).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("Invalid bank callback", false);
  });

  it("reports an API failure", async () => {
    complete.mockRejectedValue(new Error("boom"));
    renderAt("/bank/callback?code=a&state=b");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.any(String), false),
    );
  });
});
