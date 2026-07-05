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
    />
  );
}

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
    expect(
      await screen.findByText(/1 transaction ready to import/i),
    ).toBeInTheDocument();
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
});
