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

  it("keeps a struck child in its original position (no reorder)", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    await user.click(card(/select the work category/i));
    const region = () => screen.getByRole("region", { name: /staged/i });
    await user.click(
      within(region()).getByRole("button", { name: /expand work/i }),
    );
    await user.click(
      within(region()).getByRole("button", { name: /remove bonus/i }),
    );

    // Bonus stays between Salary and Meal Vouchers, not shoved to the end.
    const names = within(region())
      .getAllByText(/^(Salary|Bonus|Meal Vouchers)$/)
      .map((el) => el.textContent);
    expect(names).toEqual(["Salary", "Bonus", "Meal Vouchers"]);
  });

  it("switches tag modes via the selector", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    // Recommended is the default mode.
    expect(card(/select the work category/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^csv$/i }));
    expect(screen.getByTestId("csv-dropzone")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /select the work category/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^recommended$/i }));
    expect(card(/select the work category/i)).toBeInTheDocument();
  });

  it("lists source wallets in the From-wallet mode", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /from wallet/i }));
    expect(
      screen.getByRole("button", { name: /use tags from freelance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /use tags from travel 2026/i }),
    ).toBeInTheDocument();
  });

  it("stages a category imported from a source wallet", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /from wallet/i }));
    await user.click(
      screen.getByRole("button", { name: /use tags from freelance/i }),
    );
    // The chosen wallet's categories now show as picker cards.
    await user.click(card(/select the clients category/i));

    const staged: TagRequest[] = onChange.mock.calls.at(-1)![0];
    expect(staged.map((t) => t.name)).toEqual(["Clients", "Acme", "Globex"]);
    expect(staged.find((t) => t.name === "Acme")!.parentName).toBe("Clients");
  });

  it("highlights a source wallet card by how much of it is staged", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /from wallet/i }));
    const freelance = () =>
      screen.getByRole("button", { name: /use tags from freelance/i });
    expect(freelance()).toHaveAttribute("aria-pressed", "false");

    await user.click(freelance());
    await user.click(card(/select the clients category/i)); // 1 of 3 categories
    await user.click(screen.getByRole("button", { name: /all wallets/i }));

    expect(freelance()).toHaveAttribute("aria-pressed", "mixed");
  });

  it("badges a recommended category with its origin in the staged tree", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    await user.click(card(/select the work category/i));

    const region = screen.getByRole("region", { name: /staged/i });
    expect(within(region).getByText(/recommended/i)).toBeInTheDocument();
  });

  it("badges an imported category with the source wallet name", async () => {
    const user = userEvent.setup();
    render(<Harness onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /from wallet/i }));
    await user.click(
      screen.getByRole("button", { name: /use tags from freelance/i }),
    );
    await user.click(card(/select the clients category/i));

    const region = screen.getByRole("region", { name: /staged/i });
    expect(within(region).getByText(/freelance/i)).toBeInTheDocument();
  });

  it("striking a child excludes it and marks the category partial (mixed)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(card(/select the work category/i));
    const region = () => screen.getByRole("region", { name: /staged/i });
    await user.click(
      within(region()).getByRole("button", { name: /expand work/i }),
    );
    await user.click(
      within(region()).getByRole("button", { name: /remove bonus/i }),
    );

    // Bonus is dropped from the staged (active) list...
    const staged: TagRequest[] = onChange.mock.calls.at(-1)![0];
    expect(staged.map((t) => t.name)).not.toContain("Bonus");
    expect(staged.map((t) => t.name)).toEqual([
      "Work",
      "Salary",
      "Meal Vouchers",
    ]);
    // ...but stays visible as struck (with a restore control), and the card
    // reflects the partial selection.
    expect(
      within(region()).getByRole("button", { name: /restore bonus/i }),
    ).toBeInTheDocument();
    expect(card(/select the work category/i)).toHaveAttribute(
      "aria-pressed",
      "mixed",
    );
  });

  it("re-selecting a category restores previously struck children", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const work = () => card(/select the work category/i);
    await user.click(work()); // stage full category
    const region = () => screen.getByRole("region", { name: /staged/i });
    await user.click(
      within(region()).getByRole("button", { name: /expand work/i }),
    );
    await user.click(
      within(region()).getByRole("button", { name: /remove bonus/i }),
    ); // strike Bonus
    await user.click(work()); // deselect the whole category
    await user.click(work()); // re-select — should restore Bonus too

    const staged: TagRequest[] = onChange.mock.calls.at(-1)![0];
    expect(staged.map((t) => t.name)).toEqual([
      "Work",
      "Salary",
      "Bonus",
      "Meal Vouchers",
    ]);
  });
});
