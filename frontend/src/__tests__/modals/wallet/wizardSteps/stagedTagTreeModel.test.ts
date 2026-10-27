import { describe, it, expect } from "vitest";
import { buildTree } from "../../../../modals/wallet/wizardSteps/stagedTagTreeModel";

const tag = (name: string, parentName?: string) => ({
  name,
  icon: "i",
  colorHex: "#000000",
  parentName,
});

describe("buildTree", () => {
  it("attaches children to their parent case-insensitively", () => {
    const groups = buildTree([
      tag("Home"),
      tag("Rent", " home "),
      tag("Gas", "Home"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].parent.name).toBe("Home");
    expect(groups[0].children.map((c) => c.name)).toEqual(["Rent", "Gas"]);
  });

  it("treats a blank parentName as top-level", () => {
    const groups = buildTree([tag("Work", "  ")]);
    expect(groups).toEqual([{ parent: tag("Work", "  "), children: [] }]);
  });

  it("puts orphans (parent not staged) after the parents as their own rows", () => {
    const groups = buildTree([tag("Orphan", "Missing"), tag("Home")]);
    expect(groups.map((g) => g.parent.name)).toEqual(["Home", "Orphan"]);
    expect(groups[1].children).toEqual([]);
  });
});
