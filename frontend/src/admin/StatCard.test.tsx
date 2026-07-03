import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the title and a numeric value", () => {
    render(
      <StatCard
        title="Total Users"
        value={42}
        icon={faUsers}
        color="#22c55e"
      />,
    );
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a string value as-is", () => {
    render(
      <StatCard title="Uptime" value="99.9%" icon={faUsers} color="#22c55e" />,
    );
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
  });
});
