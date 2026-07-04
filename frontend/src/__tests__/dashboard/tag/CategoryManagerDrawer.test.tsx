import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Tag, Wallet } from "../../../utils/types";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: vi.fn(),
}));
vi.mock("../../../modals/common/DeleteModalContext.tsx", () => ({
  useDeleteModal: vi.fn(),
}));

import { CategoryManagerDrawer } from "../../../dashboard/tag/CategoryManagerDrawer";
import { useWalletContext } from "../../../dashboard/wallet/WalletContext.tsx";
import { useDeleteModal } from "../../../modals/common/DeleteModalContext.tsx";

const mockedCtx = useWalletContext as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = useDeleteModal as unknown as ReturnType<typeof vi.fn>;

const wallet = (role: Wallet["userRole"] = "OWNER"): Wallet => ({
  id: "w1",
  name: "Wallet One",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: role,
});

const tag = (name: string, parentName: string | null = null): Tag => ({
  name,
  icon: "tag",
  colorHex: "#8b5cf6",
  parentName,
});

const deleteObject = vi.fn();

function setCtx(opts: { role?: Wallet["userRole"]; tags: Tag[] }) {
  const handleUpdateTag = vi.fn().mockResolvedValue(true);
  const handleDeleteTag = vi.fn().mockResolvedValue(true);
  const handleAddTag = vi.fn().mockResolvedValue(true);
  mockedCtx.mockReturnValue({
    wallet: wallet(opts.role ?? "OWNER"),
    tags: opts.tags,
    transactions: [],
    handleUpdateTag,
    handleDeleteTag,
    handleAddTag,
  } as unknown as ReturnType<typeof useWalletContext>);
  return { handleUpdateTag, handleDeleteTag, handleAddTag };
}

describe("CategoryManagerDrawer", () => {
  beforeEach(() => {
    localStorage.clear();
    deleteObject.mockReset();
    mockedDelete.mockReturnValue({ current: { deleteObject } });
  });

  it("renders the parent categories, children hidden until expanded", () => {
    setCtx({ tags: [tag("Food"), tag("Home"), tag("Utilities", "Home")] });
    render(<CategoryManagerDrawer open onClose={() => {}} />);

    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Utilities")).not.toBeInTheDocument();
  });

  it("expands a parent to reveal its children", async () => {
    setCtx({ tags: [tag("Home"), tag("Utilities", "Home")] });
    render(<CategoryManagerDrawer open onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Expand Home" }));
    expect(await screen.findByText("Utilities")).toBeInTheDocument();
  });

  it("pre-expands the deep-linked parent when it opens", async () => {
    setCtx({ tags: [tag("Home"), tag("Utilities", "Home")] });
    const { rerender } = render(
      <CategoryManagerDrawer
        open={false}
        onClose={() => {}}
        initialExpandedParent="Home"
      />,
    );
    expect(screen.queryByText("Utilities")).not.toBeInTheDocument();

    // Opening with the deep-link expands that parent without a manual click.
    rerender(
      <CategoryManagerDrawer
        open
        onClose={() => {}}
        initialExpandedParent="Home"
      />,
    );
    expect(await screen.findByText("Utilities")).toBeInTheDocument();
  });

  it("routes deletion through the DeleteModal (not window.confirm)", () => {
    setCtx({ tags: [tag("Food")] });
    render(<CategoryManagerDrawer open onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Food" }));
    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject.mock.calls[0][0]).toMatchObject({ name: "Food" });
    expect(deleteObject.mock.calls[0][1]).toBe("category");
  });

  it("is read-only for VIEWER (no add / delete / drag affordances)", () => {
    setCtx({ role: "VIEWER", tags: [tag("Food")] });
    render(<CategoryManagerDrawer open onClose={() => {}} />);

    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.queryByText("Add Main Category")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Food" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reorder Food" }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no categories", () => {
    setCtx({ tags: [] });
    render(<CategoryManagerDrawer open onClose={() => {}} />);
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    setCtx({ tags: [tag("Food")] });
    render(<CategoryManagerDrawer open={false} onClose={() => {}} />);
    expect(screen.queryByText("Food")).not.toBeInTheDocument();
  });
});
