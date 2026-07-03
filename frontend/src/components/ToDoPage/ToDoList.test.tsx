import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToDoList from "./ToDoList";
import { todoData } from "./todoData";

describe("ToDoList", () => {
  it("renders a section for each status group present in the data", () => {
    render(<ToDoList />);
    expect(screen.getByText("Currently In Progress")).toBeInTheDocument();
    expect(screen.getByText("Future Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Recently Shipped")).toBeInTheDocument();
  });

  it("renders item titles and status badges from the data", () => {
    render(<ToDoList />);
    // One representative title per status.
    expect(screen.getByText("Core API")).toBeInTheDocument(); // FINISHED
    expect(screen.getByText("AI Financial Insights")).toBeInTheDocument(); // STARTED
    expect(screen.getByText("Android App")).toBeInTheDocument(); // PLANNED

    // Badges (at least one of each present in the fixture data).
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Started").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
  });

  it("renders one card per to-do item", () => {
    render(<ToDoList />);
    // Every title in the data must appear on screen.
    todoData.forEach((item) => {
      expect(screen.getAllByText(item.title).length).toBeGreaterThan(0);
    });
  });

  it("expands hidden subtasks when a 'show more' toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<ToDoList />);

    const showMore = screen.getAllByRole("button", {
      name: /more subtasks/i,
    });
    expect(showMore.length).toBeGreaterThan(0);

    await user.click(showMore[0]);
    expect(
      screen.getByRole("button", { name: /show less/i }),
    ).toBeInTheDocument();
  });
});
