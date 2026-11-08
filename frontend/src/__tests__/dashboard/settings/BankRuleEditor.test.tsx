import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import type { BankRule, Tag } from "../../../types/domain";

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
      }),
    );
    expect(onSaved).toHaveBeenCalled();
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
      usedBy: [],
    });
    fireEvent.click(
      screen.getByRole("switch", { name: "Review before confirming" }),
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
