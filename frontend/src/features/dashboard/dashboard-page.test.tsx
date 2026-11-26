import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./dashboard-page";

vi.mock("@/app/logged-in-user-context", () => ({
  useLoggedInUser: () => ({ loggedInUserId: "1" }),
}));
vi.mock("@/services/queries", () => ({
  useDashboard: () => ({
    isPending: false,
    isError: false,
    data: {
      total_inspections: 0,
      passed_inspections: 0,
      rejected_inspections: 0,
      defect_rate: 0,
      ai_accepted_count: 0,
      ai_overridden_count: 0,
      ai_acceptance_rate: 0,
      defect_breakdown: [],
    },
  }),
  useInspections: () => ({
    isPending: false,
    isError: false,
    data: { items: [], page: 1, page_size: 5, total: 0, total_pages: 0 },
  }),
}));

describe("dashboard page", () => {
  it("renders all summary metrics and the empty states", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Inspection dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total inspections")).toBeInTheDocument();
    expect(screen.getByText("Passed", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Rejected", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Defect rate")).toBeInTheDocument();
    expect(screen.getByText("No inspections to chart yet")).toBeInTheDocument();
    expect(
      screen.getByText("No inspections submitted yet"),
    ).toBeInTheDocument();
  });
});
