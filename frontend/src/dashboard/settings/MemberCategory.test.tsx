import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../utils/types";
import { MemberCategory } from "./MemberCategory";

// getUserAuth reads a JWT from storage; in tests none exists, so it returns
// null and every row is treated as "not the current user".

const makeMember = (over: Partial<WalletMember>): WalletMember => ({
  userId: "id",
  username: "Name",
  email: "user@example.com",
  role: "EDITOR",
  status: "ACCEPTED",
  invitedAt: "2026-01-01",
  ...over,
});

const members: WalletMember[] = [
  makeMember({ userId: "e1", username: "Ed One" }),
  makeMember({ userId: "e2", username: "Ed Two" }),
];

const renderCategory = (
  props: Partial<ComponentProps<typeof MemberCategory>> = {},
) =>
  render(
    <MemberCategory
      title="Editors"
      members={members}
      icon={faPen}
      iconColor="#ffffff"
      canManage={false}
      onRemove={vi.fn()}
      onChangeRole={vi.fn()}
      {...props}
    />,
  );

describe("MemberCategory", () => {
  it("renders nothing when the members list is empty", () => {
    const { container } = renderCategory({ members: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the category title and one row per member", () => {
    renderCategory();
    expect(screen.getByText("Editors")).toBeInTheDocument();
    expect(screen.getByText("Ed One")).toBeInTheDocument();
    expect(screen.getByText("Ed Two")).toBeInTheDocument();
  });

  it("RBAC: propagates canManage=false so no management controls appear", () => {
    renderCategory({ canManage: false });
    expect(screen.queryAllByTitle("Remove User")).toHaveLength(0);
    expect(screen.queryAllByTitle("Save Role")).toHaveLength(0);
  });

  it("RBAC: propagates canManage=true so each row exposes its controls", () => {
    renderCategory({ canManage: true });
    expect(screen.getAllByTitle("Remove User")).toHaveLength(members.length);
    expect(screen.getAllByTitle("Save Role")).toHaveLength(members.length);
  });
});
