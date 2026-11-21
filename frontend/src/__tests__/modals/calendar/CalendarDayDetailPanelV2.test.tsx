import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { Subscription } from "../../../types/domain";
import {
  CalendarDayDetailPanel,
  type DayDetailModalHandle,
} from "../../../modals/calendar/CalendarDayDetailPanel";
import { setUiVersion } from "../../../utils/uiVersion";

const sub = (over: Partial<Subscription>) =>
  ({
    id: "s1",
    name: "Netflix",
    type: "EXPENSE",
    amount: 12.99,
    originalCurrency: "EUR",
    status: "ACTIVE",
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    startDate: "2026-01-01",
    nextExecutionDate: "2026-11-21",
    history: [],
    tag: { name: "Fun", icon: "tag", colorHex: "#f00" },
    ...over,
  }) as unknown as Subscription;

let root: HTMLDivElement;

beforeEach(() => {
  setUiVersion("v2");
  root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
  // jsdom lacks the <dialog> imperative API; reflect it via the `open` attribute.
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

afterEach(() => {
  root.remove();
  setUiVersion("v1");
});

/** Opens the panel on 21 Nov 2026 with the given subscriptions for that day. */
const openPanel = (subs: Subscription[], getForDate = vi.fn(() => [])) => {
  const ref = createRef<DayDetailModalHandle>();
  render(
    <CalendarDayDetailPanel
      ref={ref}
      getSubscriptionsForDate={getForDate}
      onAddSubscription={() => {}}
    />,
  );
  act(() => ref.current!.openModal(new Date(2026, 10, 21), subs));
  return getForDate;
};

describe("CalendarDayDetailPanel (v2)", () => {
  it("renders the day's subscriptions as rows with names and amounts", () => {
    openPanel([
      sub({}),
      sub({ id: "s2", name: "Salary", type: "INCOME", amount: 1500 }),
    ]);
    expect(screen.getByText("Day details")).toBeInTheDocument();
    expect(screen.getByText("21 Nov 2026")).toHaveClass("font-display");
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText(/12[.,]99/)).toHaveClass(
      "tabular-nums",
      "text-app-text",
    );
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText(/1[.,]?500[.,]00/)).toHaveClass("text-app-income");
  });

  it("shows a muted centred line when the day has no subscriptions", () => {
    openPanel([]);
    const empty = screen.getByText("No subscriptions on this day");
    expect(empty).toHaveClass("py-6", "text-center", "text-[13px]");
    expect(empty).toHaveClass("text-app-muted");
  });

  it("moves to the previous and next day through the ghost nav buttons", () => {
    const getForDate = openPanel([sub({})]);

    fireEvent.click(screen.getByRole("button", { name: "Next day" }));
    expect(getForDate).toHaveBeenLastCalledWith(new Date(2026, 10, 22));
    expect(screen.getByText("22 Nov 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(getForDate).toHaveBeenLastCalledWith(new Date(2026, 10, 20));
    expect(screen.getByText("20 Nov 2026")).toBeInTheDocument();
  });
});
