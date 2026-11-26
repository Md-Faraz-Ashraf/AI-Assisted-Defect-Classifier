import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { InspectionHistoryPage } from "./inspection-history-page";

vi.mock("@/app/demo-user-context", () => ({
  useDemoUser: () => ({ demoUserId: "1" }),
}));
vi.mock("@/services/queries", () => ({
  useBatches: () => ({ isPending: false, isError: false, data: [] }),
  useInspections: () => ({
    isPending: false,
    isError: false,
    data: { items: [], page: 1, page_size: 10, total: 0, total_pages: 0 },
  }),
}));

describe("inspection history", () => {
  it("renders defect and batch filters with a useful initial empty state", () => {
    render(
      <MemoryRouter>
        <InspectionHistoryPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Inspection history" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Filter by final defect" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Filter by batch" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No reviewed inspections yet")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });
});
