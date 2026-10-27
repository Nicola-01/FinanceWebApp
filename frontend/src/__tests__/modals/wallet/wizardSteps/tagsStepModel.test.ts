import { describe, it, expect } from "vitest";
import {
  buildDisplayNodes,
  indexGroupsByParent,
  keyOf,
  originOf,
} from "../../../../modals/wallet/wizardSteps/tagsStepModel";
import type { RecommendedTagGroup } from "../../../../modals/wallet/wizardSteps/recommendedTags";
import type { SourceWallet } from "../../../../modals/wallet/wizardSteps/sourceWallets";

const tag = (name: string, parentName?: string) => ({
  name,
  icon: "i",
  colorHex: "#000000",
  parentName,
});

const food: RecommendedTagGroup = {
  parent: tag("Kites"),
  children: [tag("Boxes"), tag("Deltas")],
};

const wallet: SourceWallet = {
  id: "w1",
  name: "Old wallet",
  icon: "wallet",
  color: "#fff",
  groups: [food],
};

describe("keyOf", () => {
  it("trims and lowercases", () => {
    expect(keyOf("  KiTeS ")).toBe("kites");
  });
});

describe("indexGroupsByParent", () => {
  it("keys by normalized parent name, first occurrence wins", () => {
    const other = { ...food, children: [] };
    const idx = indexGroupsByParent([food, { ...other, parent: tag("KITES") }]);
    expect(idx.size).toBe(1);
    expect(idx.get("kites")).toBe(food);
  });
});

describe("originOf", () => {
  it("labels a preset tag as Recommended", () => {
    expect(originOf("salary", [wallet], {})?.label).toBe("Recommended");
  });

  it("labels a source-wallet tag with the wallet name", () => {
    expect(originOf("Deltas", [wallet], {})?.label).toBe("Old wallet");
  });

  it("labels CSV overrides, else Custom", () => {
    expect(originOf("Gym", [], { gym: "csv" })?.label).toBe("CSV");
    expect(originOf("Gym", [], { gym: "create" })?.label).toBe("Custom");
    expect(originOf("Gym", [], {})?.label).toBe("Custom");
  });
});

describe("buildDisplayNodes", () => {
  const idx = indexGroupsByParent([food]);

  it("emits a known category's children in canonical order, struck-out ones excluded", () => {
    const nodes = buildDisplayNodes(
      [tag("Kites"), tag("Deltas", "Kites")],
      idx,
    );
    expect(nodes.map((n) => [n.name, !!n.excluded])).toEqual([
      ["Kites", false],
      ["Boxes", true],
      ["Deltas", false],
    ]);
    expect(nodes[1].parentName).toBe("Kites");
  });

  it("passes unknown tags through once, de-duplicated", () => {
    const nodes = buildDisplayNodes([tag("Gym"), tag("gym")], idx);
    expect(nodes.map((n) => n.name)).toEqual(["Gym"]);
  });
});
