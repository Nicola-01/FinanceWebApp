import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingBenefitsV2 } from "../../../../components/landing/benefits/LandingBenefitsV2.tsx";

// The benefit proofs must stay on presentational components. If anything imports the
// chart kits, the factory runs and throws, failing the render below.
const CHART_KIT_MSG = "LandingBenefitsV2 must not import a chart kit";
vi.mock("../../../../components/ui/charts", () => {
  throw new Error(CHART_KIT_MSG);
});
vi.mock("@mui/x-charts", () => {
  throw new Error(CHART_KIT_MSG);
});
vi.mock("@mui/x-charts-pro", () => {
  throw new Error(CHART_KIT_MSG);
});

const HEADLINES = [
  "Find the leaks before they add up.",
  "No renewal takes you by surprise.",
  "Stay under budget without checking daily.",
  "See what you invested, not only what you spent.",
  "Run shared money with the people you live with.",
  "Bank transactions file themselves.",
  "Ask your finances in plain words.",
  "Use it anywhere, in any currency.",
];

describe("LandingBenefitsV2", () => {
  it("renders the section title and all eight benefit headlines", () => {
    const { container } = render(<LandingBenefitsV2 />);

    expect(container.querySelector("section#what")).not.toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Less guessing. More of your money kept.",
      }),
    ).toBeInTheDocument();
    for (const headline of HEADLINES) {
      expect(
        screen.getByRole("heading", { level: 3, name: headline }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
  });

  it("keeps the Preview pill on the bank import proof", () => {
    render(<LandingBenefitsV2 />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("renders the offline, currency and report trio", () => {
    render(<LandingBenefitsV2 />);
    expect(screen.getByText("Works offline")).toBeInTheDocument();
    expect(screen.getByText("Any currency")).toBeInTheDocument();
    expect(screen.getByText("Monthly report")).toBeInTheDocument();
  });
});
