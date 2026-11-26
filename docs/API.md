# API Reference — `/api/v1`

FastAPI OpenAPI UI: `http://127.0.0.1:8000/docs`; OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`.

## Demo-user selection

Protected requests send `X-User-Id: 1` or `X-User-Id: 2`. The backend looks up that ID and obtains the role from its repository. The browser cannot provide an authoritative role. This selection mechanism is for the take-home demo and is not production authentication.

| Demo user | Role | Permissions |
|---|---|---|
| `1` (Priya) | `QUALITY_ENGINEER` | Read, upload/analyze, submit inspections |
| `2` (Rahul) | `PRODUCTION_SUPERVISOR` | Read dashboard and inspection history |

Missing or unknown selection returns `401`; forbidden mutations return `403`.

## Endpoints

| Method and path | User required | Purpose |
|---|---|---|
| `GET /health` | No | Process health |
| `GET /users` | No | Seeded users, including `user_id`, for user selection |
| `GET /batches` | Yes | Seeded manufacturing batches, including `batch_id` |
| `POST /ai/predict` | Quality Engineer | Validate/store image, request a prediction, create an `UNREVIEWED` inspection record |
| `POST /inspections` | Quality Engineer | Transition the existing record to `REVIEWED` with the human decision |
| `GET /inspections` | Yes | Filtered, sorted, paginated inspection history |
| `GET /inspections/{inspection_id}` | Yes | Inspection detail, including `inspection_id` |
| `GET /dashboard/summary` | Yes | Server-calculated quality metrics |
| `GET /images/{image_ref}` | Yes | Serve an image by its generated reference |

## Upload and analyze

`POST /api/v1/ai/predict` accepts `multipart/form-data` with `batch_id` and `image`. Allowed image types are JPEG, PNG, and WebP, up to 5 MiB by default. The server verifies the decoded image, ignores the original filename, and stores it under a random reference. Successful analysis returns `201`:

```json
{
  "analysis_id": "a server-generated identifier",
  "status": "UNREVIEWED",
  "batch_id": "BATCH-001",
  "image_url": "/api/v1/images/a-generated-reference.png",
  "prediction": {
    "defect_type": "Scratch",
    "confidence": 0.82,
    "provider": "mock",
    "model": "deterministic-image-hash-v1"
  },
  "created_at": "2026-11-24T12:00:00Z"
}
```

The API's `analysis_id` contains the value of the row's `inspection_id` primary key. In PostgreSQL mode it is created in `inspections` with status `UNREVIEWED`; a successful submission updates that same row to `REVIEWED`. No second analysis/inspection row is created.

The mock provider is deterministic for the same image. Its confidence is an indicative model-reported score, not a calibrated probability. It is not a real AI analysis. A failed provider response never becomes `No Defect`.

### Outbound Gemini provider request and response

This is the backend-to-Gemini call made when `AI_PROVIDER=gemini`; it is separate from the browser's multipart request to `/ai/predict`. The backend uses the configured `LLM_MODEL` (default `gemini-3.5-flash-lite`) and sends the prompt, manufacturing context, and already-validated image bytes through the Google GenAI SDK. The API key stays in backend configuration and is not part of the prompt or browser request.

The following shows the SDK arguments in a readable Python-style form. The image is passed as an SDK `Part` built from its bytes and verified MIME type; the SDK handles HTTP serialization:

```python
model = "gemini-3.5-flash-lite"
contents = [
    """Inspect the uploaded manufactured product image using the product and batch context.
Choose exactly one allowed defect category; do not invent categories. Return JSON only with
defect_type and confidence from 0 to 1. Confidence is an indicative model-reported score,
not a calibrated probability.
Manufacturing context: {"batch_number":"BATCH-001","product_name":"Steel Bracket X200",
"production_line":"Line 3","allowed_defect_types":["Scratch","Dent","Paint Issue",
"Missing Component","No Defect"]}
Inspect the visible product surfaces carefully. If no listed defect is visible, choose No Defect.
Do not infer defects that cannot be seen in the image.""",
    types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
]
config = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=types.Schema(
        type="OBJECT",
        properties={
            "defect_type": types.Schema(
                type="STRING",
                enum=["Scratch", "Dent", "Paint Issue", "Missing Component", "No Defect"],
            ),
            "confidence": types.Schema(type="NUMBER"),
        },
        required=["defect_type", "confidence"],
    ),
    max_output_tokens=128,
)
response = await client.models.generate_content(
    model=model,
    contents=contents,
    config=config,
)
raw_response = response.text
```

The provider's raw response is text, expected to contain JSON like:

```json
{"defect_type":"Scratch","confidence":0.82}
```

The backend parses this text with `ProviderPrediction`: extra fields are rejected, `defect_type` must be one of the five `DefectType` values, and `confidence` must be a strict number between 0 and 1. Invalid or missing output fails the request; it is not converted into a successful prediction. Gemini does **not** return `analysis_id`: after validation, the backend generates the inspection UUID, saves the image, creates an `UNREVIEWED` record, and returns the browser-facing `/ai/predict` response shown above.

## Submit the human decision

`POST /api/v1/inspections` accepts JSON. The browser submits only the unreviewed analysis ID, final defect, and optional comment; AI output, confidence, role, and override status are loaded or calculated by the server.

```json
{
  "analysis_id": "the id returned by /ai/predict",
  "final_defect_type": "Dent",
  "comments": "Reviewed under inspection lighting."
}
```

The server verifies the record owner, batch, and image; prevents resubmission; preserves the original prediction; calculates `was_overridden = original_ai_prediction != final_defect_type`; and returns the completed record with status `REVIEWED`.

## History filters and pagination

`GET /api/v1/inspections` accepts:

- `defect_type`: one of the five supported categories (filters on final human classification).
- `batch_id`, `inspector_id`.
- `date_from`, `date_to`: ISO 8601 timestamps; timestamps without an offset are treated as UTC.
- `page` (default 1), `page_size` (default 20, maximum 100).
- `sort_by`: `inspected_at`, `batch_id`, `final_defect_type`, or `inspector_id`.
- `sort_order`: `asc` or `desc` (default `desc`).

The response contains `items`, `page`, `page_size`, `total`, and `total_pages`. Ordering includes `inspection_id` as a stable tie-breaker.

## Dashboard definitions

- Passed: `final_defect_type = No Defect`.
- Rejected: all other final classifications.
- Defect rate: `rejected / total * 100`.
- AI acceptance rate: count of `was_overridden = false` divided by total. This includes accepted `No Defect` predictions.
- Breakdown counts group by final human-confirmed category.
- With no inspections, both percentages return zero.

## Error response

Application errors use a stable envelope:

```json
{"error":{"code":"batch_not_found","message":"The selected batch does not exist."}}
```

Request validation errors return HTTP `422` with an `error` object and field details. Other common statuses are `401`, `403`, `404`, `409` (duplicate submission), `413` (oversized image), `415` (unsupported/mismatched media), `502` (provider or provider-response error), `503` (provider unavailable/rate limited), and `504` (provider timeout).

## Swagger smoke test

1. Start the backend as described in the root README.
2. Open `http://127.0.0.1:8000/docs`.
3. Run `GET /users` and `GET /health`.
4. Run `GET /batches` with `X-User-Id: 1`.
5. Run `POST /ai/predict` with `batch_id=BATCH-001` and a local JPEG, PNG, or WebP file.
6. Copy `analysis_id`; submit it through `POST /inspections` with `final_defect_type` equal to or different from the AI result.
7. Verify `GET /inspections`, detail, image URL, and `GET /dashboard/summary`.
8. Repeat protected reads as Rahul and confirm prediction/submission return `403`.

## PowerShell `curl.exe` example

The upload example assumes you have a local PNG at `C:\temp\product.png`:

```powershell
curl.exe -H "X-User-Id: 1" http://127.0.0.1:8000/api/v1/batches
curl.exe -H "X-User-Id: 1" -F "batch_id=BATCH-001" -F "image=@C:\temp\product.png;type=image/png" http://127.0.0.1:8000/api/v1/ai/predict
```

Copy `analysis_id` from the prediction response and submit it (replace the example ID). In database mode, this ID identifies the `UNREVIEWED` row and is transitioned to `REVIEWED` on successful submission:

```powershell
curl.exe -H "X-User-Id: 1" -H "Content-Type: application/json" -d '{"analysis_id":"REPLACE_WITH_ANALYSIS_ID","final_defect_type":"No Defect","comments":"Reviewed manually."}' http://127.0.0.1:8000/api/v1/inspections
curl.exe -H "X-User-Id: 2" http://127.0.0.1:8000/api/v1/dashboard/summary
curl.exe -H "X-User-Id: 2" "http://127.0.0.1:8000/api/v1/inspections?page=1&page_size=10"
```

## Current implementation limits

Mock repositories are in-memory and reset on backend restart. `AI_PROVIDER=mock` uses deterministic predictions; `AI_PROVIDER=gemini` sends validated image bytes and batch context to the configured Gemini model. The Gemini response is constrained to the supported defect taxonomy and validated by the backend before an analysis is created. Gemini credentials are backend-only. PostgreSQL repository selection remains independent via `APP_MODE`.
