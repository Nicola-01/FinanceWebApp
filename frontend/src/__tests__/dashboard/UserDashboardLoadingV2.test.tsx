import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { setUiVersion } from "../../utils/uiVersion";

// /wallets never resolves, so the page stays in its loading state.
vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(() => new Promise(() => {})) },
}));
vi.mock("../../dashboard/wallet/WalletsBar.tsx", () => ({
  WalletsBar: () => null,
  V2_DESKTOP_QUERY: "(min-width: 1024px)",
}));
vi.mock("../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: null }),
}));
vi.mock("../../header/AppHeader.tsx", () => ({ AppHeader: () => null }));
vi.mock("../../header/HeaderActions.tsx", () => ({
  HeaderActions: () => null,
}));

import UserDashboard from "../../dashboard/UserDashboard";

describe("UserDashboard (v2 loading)", () => {
  beforeEach(() => {
    setUiVersion("v2");
  });

  it("shows the wallet page skeleton instead of loading text", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <UserDashboard />
      </MemoryRouter>,
    );

    const status = screen.getByRole("status", { name: "Loading wallet" });
    expect(status.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeNull();
  });
});
