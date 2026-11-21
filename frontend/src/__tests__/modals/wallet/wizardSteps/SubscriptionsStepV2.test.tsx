import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionsStep } from "../../../../modals/wallet/wizardSteps/SubscriptionsStep";
import { setUiVersion } from "../../../../utils/uiVersion";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

// The date picker reads ThemeContext, which isn't provided here — stub it.
vi.mock("../../../../components/datePicker/CustomDatePicker", () => ({
  default: () => <div />,
}));

// Amount input: a plain text box plus a button that sets the sign, so the
// create form can be filled without the real keypad.
vi.mock("../../../../components/ui/AmountInput", () => ({
  AmountInput: ({
    value,
    onAmountChange,
    setType,
  }: {
    value: string;
    onAmountChange: (v: string) => void;
    setType: (t: "EXPENSE") => void;
  }) => (
    <div>
      <input
        aria-label="Amount"
        value={value}
        onChange={(e) => onAmountChange(e.target.value)}
      />
      <button type="button" onClick={() => setType("EXPENSE")}>
        Set expense
      </button>
    </div>
  ),
}));

// Tag tree: one button per staged tag, so selecting a category is one click.
vi.mock("../../../../components/tags/TagTreePicker", () => ({
  TagTreePicker: ({
    tags,
    onSelectTag,
  }: {
    tags: { name: string }[];
    onSelectTag: (name: string) => void;
  }) => (
    <div>
      {tags.map((t) => (
        <button key={t.name} type="button" onClick={() => onSelectTag(t.name)}>
          {t.name}
        </button>
      ))}
    </div>
  ),
}));

// Editor rows animate with framer-motion; render them as plain children.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const completeSubscription = (
  overrides: Partial<SubscriptionRequest> = {},
): SubscriptionRequest => ({
  name: "Netflix",
  tag: "Entertainment",
  amount: 12.99,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
  ...overrides,
});

const tag = (
  name: string,
  overrides: Partial<TagRequest> = {},
): TagRequest => ({
  name,
  icon: "tag",
  colorHex: "#22c55e",
  ...overrides,
});

const entertainment = tag("Entertainment", {
  icon: "movies",
  colorHex: "#e50914",
});

describe("SubscriptionsStep (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("renders staged rows in a card with the amount right-aligned", () => {
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={vi.fn()}
        currency="EUR"
        tags={[entertainment]}
      />,
    );

    const heading = screen.getByRole("heading", {
      name: "1 subscription ready",
    });
    const card = heading.nextElementSibling as HTMLElement;
    expect(card).toHaveClass("bg-app-card", "rounded-[var(--r-card)]");
    // Scoped to the staged card: the recommended list also shows Netflix's price.
    const amount = within(card).getByText(/-\s*12\.99\s*€/);
    expect(amount).toHaveClass("tabular-nums", "text-app-text");
  });

  it("expands a staged row and edits it through the grouped editor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={onChange}
        currency="EUR"
        tags={[entertainment]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Netflix" }));
    expect(screen.getByText("Start date")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Repeat every" }), {
      target: { value: "2" },
    });
    expect(onChange).toHaveBeenLastCalledWith([
      completeSubscription({ frequencyInterval: 2 }),
    ]);
  });

  it("stages a recommendation when its checkbox is ticked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SubscriptionsStep value={[]} onChange={onChange} currency="EUR" />);

    await user.click(screen.getByRole("checkbox", { name: "Netflix" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        name: "Netflix",
        tag: "Netflix",
        type: "EXPENSE",
      }),
    ]);
  });

  it("unstages a ticked recommendation when its checkbox is cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={onChange}
        currency="EUR"
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Netflix" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("adds a subscription from the create form", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[]}
        onChange={onChange}
        currency="EUR"
        tags={[tag("Fun")]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Create" }));
    await user.click(screen.getByRole("button", { name: "Set expense" }));
    await user.type(screen.getByRole("textbox", { name: "Amount" }), "9");
    await user.click(screen.getByRole("button", { name: "Fun" }));
    await user.click(screen.getByRole("button", { name: "Add subscription" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        name: "Fun",
        tag: "Fun",
        amount: 9,
        type: "EXPENSE",
        frequencyType: "MONTHLY",
      }),
    ]);
  });
});
