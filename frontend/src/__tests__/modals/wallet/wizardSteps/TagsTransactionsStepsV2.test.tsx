import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagsStep } from "../../../../modals/wallet/wizardSteps/TagsStep";
import {
  TransactionsStep,
  type TransactionsStepProps,
} from "../../../../modals/wallet/wizardSteps/TransactionsStep";
import type {
  TagRequest,
  TransactionRequest,
} from "../../../../dashboard/settings/csvImport";
import { setUiVersion } from "../../../../utils/uiVersion";

/** Controlled wrapper mirroring how the wizard owns the staged tag list. */
function TagsHarness({ onChange }: { onChange: (next: TagRequest[]) => void }) {
  const [value, setValue] = useState<TagRequest[]>([]);
  return (
    <TagsStep
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

/** Controlled wrapper for the transactions step (same pattern as the v1 tests). */
function TransactionsHarness({
  onChange,
  initial = [],
  onTagsChange,
}: {
  onChange: (next: TransactionRequest[]) => void;
  initial?: TransactionRequest[];
  onTagsChange?: TransactionsStepProps["onTagsChange"];
}) {
  const [value, setValue] = useState<TransactionRequest[]>(initial);
  return (
    <TransactionsStep
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      currency="EUR"
      onTagsChange={onTagsChange}
    />
  );
}

const stagedTx = (name: string, tag: string): TransactionRequest =>
  ({
    transactionDate: "2026-06-01",
    name,
    tag,
    amount: 10,
    type: "EXPENSE",
  }) as unknown as TransactionRequest;

describe("TagsStep (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("renders the staged tag tree as rows inside a card", async () => {
    const user = userEvent.setup();
    render(<TagsHarness onChange={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: /select the work category/i }),
    );

    const region = screen.getByRole("region", { name: /staged/i });
    const card = within(region).getByText("Work").closest(".divide-y");
    expect(card).not.toBeNull();
    expect(card).toHaveClass("rounded-[var(--r-card)]", "bg-app-card");
    expect(within(card as HTMLElement).getByText("Work")).toBeInTheDocument();
  });

  it("still stages a hand-made tag from the Create mode", async () => {
    const user = userEvent.setup();
    render(<TagsHarness onChange={vi.fn()} />);

    await user.click(screen.getByRole("tab", { name: /^create$/i }));
    await user.type(screen.getByLabelText(/category name/i), "Freelancing");
    await user.click(screen.getByRole("button", { name: /add category/i }));

    const region = screen.getByRole("region", { name: /staged/i });
    expect(within(region).getByText("Freelancing")).toBeInTheDocument();
  });
});

describe("TransactionsStep (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("renders the transactions step with its staged list", () => {
    render(
      <TransactionsHarness
        onChange={vi.fn()}
        initial={[stagedTx("Coffee", "Groceries"), stagedTx("Gas", "Fuel")]}
      />,
    );

    expect(screen.getByText("Add transactions")).toBeInTheDocument();
    expect(screen.getByText("2 staged")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Gas")).toBeInTheDocument();
  });

  it("shows the missing-tag warning card and still resolves it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onTagsChange = vi.fn();
    render(
      <TransactionsHarness
        onChange={onChange}
        onTagsChange={onTagsChange}
        initial={[
          stagedTx("Coffee", "Groceries"),
          stagedTx("Milk", "groceries"),
        ]}
      />,
    );

    expect(
      screen.getByText(
        /1 tag used by these transactions isn't in this wallet/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2 transactions use it")).toBeInTheDocument();

    // Creating the missing tag hands it to the Tags draft.
    await user.click(
      screen.getByRole("button", { name: /create tag groceries/i }),
    );
    expect(onTagsChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Groceries" }),
    ]);

    // Removing the affected rows clears the warning.
    await user.click(
      screen.getByRole("button", {
        name: /remove transactions tagged groceries/i,
      }),
    );
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
