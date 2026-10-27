import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../../../api/bankApi", () => ({
  listAspsps: vi.fn().mockResolvedValue([]),
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
});
