import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ToDoPage from "../../../components/todo/ToDoPage";
import { todoData } from "../../../components/todo/todoData";
import { setUiVersion } from "../../../utils/uiVersion";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ToDoPage />
    </MemoryRouter>,
  );

describe("ToDoPage (UI v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
  });

  afterEach(() => {
    // Unmount while still v2 so the v1 switch does not re-render the page.
    cleanup();
    setUiVersion("v1");
  });

  it("renders the title and one group label per status present", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Roadmap & future improvements",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "In progress" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Planned" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Under evaluation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Done" }),
    ).toBeInTheDocument();
  });

  it("renders every to-do item as a row", () => {
    renderPage();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(
      todoData.length,
    );
    todoData.forEach((item) => {
      expect(screen.getAllByText(item.title).length).toBeGreaterThan(0);
    });
  });

  it("shows status pills: completed as ok, in progress as warn", () => {
    renderPage();
    const completed = screen.getAllByText("Completed");
    expect(completed[0].className).toContain("text-app-income");
    const inProgress = screen
      .getAllByText("In progress")
      .filter((el) => el.className.includes("text-app-warn"));
    expect(inProgress.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evaluating").length).toBeGreaterThan(0);
  });

  it("uses the grouped card styling and no animated background", () => {
    const { container } = renderPage();
    expect(container.querySelector(".divide-app-border")).not.toBeNull();
    expect(
      container.querySelector(".shadow-\\[var\\(--box-ring\\)\\]"),
    ).not.toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeNull();
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector(".blur-3xl")).toBeNull();
    expect(container.querySelector(".uppercase")).toBeNull();
    expect(container.querySelector(".font-app-mono")).toBeNull();
  });
});
