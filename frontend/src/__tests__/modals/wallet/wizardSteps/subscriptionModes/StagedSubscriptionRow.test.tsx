import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StagedSubscriptionRow } from "../../../../../modals/wallet/wizardSteps/subscriptionModes/StagedSubscriptionRow";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../../dashboard/settings/csvImport";

// The editor's date picker reads ThemeContext, not provided here — stub it.
vi.mock("../../../../../components/datePicker/CustomDatePicker", () => ({
  default: () => <div />,
}));

const sub = (over: Partial<SubscriptionRequest> = {}): SubscriptionRequest => ({
  name: "Netflix",
  tag: "Fun",
  amount: 12.5,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
  ...over,
});

const fun: TagRequest = { name: "Fun", icon: "tag", colorHex: "#22c55e" };

const renderRow = (
  props: Partial<Parameters<typeof StagedSubscriptionRow>[0]> = {},
) => {
  const handlers = {
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    onReassignTag: vi.fn(),
    onCreateTag: vi.fn(),
    onEdit: vi.fn(),
  };
  render(
    <ul>
      <StagedSubscriptionRow
        sub={sub()}
        tags={[fun]}
        currencySymbol="€"
        open={false}
        {...handlers}
        {...props}
      />
    </ul>,
  );
  return handlers;
};

describe("StagedSubscriptionRow", () => {
  it("shows the signed amount and toggles / removes via the header", async () => {
    const user = userEvent.setup();
    const h = renderRow();
    expect(screen.getByText(/-\s*12\.5\s*€/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Netflix" }));
    expect(h.onToggle).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Remove Netflix" }));
    expect(h.onRemove).toHaveBeenCalledTimes(1);
  });

  it("signs income with +", () => {
    renderRow({ sub: sub({ type: "INCOME" }) });
    expect(screen.getByText(/\+\s*12\.5\s*€/)).toBeInTheDocument();
  });

  it("opens the editor for a resolved tag", () => {
    renderRow({ open: true });
    expect(screen.getByText("Start date")).toBeInTheDocument();
  });

  it("flags a missing tag and opens the resolver panel", async () => {
    const user = userEvent.setup();
    const h = renderRow({ sub: sub({ tag: "Gym" }), open: true });
    expect(
      screen.getByRole("button", { name: "Fix tag for Netflix" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Start date")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create tag Gym" }));
    expect(h.onCreateTag).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole("button", { name: "Use an existing tag" }),
    );
    await user.click(screen.getByRole("button", { name: "Fun" }));
    expect(h.onReassignTag).toHaveBeenCalledWith("Fun");
  });
});
