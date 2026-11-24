import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("application shell", () => {
  it("shows the human review principle on the home page", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        name: /clear decisions start with a closer look/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/people make the final call/i)).toBeInTheDocument();
  });
});
