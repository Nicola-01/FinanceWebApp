import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  BudgetTabSkeletonV2,
  SettingsTabSkeletonV2,
  StatisticsTabSkeletonV2,
  TagsTabSkeletonV2,
} from "../../../dashboard/wallet/TabSkeletonsV2";

describe("per-tab v2 skeletons", () => {
  it.each([
    ["statistics", StatisticsTabSkeletonV2, "Loading statistics"],
    ["budgets", BudgetTabSkeletonV2, "Loading budgets"],
    ["categories", TagsTabSkeletonV2, "Loading categories"],
    ["settings", SettingsTabSkeletonV2, "Loading settings"],
  ])("%s renders a labelled status region", (_name, Skeleton, label) => {
    render(<Skeleton />);
    expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
  });

  it.each([
    ["statistics", StatisticsTabSkeletonV2, "Loading statistics", "Statistics"],
    ["budgets", BudgetTabSkeletonV2, "Loading budgets", "Budgets"],
    ["categories", TagsTabSkeletonV2, "Loading categories", "Categories"],
  ])(
    "%s keeps the real title inside its status region",
    (_name, Skeleton, label, title) => {
      render(<Skeleton />);
      const status = screen.getByRole("status", { name: label });
      expect(
        within(status).getByRole("heading", { name: title }),
      ).toBeInTheDocument();
    },
  );
});
