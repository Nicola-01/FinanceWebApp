import { describe, it, expect } from "vitest";
import { slugify, walletSlug } from "./walletSlug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("La Mia Carta")).toBe("la-mia-carta");
  });

  it("strips accents/diacritics", () => {
    expect(slugify("Però Città")).toBe("pero-citta");
  });

  it("collapses non-alphanumerics into a single hyphen and trims", () => {
    expect(slugify("  Carta   €$ Prepagata!! ")).toBe("carta-prepagata");
  });

  it("falls back to 'wallet' when the cleaned name is empty", () => {
    expect(slugify("€€€")).toBe("wallet");
    expect(slugify("   ")).toBe("wallet");
  });
});

describe("walletSlug", () => {
  it("joins slugified name with the last 5 chars of the id", () => {
    expect(
      walletSlug({
        id: "123e4567-e89b-12d3-a456-42661417a4f9c",
        name: "La Mia Carta €",
      }),
    ).toBe("la-mia-carta-a4f9c");
  });

  it("uses the 'wallet' fallback for symbol-only names", () => {
    expect(walletSlug({ id: "aaaaabbbbbcccccddddda4f9c", name: "€€€" })).toBe(
      "wallet-a4f9c",
    );
  });
});
