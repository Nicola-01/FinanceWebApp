import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { setUiVersion } from "../../../utils/uiVersion";

const TAGS_HEADER = "Name,Icon,ColorHex,ParentName";
const csvFile = (body: string, name = "tags.csv") =>
  new File([`${TAGS_HEADER}\n${body}`], name, { type: "text/csv" });

const renderField = (onDtos = vi.fn()) => {
  render(
    <CsvUploadField
      resource="tags"
      title="Import tags"
      onDtos={onDtos}
      noun="tag"
    />,
  );
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  return { onDtos, input };
};

describe("CsvUploadField", () => {
  it("parses a clean file and hands the rows to onDtos", async () => {
    const { onDtos, input } = renderField();
    fireEvent.change(input, {
      target: { files: [csvFile("Food,tag,#22c55e,")] },
    });
    await waitFor(() =>
      expect(onDtos).toHaveBeenCalledWith([
        expect.objectContaining({ name: "Food", colorHex: "#22c55e" }),
      ]),
    );
    await screen.findByText(/1 tag added/i);
  });

  it("shows row errors and does not call onDtos for an invalid file", async () => {
    const { onDtos, input } = renderField();
    // Blank name -> validation error.
    fireEvent.change(input, { target: { files: [csvFile(",tag,#22c55e,")] } });
    await screen.findByText(/nothing was imported/i);
    expect(onDtos).not.toHaveBeenCalled();
  });

  it("rejects a non-csv file", async () => {
    const { onDtos, input } = renderField();
    const txt = new File(["hello"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [txt] } });
    await screen.findByText(/\.csv file/i);
    expect(onDtos).not.toHaveBeenCalled();
  });

  it("accepts a file dropped onto the zone", async () => {
    const { onDtos } = renderField();
    fireEvent.drop(screen.getByTestId("csv-dropzone"), {
      dataTransfer: { files: [csvFile("Food,tag,#22c55e,")] },
    });
    await waitFor(() => expect(onDtos).toHaveBeenCalledTimes(1));
  });

  it("opens the CSV format reference from the info button", async () => {
    renderField();
    fireEvent.click(screen.getByLabelText(/CSV format help/i));
    await screen.findByText(/How your import \/ export files/i);
  });

  it("opens the format reference on the field's own resource tab", async () => {
    // The field is resource="tags", so the ℹ️ must land on the Tags format,
    // not the modal's default Transactions tab.
    renderField();
    fireEvent.click(screen.getByLabelText(/CSV format help/i));
    await screen.findByText("Name,Icon,ColorHex,ParentName");
  });
});

describe("CsvUploadField v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("renders a raised drop zone with a 1.5px dashed border", () => {
    renderField();
    const zone = screen.getByTestId("csv-dropzone");
    expect(zone.className).toContain("bg-app-raised");
    expect(zone.className).toContain("border-[1.5px]");
    expect(zone.className).not.toContain("bg-app-surface");
  });

  it("still imports a clean file and reports errors in the danger tint", async () => {
    const { onDtos, input } = renderField();
    fireEvent.change(input, {
      target: { files: [csvFile("Food,tag,#22c55e,")] },
    });
    await waitFor(() => expect(onDtos).toHaveBeenCalled());

    fireEvent.change(input, { target: { files: [csvFile(",tag,#22c55e,")] } });
    await screen.findByText(/nothing was imported/i);
    const box = screen.getByText(/nothing was imported/i).closest("div");
    expect(box?.className).toContain("bg-app-danger/10");
  });
});
