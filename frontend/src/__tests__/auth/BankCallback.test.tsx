import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const { complete } = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("../../api/bankApi", () => ({ completeBankCallback: complete }));
vi.mock("../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import BankCallback from "../../auth/BankCallback";

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

  it("shows the bank error without calling the API", () => {
    renderAt("/bank/callback?error=access_denied");
    expect(screen.getByText(/access_denied/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
  });
});
