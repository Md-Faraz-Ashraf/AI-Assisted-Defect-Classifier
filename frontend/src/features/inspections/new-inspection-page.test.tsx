import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggedInUserProvider } from "@/app/logged-in-user-context";
import { api } from "@/services/api";
import type { AIAnalysis, Batch, Inspection } from "@/types/api";
import { NewInspectionPage } from "./new-inspection-page";

vi.mock("@/components/protected-image", () => ({
  ProtectedImage: ({ imageRef }: { imageRef: string }) => (
    <div data-testid="protected-image">{imageRef}</div>
  ),
}));

const batches: Batch[] = [
  {
    batch_id: "batch-1",
    batch_number: "B-1001",
    product_name: "Valve housing",
    production_line: "Line A",
  },
];

const prediction: AIAnalysis = {
  inspection_id: "inspection-new",
  status: "UNREVIEWED",
  batch_id: "batch-1",
  image_url: "/images/new-image",
  prediction: {
    defect_type: "Scratch",
    confidence: 0.82,
    provider: "gemini",
    model: "vision-model",
  },
  created_at: "2026-11-27T00:00:00Z",
};

const unreviewedInspection: Inspection = {
  inspection_id: "inspection-existing",
  status: "UNREVIEWED",
  batch_id: "batch-1",
  batch_number: "B-1001",
  product_name: "Valve housing",
  inspector_id: "1",
  inspector_name: "Quality Engineer",
  image_ref: "stored-image-ref",
  image_url: "/images/stored-image-ref",
  original_ai_prediction: "Dent",
  ai_confidence: 0.74,
  ai_provider: "gemini",
  ai_model: "vision-model",
  final_defect_type: null,
  was_overridden: null,
  comments: null,
  inspected_at: null,
};

function renderPage(state?: { reviewInspection: Inspection }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const initialEntry = state
    ? { pathname: "/new-inspection", state }
    : "/new-inspection";

  return render(
    <QueryClientProvider client={queryClient}>
      <LoggedInUserProvider initialLoggedInUserId="1">
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/new-inspection" element={<NewInspectionPage />} />
            <Route
              path="/inspections"
              element={<p>Inspection history route</p>}
            />
          </Routes>
        </MemoryRouter>
      </LoggedInUserProvider>
    </QueryClientProvider>,
  );
}

async function chooseBatch(user: ReturnType<typeof userEvent.setup>) {
  const batchSelect = screen.getByRole("combobox", {
    name: "Manufacturing batch",
  });
  await waitFor(() => expect(batchSelect).toBeEnabled());
  await user.click(batchSelect);
  await user.click(await screen.findByRole("option", { name: /B-1001/ }));
}

async function chooseFinalDefect(
  user: ReturnType<typeof userEvent.setup>,
  defect: string,
) {
  await user.click(
    screen.getByRole("combobox", { name: "Final defect category" }),
  );
  await user.click(await screen.findByRole("option", { name: defect }));
}

describe("new inspection flow", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: () => undefined,
    });
    vi.spyOn(api, "listBatches").mockResolvedValue(batches);
    vi.spyOn(api, "predict").mockResolvedValue(prediction);
    vi.spyOn(api, "finalizeInspection").mockResolvedValue({
      ...unreviewedInspection,
      inspection_id: prediction.inspection_id,
      status: "REVIEWED",
      final_defect_type: "Dent",
      was_overridden: true,
      inspected_at: "2026-11-27T00:01:00Z",
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-image");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("validates the new-inspection inputs before calling AI", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Analyze image" }));

    expect(
      await screen.findByText("Select a manufacturing batch."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Choose a product image."),
    ).toBeInTheDocument();
    expect(api.predict).not.toHaveBeenCalled();
  });

  it("analyzes an uploaded image and submits an overridden decision", async () => {
    const user = userEvent.setup();
    renderPage();
    await chooseBatch(user);

    const file = new File(["image-bytes"], "part.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Product image"), file);
    await user.click(screen.getByRole("button", { name: "Analyze image" }));

    expect(await screen.findByText("82%")).toBeInTheDocument();
    expect(api.predict).toHaveBeenCalledWith("1", "batch-1", file);

    await chooseFinalDefect(user, "Dent");
    await user.type(screen.getByLabelText(/Comments/), "Confirmed dent");
    await user.click(screen.getByRole("button", { name: "Submit inspection" }));

    await screen.findByText("Inspection history route");
    expect(api.finalizeInspection).toHaveBeenCalledWith("1", {
      inspection_id: "inspection-new",
      final_defect_type: "Dent",
      comments: "Confirmed dent",
    });
  });

  it("allows retrying AI analysis after a failed request", async () => {
    vi.mocked(api.predict)
      .mockRejectedValueOnce(new Error("Provider unavailable"))
      .mockResolvedValueOnce(prediction);
    const user = userEvent.setup();
    renderPage();
    await chooseBatch(user);
    const file = new File(["image-bytes"], "part.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Product image"), file);

    await user.click(screen.getByRole("button", { name: "Analyze image" }));
    expect(
      await screen.findByText("The image could not be analyzed. Try again."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Analyze image" }));
    expect(await screen.findByText("82%")).toBeInTheDocument();
    expect(api.predict).toHaveBeenCalledTimes(2);
  });

  it("keeps the decision available for retry when finalization fails", async () => {
    vi.mocked(api.finalizeInspection)
      .mockRejectedValueOnce(new Error("Save failed"))
      .mockResolvedValueOnce({
        ...unreviewedInspection,
        inspection_id: prediction.inspection_id,
        status: "REVIEWED",
        final_defect_type: "Dent",
        was_overridden: true,
        inspected_at: "2026-11-27T00:01:00Z",
      });
    const user = userEvent.setup();
    renderPage();
    await chooseBatch(user);
    await user.upload(
      screen.getByLabelText("Product image"),
      new File(["image-bytes"], "part.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Analyze image" }));
    await screen.findByText("82%");
    await chooseFinalDefect(user, "Dent");

    await user.click(screen.getByRole("button", { name: "Submit inspection" }));
    expect(
      await screen.findByText(
        "The inspection could not be submitted. Please retry.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit inspection" }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Submit inspection" }));
    await screen.findByText("Inspection history route");
    expect(api.finalizeInspection).toHaveBeenCalledTimes(2);
  });

  it("uses the redirected inspection's batch, saved image, and prediction without predicting again", async () => {
    const user = userEvent.setup();
    renderPage({ reviewInspection: unreviewedInspection });

    expect(
      screen.getByRole("heading", { name: "Review inspection" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("protected-image")).toHaveTextContent(
      "stored-image-ref",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Manufacturing batch" }),
      ).toHaveTextContent("B-1001"),
    );
    expect(screen.getByText("Dent", { selector: "p" })).toBeInTheDocument();
    expect(api.predict).not.toHaveBeenCalled();

    await chooseFinalDefect(user, "Dent");
    await user.click(screen.getByRole("button", { name: "Submit inspection" }));

    await screen.findByText("Inspection history route");
    expect(api.finalizeInspection).toHaveBeenCalledWith("1", {
      inspection_id: "inspection-existing",
      final_defect_type: "Dent",
    });
  });
});
