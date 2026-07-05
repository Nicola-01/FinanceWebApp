import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../api/axiosConfig", () => ({
  default: { get: vi.fn() },
}));

import api from "../../../../api/axiosConfig";
import { fetchTagSources } from "../../../../modals/wallet/wizardSteps/sourceWallets";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;

describe("fetchTagSources", () => {
  beforeEach(() => mockedGet.mockReset());

  it("maps wallets + flat tags into grouped SourceWallet[]", async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          wallet: {
            id: "w1",
            name: "Personal",
            icon: "wallet",
            color: "#8b5cf6",
            currency: "EUR",
          },
          tags: [
            {
              name: "Work",
              icon: "work",
              colorHex: "#4caf50",
              parentName: null,
            },
            {
              name: "Salary",
              icon: "moneyBill",
              colorHex: "#4caf50",
              parentName: "Work",
            },
          ],
        },
      ],
    });

    const sources = await fetchTagSources();

    expect(mockedGet).toHaveBeenCalledWith("/wallets/tag-sources");
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      id: "w1",
      name: "Personal",
      icon: "wallet",
      color: "#8b5cf6",
    });
    // Flat tags are grouped into a category tree (parent + children).
    expect(sources[0].groups).toHaveLength(1);
    expect(sources[0].groups[0].parent.name).toBe("Work");
    expect(sources[0].groups[0].children.map((c) => c.name)).toEqual([
      "Salary",
    ]);
  });

  it("tolerates a wallet with no tags", async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          wallet: { id: "w2", name: "Empty", icon: "wallet", color: "#111" },
          tags: [],
        },
      ],
    });

    const sources = await fetchTagSources();
    expect(sources[0].groups).toEqual([]);
  });
});
