import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  TransactionsStep,
  type TransactionsStepProps,
} from "../../../../modals/wallet/wizardSteps/TransactionsStep";
import type { TransactionRequest } from "../../../../dashboard/settings/csvImport";

// Exact export/import column order (see TRANSACTION_COLUMNS in csvImport.ts).
const HEADER =
  "Date,Name,Tag,Amount,Type,Notes,OriginalAmount,OriginalCurrency,ExchangeValue";

const csvFile = (body: string): File =>
  new File([`${HEADER}\n${body}`], "tx.csv", { type: "text/csv" });

const fileInput = (): HTMLInputElement =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

/**
 * Controlled wrapper: mirrors how the wizard owns `value`, so `onChange`
 * re-renders the step with the staged list. `onChange` is spied for assertions.
 */
function Harness({
  onChange,
  initial = [],
  ...rest
}: {
  onChange: (next: TransactionRequest[]) => void;
  initial?: TransactionRequest[];
} & Partial<Omit<TransactionsStepProps, "value" | "onChange">>) {
  const [value, setValue] = useState<TransactionRequest[]>(initial);
  return (
    <TransactionsStep
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      currency={rest.currency ?? "EUR"}
      accentColor={rest.accentColor}
      tags={rest.tags}
      onTagsChange={rest.onTagsChange}
    />
  );
}

const stagedTx = (name: string, tag: string): TransactionRequest => ({
  transactionDate: "2026-06-01",
  name,
  tag,
  amount: 10,
  type: "EXPENSE",
});

describe("TransactionsStep", () => {
  it("appends one DTO from a valid CSV (header + 1 row)", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.change(fileInput(), {
      target: { files: [csvFile("2026-06-01,Salary,Income,2500,INCOME,,,,")] },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        {
          transactionDate: "2026-06-01",
          name: "Salary",
          tag: "Income",
          amount: 2500,
          type: "INCOME",
        },
      ]),
    );

    // Success summary + staged row surface after the append.
    expect(await screen.findByText(/1 transaction added/i)).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("1 staged")).toBeInTheDocument();
  });

  it("shows a row error and does not append when a row is invalid", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    // Non-numeric amount -> client validation fails, nothing is staged.
    fireEvent.change(fileInput(), {
      target: {
        files: [csvFile("2026-06-01,Salary,Income,notanumber,INCOME,,,,")],
      },
    });

    expect(await screen.findByText(/^Row 1: .*amount/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText(/ready to import/i)).not.toBeInTheDocument();
  });

  it("empties the staged list when Clear is pressed", async () => {
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          {
            transactionDate: "2026-06-01",
            name: "Salary",
            tag: "Income",
            amount: 2500,
            type: "INCOME",
          },
        ]}
      />,
    );

    expect(screen.getByText("Salary")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Clear/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
  });

  it("names which tags are missing and how many rows each affects", () => {
    render(
      <Harness
        onChange={vi.fn()}
        // "Groceries" twice (collapses to one group of 2) + "Fuel" once.
        initial={[
          stagedTx("Coffee", "Groceries"),
          stagedTx("Milk", "groceries"),
          stagedTx("Gas", "Fuel"),
        ]}
      />,
    );

    expect(
      screen.getByText(
        /2 tags used by these transactions aren't in this wallet/i,
      ),
    ).toBeInTheDocument();
    // The tag names ARE shown now, each with its affected-row count.
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Fuel")).toBeInTheDocument();
    expect(screen.getByText(/2 transactions use it/i)).toBeInTheDocument();
    expect(screen.getByText(/1 transaction uses it/i)).toBeInTheDocument();
  });

  it("removes every transaction carrying a missing tag", () => {
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          stagedTx("Coffee", "Groceries"),
          stagedTx("Milk", "groceries"),
          stagedTx("Gas", "Fuel"),
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove transactions tagged groceries/i,
      }),
    );

    // Only the "Fuel" row survives.
    expect(onChange).toHaveBeenCalledWith([stagedTx("Gas", "Fuel")]);
  });

  it("reassigns every transaction with a missing tag to an existing tag", () => {
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          stagedTx("Coffee", "Groceries"),
          stagedTx("Milk", "GROCERIES"),
        ]}
        tags={[{ name: "Food", icon: "tag", colorHex: "#000" }]}
      />,
    );

    // Open the reassign dropdown and pick "Food".
    fireEvent.click(screen.getByRole("button", { name: /change tag/i }));
    fireEvent.click(screen.getByText("Food"));

    expect(onChange).toHaveBeenCalledWith([
      { ...stagedTx("Coffee", "Groceries"), tag: "Food" },
      { ...stagedTx("Milk", "GROCERIES"), tag: "Food" },
    ]);
  });

  it("creates the missing tag in the draft", () => {
    const onTagsChange = vi.fn();
    render(
      <Harness
        onChange={vi.fn()}
        onTagsChange={onTagsChange}
        initial={[stagedTx("Coffee", "Groceries")]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /create tag groceries/i }),
    );

    expect(onTagsChange).toHaveBeenCalledTimes(1);
    expect(onTagsChange.mock.calls[0][0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Groceries" })]),
    );
  });

  it("shows no resolution panel when every staged tag resolves", () => {
    render(
      <Harness
        onChange={vi.fn()}
        initial={[stagedTx("Coffee", "Groceries")]}
        tags={[{ name: "Groceries", icon: "tag", colorHex: "#000" }]}
      />,
    );

    expect(
      screen.queryByText(/used by these transactions/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create tag/i }),
    ).not.toBeInTheDocument();
  });
});
