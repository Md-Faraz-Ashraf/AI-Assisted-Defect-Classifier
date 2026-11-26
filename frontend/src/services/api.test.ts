import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("typed API client", () => {
  it("sends the logged-in user identity and serializes list filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        items: [],
        page: 2,
        page_size: 10,
        total: 0,
        total_pages: 0,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.listInspections("2", {
      page: 2,
      page_size: 10,
      defect_type: "Dent",
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/inspections/list?");
    expect(url).toContain("defect_type=Dent");
    expect(options.headers).toBeInstanceOf(Headers);
    expect((options.headers as Headers).get("X-User-Id")).toBe("2");
    expect(options.signal).toBeUndefined();
  });

  it("sends image prediction as multipart form data without a JSON content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        inspection_id: "a1",
        batch_id: "b1",
        image_url: "/image",
        prediction: {},
        created_at: "now",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const image = new File(["image"], "part.png", { type: "image/png" });

    await api.predict("1", "b1", image);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get("batch_id")).toBe("b1");
    expect((options.body as FormData).get("image")).toBe(image);
    expect((options.headers as Headers).has("Content-Type")).toBe(false);
  });

  it("turns API error responses into actionable ApiError values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "forbidden",
              message: "Supervisor access is read only.",
            },
          },
          { status: 403 },
        ),
      ),
    );

    await expect(api.getDashboard("2")).rejects.toMatchObject({
      name: "ApiError",
      code: "forbidden",
      status: 403,
      message: "Supervisor access is read only.",
    } satisfies Partial<ApiError>);
  });
});
