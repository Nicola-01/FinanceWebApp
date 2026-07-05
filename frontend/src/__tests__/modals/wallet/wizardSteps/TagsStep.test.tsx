import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagsStep } from "../../../../modals/wallet/wizardSteps/TagsStep";
import type { TagRequest } from "../../../../dashboard/settings/csvImport";

/** Controlled wrapper mirroring how the wizard owns the staged list. */
function Harness({
  onChange,
  initial = [],
}: {
  onChange: (next: TagRequest[]) => void;
  initial?: TagRequest[];
}) {
  const [value, setValue] = useState<TagRequest[]>(initial);
  return (
    <TagsStep
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const card = (name: RegExp) => screen.getByRole("button", { name });

describe("TagsStep — recommended categories", () => {
  it("stages a whole category (parent + children carrying parentName)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(card(/select the work category/i));

    const staged: TagRequest[] = onChange.mock.calls.at(-1)![0];
    expect(staged.map((t) => t.name)).toEqual([
      "Work",
      "Salary",
      "Bonus",
      "Meal Vouchers",
    ]);
    expect(staged.find((t) => t.name === "Work")!.parentName).toBeUndefined();
    expect(staged.find((t) => t.name === "Salary")!.parentName).toBe("Work");
  });

  it("unstages the whole category when toggled off", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(card(/select the work category/i));
    await user.click(card(/select the work category/i));

    expect(onChange.mock.calls.at(-1)![0]).toEqual([]);
  });

  it("marks a selected category card as pressed", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    const home = card(/select the home category/i);
    expect(home).toHaveAttribute("aria-pressed", "false");
    await user.click(home);
    expect(home).toHaveAttribute("aria-pressed", "true");
  });

  it("lists staged categories in the staged tree region", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    await user.click(card(/select the car category/i));

    const region = screen.getByRole("region", { name: /staged/i });
    expect(within(region).getByText("Car")).toBeInTheDocument();
  });
});
