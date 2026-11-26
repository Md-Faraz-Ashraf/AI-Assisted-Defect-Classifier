import type {
  AIAnalysis,
  Batch,
  DashboardSummary,
  LoggedInUser,
  InspectionFilters,
  InspectionPage,
  FinalizeInspectionRequest,
} from "@/types/api";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (
  configuredBaseUrl || "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
  detail?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload = {};
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    // Keep an informative fallback for plain-text or empty server errors.
  }
  return new ApiError(
    payload.error?.message ??
      payload.detail ??
      `Request failed (${response.status}).`,
    response.status,
    payload.error?.code ?? "http_error",
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  loggedInUserId?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (loggedInUserId) headers.set("X-User-Id", loggedInUserId);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export const api = {
  listUsers(signal?: AbortSignal): Promise<LoggedInUser[]> {
    return request<LoggedInUser[]>("/users", { signal });
  },

  listBatches(loggedInUserId: string, signal?: AbortSignal): Promise<Batch[]> {
    return request<Batch[]>("/batches", { signal }, loggedInUserId);
  },

  getDashboard(
    loggedInUserId: string,
    signal?: AbortSignal,
  ): Promise<DashboardSummary> {
    return request<DashboardSummary>(
      "/dashboard/summary",
      { signal },
      loggedInUserId,
    );
  },

  listInspections(
    loggedInUserId: string,
    filters: InspectionFilters,
    signal?: AbortSignal,
  ): Promise<InspectionPage> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return request<InspectionPage>(
      `/inspections/list?${params.toString()}`,
      { signal },
      loggedInUserId,
    );
  },

  predict(
    loggedInUserId: string,
    batchId: string,
    image: File,
    signal?: AbortSignal,
  ): Promise<AIAnalysis> {
    const formData = new FormData();
    formData.set("batch_id", batchId);
    formData.set("image", image);
    return request<AIAnalysis>(
      "/ai/predict",
      { method: "POST", body: formData, signal },
      loggedInUserId,
    );
  },

  finalizeInspection(
    loggedInUserId: string,
    submission: FinalizeInspectionRequest,
    signal?: AbortSignal,
  ): Promise<import("@/types/api").Inspection> {
    return request<import("@/types/api").Inspection>(
      "/finalize-inspection",
      { method: "POST", body: JSON.stringify(submission), signal },
      loggedInUserId,
    );
  },

  async getImage(
    loggedInUserId: string,
    imageRef: string,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/images/${encodeURIComponent(imageRef)}`,
      {
        signal,
        headers: { "X-User-Id": loggedInUserId },
      },
    );
    if (!response.ok) throw await parseError(response);
    return response.blob();
  },
};
