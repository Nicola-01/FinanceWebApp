import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import type { BankRule, Tag, Transaction } from "../../../types/domain";

const { bank } = vi.hoisted(() => ({
  bank: { createBankRule: vi.fn(), updateBankRule: vi.fn() },
}));
vi.mock("../../../api/bankApi", () => bank);
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../modals/transaction/TagPicker", () => ({
  TagPicker: ({
    selectedTagName,
    onSelectTag,
  }: {
    selectedTagName: string;
    onSelectTag: (n: string) => void;
  }) => (
    <input
      aria-label="Tag"
      value={selectedTagName}
      onChange={(e) => onSelectTag(e.target.value)}
    />
  ),
}));

import { BankRuleEditor } from "../../../dashboard/settings/BankRuleEditor";

const tags: Tag[] = [];
const onSaved = vi.fn();
const onClose = vi.fn();

const renderEditor = (rule: BankRule | null = null) =>
  render(
    <BankRuleEditor
      open
      walletId="w1"
      rule={rule}
      tags={tags}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );

const save = () => screen.getByRole("button", { name: "Save rule" });

beforeEach(() => vi.clearAllMocks());

describe("BankRuleEditor", () => {
  it("cannot save until name and trigger text are filled", () => {
    renderEditor();
    expect(save()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Rule name"), {
      target: { value: "Amazon" },
    });
    expect(save()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Trigger text"), {
      target: { value: "AMZN" },
    });
    expect(save()).toBeEnabled();
  });

  it("creates a rule with the defaults", async () => {
    bank.createBankRule.mockResolvedValue({ id: "r1" });
    renderEditor();
    fireEvent.change(screen.getByLabelText("Rule name"), {
      target: { value: "Amazon" },
    });
    fireEvent.change(screen.getByLabelText("Trigger text"), {
      target: { value: "AMZN" },
    });
    fireEvent.click(save());
    await waitFor(() =>
      expect(bank.createBankRule).toHaveBeenCalledWith("w1", {
        name: "Amazon",
        matchText: "AMZN",
        regex: false,
        ignoreCase: true,
        tag: null,
        renameTo: null,
        reviewFirst: false,
        dateFromName: false,
        clearName: false,
      }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("disables the transaction name and sends no rename when the name is left empty", async () => {
    bank.createBankRule.mockResolvedValue({ id: "r1" });
    renderEditor();
    fireEvent.change(screen.getByLabelText("Rule name"), {
      target: { value: "Amazon" },
    });
    fireEvent.change(screen.getByLabelText("Trigger text"), {
      target: { value: "AMZN" },
    });
    fireEvent.change(screen.getByLabelText("Transaction name"), {
      target: { value: "Amazon" },
    });
    fireEvent.click(
      screen.getByRole("switch", { name: "Leave the name empty" }),
    );
    expect(screen.getByLabelText("Transaction name")).toBeDisabled();
    fireEvent.click(save());
    await waitFor(() =>
      expect(bank.createBankRule).toHaveBeenCalledWith(
        "w1",
        expect.objectContaining({ renameTo: null, clearName: true }),
      ),
    );
  });

  it("loads clearName from an existing rule", () => {
    renderEditor({
      id: "r1",
      name: "Amazon",
      matchText: "AMZN",
      regex: false,
      ignoreCase: true,
      renameTo: null,
      reviewFirst: false,
      dateFromName: false,
      clearName: true,
      usedBy: [],
    });
    expect(
      screen.getByRole("switch", { name: "Leave the name empty" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Transaction name")).toBeDisabled();
  });

  it("updates an existing rule", async () => {
    bank.updateBankRule.mockResolvedValue({ id: "r1" });
    renderEditor({
      id: "r1",
      name: "Amazon",
      matchText: "AMZN",
      regex: false,
      ignoreCase: false,
      tag: { name: "Food" } as Tag,
      renameTo: "Amazon",
      reviewFirst: false,
      dateFromName: false,
      clearName: false,
      usedBy: [],
    });
    fireEvent.click(
      screen.getByRole("switch", { name: "Review before confirming" }),
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "Date from transaction name" }),
    );
    fireEvent.click(save());
    await waitFor(() =>
      expect(bank.updateBankRule).toHaveBeenCalledWith("w1", "r1", {
        name: "Amazon",
        matchText: "AMZN",
        regex: false,
        ignoreCase: false,
        tag: "Food",
        renameTo: "Amazon",
        reviewFirst: true,
        dateFromName: true,
        clearName: false,
      }),
    );
  });

  it("shows an invalid regex inline", async () => {
    const err = new AxiosError("409");
    err.response = {
      data: {
        title: "Conflict",
        detail: "Invalid bank match regex: Unclosed group",
      },
      status: 409,
    } as AxiosResponse;
    bank.createBankRule.mockRejectedValue(err);
    renderEditor();
    fireEvent.change(screen.getByLabelText("Rule name"), {
      target: { value: "Bad" },
    });
    fireEvent.change(screen.getByLabelText("Trigger text"), {
      target: { value: "(" },
    });
    fireEvent.click(save());
    expect(
      await screen.findByText("Invalid bank match regex: Unclosed group"),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe("BankRuleEditor draft and pending", () => {
  const bankTx = (name: string, notes?: string) =>
    ({ id: name, name, notes }) as Transaction;

  it("pre-fills name, text and category of a new rule from the draft", () => {
    render(
      <BankRuleEditor
        open
        walletId="w1"
        rule={null}
        draft={{ name: "Unipolmove", matchText: "UNIPOLMOVE", tagName: "Car" }}
        tags={tags}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );
    expect(screen.getByLabelText("Rule name")).toHaveValue("Unipolmove");
    expect(screen.getByLabelText("Trigger text")).toHaveValue("UNIPOLMOVE");
    expect(screen.getByLabelText("Tag")).toHaveValue("Car");
    expect(save()).toBeEnabled();
  });

  it("counts the pending imports the typed text matches, live", () => {
    const pending = [
      bankTx("Renamed", "Bank: UNIPOLMOVE; Recurring: Car (#1)"),
      bankTx("Unipolmove monthly"),
      bankTx("Esselunga"),
    ];
    render(
      <BankRuleEditor
        open
        walletId="w1"
        rule={null}
        draft={{ name: "Unipolmove", matchText: "UNIPOLMOVE" }}
        pending={pending}
        tags={tags}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );
    expect(
      screen.getByText("Matches 2 transactions to categorise"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Trigger text"), {
      target: { value: "Esselunga" },
    });
    expect(
      screen.getByText("Matches 1 transaction to categorise"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Trigger text"), {
      target: { value: "nothing here" },
    });
    expect(
      screen.getByText("No transaction to categorise matches yet"),
    ).toBeInTheDocument();
  });

  it("shows no count while the trigger text is blank", () => {
    render(
      <BankRuleEditor
        open
        walletId="w1"
        rule={null}
        pending={[bankTx("Esselunga")]}
        tags={tags}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );
    expect(screen.queryByText(/^Matches /)).toBeNull();
    expect(screen.queryByText(/No transaction to categorise/)).toBeNull();
  });
});

describe("BankRuleEditor delete", () => {
  const existing: BankRule = {
    id: "r1",
    name: "Amazon",
    matchText: "AMZN",
    regex: false,
    ignoreCase: true,
    renameTo: null,
    reviewFirst: false,
    dateFromName: false,
    clearName: false,
    usedBy: [],
  };

  it("renders a Delete rule button next to Save when editing and onDelete is given", () => {
    const onDelete = vi.fn();
    renderEditorWithDelete(existing, onDelete);
    fireEvent.click(screen.getByRole("button", { name: "Delete rule" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(save()).toBeInTheDocument();
  });

  it("hides Delete rule when creating a rule", () => {
    renderEditorWithDelete(null, vi.fn());
    expect(screen.queryByRole("button", { name: "Delete rule" })).toBeNull();
  });

  it("hides Delete rule when onDelete is not given", () => {
    renderEditor(existing);
    expect(screen.queryByRole("button", { name: "Delete rule" })).toBeNull();
  });
});

function renderEditorWithDelete(rule: BankRule | null, onDelete: () => void) {
  return render(
    <BankRuleEditor
      open
      walletId="w1"
      rule={rule}
      tags={tags}
      onClose={onClose}
      onSaved={onSaved}
      onDelete={onDelete}
    />,
  );
}
