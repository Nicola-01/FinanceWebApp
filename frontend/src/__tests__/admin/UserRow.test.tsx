import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserRow from "../../admin/UserRow";
import type { User } from "../../utils/types.ts";

const user: User = {
  id: "1",
  name: "Alice",
  token: "",
  createdAt: "2023-10-25",
  wallets: 3,
  transactions: 12,
};

const renderRow = (onDelete: (u: User) => void) =>
  render(
    <table>
      <tbody>
        <UserRow user={user} onDelete={onDelete} />
      </tbody>
    </table>,
  );

describe("UserRow", () => {
  it("renders the user's name, wallet count and transaction count", () => {
    renderRow(vi.fn());
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("fires onDelete with the user when the delete action is clicked", async () => {
    const onDelete = vi.fn();
    const userEv = userEvent.setup();
    renderRow(onDelete);

    await userEv.click(screen.getByTitle("Delete User"));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(user);
  });
});
