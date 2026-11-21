import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../../api/axiosConfig";
import { setUiVersion } from "../../utils/uiVersion";
import AdminDashboard from "../../admin/AdminDashboard";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), post: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));
const deleteObject = vi.fn();
vi.mock("../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: { deleteObject } }),
}));
vi.mock("@number-flow/react", () => import("../../test/numberFlowStub"));
vi.mock("../../header/AppHeader.tsx", () => ({ AppHeader: () => null }));
vi.mock("../../admin/Backups.tsx", () => ({
  default: () => <div>Backups panel</div>,
}));
vi.mock("../../admin/SystemTab.tsx", () => ({
  default: () => <div>System panel</div>,
}));

const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

const users = [
  {
    id: "u1",
    name: "Alice",
    token: "",
    createdAt: "2023-10-25",
    wallets: 3,
    transactions: 12,
    openBankingEnabled: false,
  },
  {
    id: "u2",
    name: "Bob",
    token: "",
    createdAt: "2024-01-02",
    wallets: 1,
    transactions: 4,
    openBankingEnabled: true,
  },
];

const invites = [
  {
    email: "carol@example.com",
    note: "Friend",
    url: "https://x/invite/1",
    createdAt: "2026-11-01T10:00:00Z",
    expiresAt: future,
    status: "PENDING",
  },
  {
    email: "dan@example.com",
    note: "",
    url: "https://x/invite/2",
    createdAt: "2026-10-01T10:00:00Z",
    expiresAt: future,
    status: "ACCEPTED",
  },
];

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
      </Routes>
    </MemoryRouter>,
  );

describe("AdminDashboard (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    vi.mocked(api.get).mockImplementation(async (url: string) => ({
      data: url.endsWith("/users") ? users : invites,
    }));
  });
  afterEach(() => {
    setUiVersion("v1");
    vi.clearAllMocks();
  });

  it("switches sections when a sub-nav item is selected", async () => {
    const user = userEvent.setup();
    renderAt("/admin/dashboard/users");

    expect(await screen.findByRole("table")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^invites/i }));
    expect(await screen.findByText("Invite a user")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^overview/i }));
    expect(
      await screen.findByText("Totals across all users."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^system/i }));
    expect(await screen.findByText("System panel")).toBeInTheDocument();
  });

  it("renders the stat tiles on the overview", async () => {
    renderAt("/admin/dashboard/overview");

    expect(await screen.findByText("Total users")).toBeInTheDocument();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Pending invites")).toBeInTheDocument();
    // Counts render as integers: 2 users, 4 wallets, 16 transactions, 1 pending invite.
    const values = Array.from(
      document.querySelectorAll("[data-stat-value]"),
    ).map((el) => el.textContent);
    expect(values).toEqual(["2", "4", "16", "1"]);
  });

  it("renders user rows and an action calls its handler", async () => {
    const user = userEvent.setup();
    renderAt("/admin/dashboard/users");

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    // header row + one row per user
    expect(rows).toHaveLength(users.length + 1);
    expect(within(table).getByText("Alice")).toBeInTheDocument();

    await user.click(within(table).getByRole("button", { name: "Delete Bob" }));
    expect(deleteObject).toHaveBeenCalledWith(
      users[1],
      "user",
      expect.any(Function),
      2,
    );
  });

  it("renders invite rows with a status pill", async () => {
    renderAt("/admin/dashboard/invites");

    expect(await screen.findByText("carol@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("dan@example.com")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });
});
