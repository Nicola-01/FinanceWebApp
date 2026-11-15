import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatePickerSidebar from "../../../components/datePicker/DatePickerSidebar";
import { ALL_PRESETS } from "../../../components/datePicker/datePresets";

const renderSidebar = (
  allowedPresets?: Parameters<typeof DatePickerSidebar>[0]["allowedPresets"],
) =>
  render(
    <DatePickerSidebar
      preset="year"
      setPreset={vi.fn()}
      color="#123456"
      isDark={false}
      allowedPresets={allowedPresets}
    />,
  );

describe("DatePickerSidebar", () => {
  it("lists every preset, including Today, when no allow-list is given", () => {
    renderSidebar();
    for (const label of [
      "Last 30 Days",
      "Month",
      "Year",
      "All",
      "Custom",
      "Today",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(ALL_PRESETS).toHaveLength(6);
  });

  it("lists only the allowed presets and hides Today when it is not allowed", () => {
    renderSidebar(["year", "all"]);
    expect(screen.getByRole("button", { name: "Year" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Month" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Last 30 Days" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Custom" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  });

  it("shows Today alone when it is the only allowed preset", async () => {
    const setPreset = vi.fn();
    render(
      <DatePickerSidebar
        preset="year"
        setPreset={setPreset}
        color="#123456"
        isDark={false}
        allowedPresets={["today"]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(setPreset).toHaveBeenCalledWith("today");
    expect(screen.queryByRole("button", { name: "Year" })).toBeNull();
  });
});
