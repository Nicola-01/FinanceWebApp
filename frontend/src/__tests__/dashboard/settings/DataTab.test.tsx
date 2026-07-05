import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import type {
  Subscription,
  Tag,
  Transaction,
  Wallet,
} from "../../../utils/types";

// --- Mocks -----------------------------------------------------------------
const { ctxRef } = vi.hoisted(() => ({
  ctxRef: {
    current: {} as {
      wallet: Wallet;
      tags: Tag[];
      transactions: Transaction[];
      subscriptions: Subscription[];
      fetchData: ReturnType<typeof vi.fn>;
    },
  },
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctxRef.current,
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { post: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../dashboard/settings/CsvFormatModal.tsx", () => ({
  CsvFormatModal: () => null,
}));
// Lightweight double for the review modal: exposes the phase + summary as data
// nodes and forwards the confirm/close callbacks, so DataTab's flow can be
// asserted without the real dialog portal. The real modal is tested separately.
vi.mock("../../../modals/common/ImportReviewModal.tsx", () => ({
  ImportReviewModal: (props: {
    open: boolean;
    phase: string;
    resource: string;
    newCount: number;
    overwrites: { label: string; detail?: string }[];
    recap?: { created: number; updated: number; autoCreatedTags: string[] };
    submitting: boolean;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    props.open ? (
      <div data-testid="review">
        <span data-testid="phase">{props.phase}</span>
        <span data-testid="resource">{props.resource}</span>
        <span data-testid="new-count">{props.newCount}</span>
        <span data-testid="overwrite-count">{props.overwrites.length}</span>
        {props.recap && (
          <span data-testid="recap">
            {`${props.recap.created}-${props.recap.updated}-${props.recap.autoCreatedTags.join(",")}`}
          </span>
        )}
        <button onClick={props.onConfirm}>review-confirm</button>
        <button onClick={props.onClose}>review-close</button>
      </div>
    ) : null,
}));

import { DataTab } from "../../../dashboard/settings/DataTab";
import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";

const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const wallet: Wallet = {
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const subscription: Subscription = {
  id: "s1",
  name: "Netflix",
  tag: { name: "Entertainment", icon: "film", colorHex: "#60a5fa" },
  amount: 12.99,
  originalAmount: 0,
  originalCurrency: "",
  exchangeValue: 0,
  autoExchangeRate: false,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  nextExecutionDate: "2026-02-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  monthlySpecificDay: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 0,
};

beforeEach(() => {
  ctxRef.current = {
    wallet,
    tags: [],
    transactions: [],
    subscriptions: [subscription],
    fetchData: vi.fn().mockResolvedValue(undefined),
  };
  apiPost.mockReset();
  toast.mockReset();
  // jsdom implements neither of these; the export path needs both.
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DataTab — subscription export", () => {
  it("warns when there is nothing to export", () => {
    ctxRef.current.subscriptions = [];
    render(<DataTab />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Subscriptions \(\.csv\)/ })[0],
    );
    expect(toast).toHaveBeenCalledWith("No subscriptions to export", false);
  });

  it("builds a subscriptions CSV blob and confirms with a toast", async () => {
    render(<DataTab />);
    // Export column is the first of the two "Subscriptions (.csv)" buttons.
    fireEvent.click(
      screen.getAllByRole("button", { name: /Subscriptions \(\.csv\)/ })[0],
    );

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    const text = await blob.text();
    const [header, firstRow] = text.split("\n");
    expect(header).toContain('"Name"');
    expect(header).toContain('"AutoExchangeRate"');
    // Booleans serialise as true/false, empty optionals stay blank.
    expect(firstRow).toContain('"Netflix"');
    expect(firstRow).toContain('"false"');
    expect(toast).toHaveBeenCalledWith(
      "Subscriptions exported successfully",
      true,
    );
  });
});

describe("DataTab — CSV import", () => {
  const fileInput = (): HTMLInputElement =>
    document.querySelector('input[type="file"]') as HTMLInputElement;

  const TX_CSV =
    "Date,Name,Tag,Amount,Type,Notes,OriginalAmount,OriginalCurrency,ExchangeValue\n" +
    "2026-06-01,Salary,Income,2500,INCOME,,,,";

  const pickTransactionsImport = () =>
    fireEvent.click(
      screen.getAllByRole("button", { name: /Transactions \(\.csv\)/ })[1],
    );

  it("posts directly and shows the recap when nothing is overwritten", async () => {
    apiPost.mockResolvedValue({
      data: {
        created: [{ id: "t1" }, { id: "t2" }],
        updated: [],
        autoCreatedTags: [{ name: "Income" }],
      },
    });
    render(<DataTab />);

    pickTransactionsImport();
    const file = new File([TX_CSV], "tx.csv", { type: "text/csv" });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/transactions/w1/bulk", [
        {
          transactionDate: "2026-06-01",
          name: "Salary",
          tag: "Income",
          amount: 2500,
          type: "INCOME",
        },
      ]),
    );

    // Goes straight to the recap phase (no confirmation needed).
    await waitFor(() =>
      expect(screen.getByTestId("phase")).toHaveTextContent("recap"),
    );
    expect(screen.getByTestId("recap")).toHaveTextContent("2-0-Income");
    expect(ctxRef.current.fetchData).toHaveBeenCalled();
    // Success no longer toasts — the recap modal reports the outcome.
    expect(toast).not.toHaveBeenCalled();
  });

  it("blocks the import and reports a row error when a row is invalid", async () => {
    render(<DataTab />);
    pickTransactionsImport();
    // Non-numeric amount -> client validation fails before any POST.
    const badCsv =
      "Date,Name,Tag,Amount,Type,Notes,OriginalAmount,OriginalCurrency,ExchangeValue\n" +
      "2026-06-01,Salary,Income,notanumber,INCOME,,,,";
    const file = new File([badCsv], "tx.csv", { type: "text/csv" });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.stringMatching(/^Row 1: .*amount/i),
        false,
      ),
    );
    expect(apiPost).not.toHaveBeenCalled();
    expect(screen.queryByTestId("review")).not.toBeInTheDocument();
    expect(ctxRef.current.fetchData).not.toHaveBeenCalled();
  });

  it("gates overwrites behind the confirm phase before POSTing", async () => {
    // A pre-existing transaction with the same name + tag + date as the CSV row.
    ctxRef.current.transactions = [
      {
        id: "existing",
        name: "Salary",
        tag: { name: "Income", icon: "sack", colorHex: "#34d399" },
        amount: 2500,
        type: "INCOME",
        transactionDate: "2026-06-01",
      } as Transaction,
    ];
    apiPost.mockResolvedValue({
      data: {
        created: [],
        updated: [{ id: "existing" }],
        autoCreatedTags: [],
      },
    });
    render(<DataTab />);

    pickTransactionsImport();
    const file = new File([TX_CSV], "tx.csv", { type: "text/csv" });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    // Confirm phase opens; nothing has been POSTed yet.
    await waitFor(() =>
      expect(screen.getByTestId("phase")).toHaveTextContent("confirm"),
    );
    expect(screen.getByTestId("overwrite-count")).toHaveTextContent("1");
    expect(screen.getByTestId("new-count")).toHaveTextContent("0");
    expect(apiPost).not.toHaveBeenCalled();

    // Confirm → POST fires → recap phase.
    fireEvent.click(screen.getByText("review-confirm"));
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("phase")).toHaveTextContent("recap"),
    );
    expect(screen.getByTestId("recap")).toHaveTextContent("0-1-");
    expect(ctxRef.current.fetchData).toHaveBeenCalled();
  });

  it("aborts the import when the confirm phase is cancelled", async () => {
    ctxRef.current.transactions = [
      {
        id: "existing",
        name: "Salary",
        tag: { name: "Income", icon: "sack", colorHex: "#34d399" },
        amount: 2500,
        type: "INCOME",
        transactionDate: "2026-06-01",
      } as Transaction,
    ];
    render(<DataTab />);

    pickTransactionsImport();
    const file = new File([TX_CSV], "tx.csv", { type: "text/csv" });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByTestId("phase")).toHaveTextContent("confirm"),
    );
    fireEvent.click(screen.getByText("review-close"));

    expect(screen.queryByTestId("review")).not.toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
    expect(ctxRef.current.fetchData).not.toHaveBeenCalled();
  });

  it("surfaces the RFC-7807 detail on a failed import", async () => {
    const err = new AxiosError("Bad Request");
    err.response = {
      data: { detail: "Row 14: tag 'Foo' not found" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: {} } as never,
    };
    apiPost.mockRejectedValue(err);
    render(<DataTab />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Tags \(\.csv\)/ })[1],
    );
    const file = new File(
      ["Name,Icon,ColorHex,ParentName\nFood,dining,#f87171,"],
      "tags.csv",
      {
        type: "text/csv",
      },
    );
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Row 14: tag 'Foo' not found", false),
    );
    // The modal never opens on a failed import.
    expect(screen.queryByTestId("review")).not.toBeInTheDocument();
    expect(ctxRef.current.fetchData).not.toHaveBeenCalled();
  });
});
