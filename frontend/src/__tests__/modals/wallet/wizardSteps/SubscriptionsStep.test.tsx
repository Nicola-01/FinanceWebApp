import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionsStep } from "../../../../modals/wallet/wizardSteps/SubscriptionsStep";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

// AmountInput (revealed when a suggestion is selected) pulls in framer-motion;
// render its nodes as plain children so animations don't interfere with the test.
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

const SUBSCRIPTION_HEADER =
  "Name,Tag,Amount,Type,Status,StartDate,FrequencyType,FrequencyInterval," +
  "MonthlySpecificDay,LastWorkingDayOfMonth,Duration,DurationTimes," +
  "DurationUntil,OriginalAmount,OriginalCurrency,ExchangeValue," +
  "AutoExchangeRate,Notes";

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

describe("SubscriptionsStep", () => {
  it("stages a complete SubscriptionRequest when a recommendation is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[]}
        onChange={onChange}
        currency="EUR"
        accentColor="#8b5cf6"
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Netflix" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as SubscriptionRequest[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      name: "Netflix",
      tag: "Entertainment",
      type: "EXPENSE",
      status: "ACTIVE",
      frequencyType: "MONTHLY",
      frequencyInterval: 1,
      duration: "FOREVER",
      autoExchangeRate: false,
    });
  });

  it("surfaces row errors from an invalid CSV and stages nothing", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SubscriptionsStep value={[]} onChange={onChange} currency="EUR" />,
    );

    // CSV lives behind its own mode tab.
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));

    // Amount is negative → the shared validator flags row 1.
    const badRow =
      "Netflix,Entertainment,-5,EXPENSE,ACTIVE,2026-01-01,MONTHLY,1,,false,FOREVER,,,,,,false,";
    const file = new File([`${SUBSCRIPTION_HEADER}\n${badRow}`], "subs.csv", {
      type: "text/csv",
    });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/Row 1:/)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a staged subscription via its × control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={onChange}
        currency="EUR"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove Netflix" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("flags a subscription whose tag isn't staged and creates the tag on demand", async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={vi.fn()}
        currency="EUR"
        accentColor="#8b5cf6"
        tags={[]}
        onTagsChange={onTagsChange}
      />,
    );

    // The amber badge opens the inline resolver for "Entertainment".
    await user.click(
      screen.getByRole("button", { name: "Fix tag for Netflix" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Create tag Entertainment" }),
    );

    expect(onTagsChange).toHaveBeenCalledWith([
      { name: "Entertainment", icon: "tag", colorHex: "#8b5cf6" },
    ]);
  });

  it("reassigns a conflicting subscription to an existing tag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={onChange}
        currency="EUR"
        tags={[tag("Fun")]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Fix tag for Netflix" }),
    );
    // Open the reassign select (placeholder is its label) and pick a tag.
    await user.click(
      screen.getByRole("button", { name: "Use an existing tag" }),
    );
    await user.click(screen.getByRole("button", { name: "Fun" }));

    expect(onChange).toHaveBeenCalledWith([
      completeSubscription({ tag: "Fun" }),
    ]);
  });

  it("does not flag a subscription whose tag is staged", () => {
    render(
      <SubscriptionsStep
        value={[completeSubscription()]}
        onChange={vi.fn()}
        currency="EUR"
        tags={[tag("Entertainment", { icon: "movies", colorHex: "#e50914" })]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Fix tag for Netflix" }),
    ).not.toBeInTheDocument();
  });
});
