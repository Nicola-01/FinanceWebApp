import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../api/bankApi", () => ({
  listAspsps: vi
    .fn()
    .mockResolvedValue([{ name: "Intesa" }, { name: "Unicredit" }]),
  connectBank: vi.fn(),
}));

import { ConnectBankForm } from "../../../dashboard/settings/ConnectBankForm";
import { toLocalIsoDate } from "../../../utils/localDate";

describe("ConnectBankForm", () => {
  it("limits the start date to the last two years", () => {
    const { container } = render(<ConnectBankForm walletId="w1" />);
    const input = container.querySelector('input[type="date"]')!;
    const min = new Date();
    min.setFullYear(min.getFullYear() - 2);
    expect(input.getAttribute("min")).toBe(toLocalIsoDate(min));
    expect(input.getAttribute("max")).toBe(toLocalIsoDate(new Date()));
  });

  it("filters banks from the search inside the open select", async () => {
    render(<ConnectBankForm walletId="w1" />);
    fireEvent.click(screen.getByText("Select a bank..."));
    fireEvent.change(screen.getByPlaceholderText("Tap to search..."), {
      target: { value: "uni" },
    });
    expect(await screen.findByText("Unicredit")).toBeTruthy();
    expect(screen.queryByText("Intesa")).toBeNull();
  });
});
