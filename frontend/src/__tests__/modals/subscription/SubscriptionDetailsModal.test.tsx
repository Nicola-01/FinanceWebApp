import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import type { Subscription, Wallet } from "../../../utils/types";

const { deleteObject } = vi.hoisted(() => ({ deleteObject: vi.fn() }));

vi.mock("../../../modals/subscription/SubscriptionView", () => ({
  SubscriptionView: () => <div data-testid="sub-view" />,
}));
vi.mock("../../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: { deleteObject } }),
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { delete: vi.fn(), put: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import {
  SubscriptionDetailsModal,
  type SubscriptionDetailsModalHandle,
} from "../../../modals/subscription/SubscriptionDetailsModal";

const wallet = (role: Wallet["userRole"] = "OWNER"): Wallet => ({
  id: "w1",
  name: "W1",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: role,
});

const sub = { id: "s1", name: "Netflix" } as unknown as Subscription;

function renderModal(role: Wallet["userRole"] = "OWNER") {
  const ref = createRef<SubscriptionDetailsModalHandle>();
  render(
    <SubscriptionDetailsModal
      ref={ref}
      wallet={wallet(role)}
      onEditRequest={() => {}}
      onDeleteSuccess={() => {}}
    />,
  );
  return ref;
}

describe("SubscriptionDetailsModal", () => {
  beforeEach(() => deleteObject.mockReset());

  it("is closed initially", () => {
    renderModal();
    expect(screen.queryByTestId("sub-view")).not.toBeInTheDocument();
  });

  it("opens the view with edit + delete for an owner (no Stop without a date)", () => {
    const ref = renderModal("OWNER");
    act(() => ref.current!.openModal(sub));
    expect(screen.getByTestId("sub-view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Stop here" }),
    ).not.toBeInTheDocument();
  });

  it("shows the Stop action when opened from a specific date", () => {
    const ref = renderModal("OWNER");
    act(() => ref.current!.openModal(sub, new Date("2026-02-01")));
    expect(
      screen.getByRole("button", { name: "Stop here" }),
    ).toBeInTheDocument();
  });

  it("hides all actions for a VIEWER", () => {
    const ref = renderModal("VIEWER");
    act(() => ref.current!.openModal(sub));
    expect(screen.getByTestId("sub-view")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("routes deletion through the DeleteModal", () => {
    const ref = renderModal("OWNER");
    act(() => ref.current!.openModal(sub));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject.mock.calls[0][1]).toBe("subscription");
  });
});
