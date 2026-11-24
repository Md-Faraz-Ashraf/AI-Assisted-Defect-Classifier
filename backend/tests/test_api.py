from datetime import UTC, datetime, timedelta

import pytest

from app.core.config import Settings
from app.main import create_app
from app.models.domain import DefectType, User, UserRole


def request_prediction(
    client, headers, image_bytes, batch_id="BATCH-001", content_type="image/png"
):
    return client.post(
        "/api/v1/ai/predict",
        headers=headers,
        data={"batch_id": batch_id},
        files={"image": ("client-supplied-name.png", image_bytes, content_type)},
    )


def submit(client, headers, analysis_id, final_defect_type, **extra):
    return client.post(
        "/api/v1/inspections",
        headers=headers,
        json={"analysis_id": analysis_id, "final_defect_type": final_defect_type, **extra},
    )


def test_health_users_and_seeded_batches(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    users = client.get("/api/v1/users").json()
    assert [(user["id"], user["role"]) for user in users] == [
        ("priya", "QUALITY_ENGINEER"),
        ("rahul", "PRODUCTION_SUPERVISOR"),
    ]
    batches = client.get("/api/v1/batches", headers={"X-Demo-User": "priya"}).json()
    assert [batch["batch_number"] for batch in batches] == ["BATCH-001", "BATCH-002", "BATCH-003"]


def test_missing_or_unknown_demo_user_is_rejected(client):
    assert client.get("/api/v1/dashboard/summary").status_code == 401
    response = client.get("/api/v1/dashboard/summary", headers={"X-Demo-User": "other"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unknown_demo_user"


def test_quality_engineer_can_predict_and_submit_with_original_prediction_preserved(
    client, engineer_headers, png_bytes
):
    predicted = request_prediction(client, engineer_headers, png_bytes)
    assert predicted.status_code == 201
    body = predicted.json()
    assert body["prediction"]["defect_type"] in [item.value for item in DefectType]
    assert 0 <= body["prediction"]["confidence"] <= 1
    assert body["prediction"]["provider"] == "mock"
    assert body["image_url"].startswith("/api/v1/images/")

    final_type = next(
        kind.value for kind in DefectType if kind.value != body["prediction"]["defect_type"]
    )
    submitted = submit(
        client,
        engineer_headers,
        body["analysis_id"],
        final_type,
        comments="Reviewed at the inspection station.",
    )
    assert submitted.status_code == 201
    record = submitted.json()
    assert record["original_ai_prediction"] == body["prediction"]["defect_type"]
    assert record["final_defect_type"] == final_type
    assert record["was_overridden"] is True
    assert record["comments"] == "Reviewed at the inspection station."


def test_accepted_prediction_sets_override_false(client, engineer_headers, png_bytes):
    analysis = request_prediction(client, engineer_headers, png_bytes).json()
    response = submit(
        client, engineer_headers, analysis["analysis_id"], analysis["prediction"]["defect_type"]
    )
    assert response.status_code == 201
    assert response.json()["was_overridden"] is False


def test_prediction_is_deterministic(client, engineer_headers, png_bytes):
    first = request_prediction(client, engineer_headers, png_bytes).json()
    second = request_prediction(client, engineer_headers, png_bytes).json()
    assert first["prediction"] == second["prediction"]


def test_prediction_rejects_unknown_batch(client, engineer_headers, png_bytes):
    response = request_prediction(client, engineer_headers, png_bytes, "BATCH-404")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "batch_not_found"


@pytest.mark.parametrize(
    ("headers", "path", "method"),
    [
        ({"X-Demo-User": "rahul"}, "/api/v1/ai/predict", "predict"),
        ({"X-Demo-User": "rahul"}, "/api/v1/inspections", "submit"),
    ],
)
def test_supervisor_is_forbidden_from_mutations(client, headers, path, method, png_bytes):
    if method == "predict":
        response = request_prediction(client, headers, png_bytes)
    else:
        response = client.post(
            path,
            headers=headers,
            json={"analysis_id": "not-owned", "final_defect_type": "Scratch"},
        )
    assert response.status_code == 403


def test_browser_cannot_supply_role_or_prediction_values(client, engineer_headers):
    assert (
        client.get(
            "/api/v1/dashboard/summary",
            headers={**engineer_headers, "X-Demo-Role": "PRODUCTION_SUPERVISOR"},
        ).status_code
        == 200
    )
    response = client.post(
        "/api/v1/inspections",
        headers=engineer_headers,
        json={
            "analysis_id": "fabricated",
            "final_defect_type": "Scratch",
            "original_ai_prediction": "No Defect",
            "ai_confidence": 1,
            "was_overridden": False,
        },
    )
    assert response.status_code == 422


def test_analysis_must_belong_to_same_user_and_cannot_be_submitted_twice(
    client, engineer_headers, png_bytes
):
    analysis = request_prediction(client, engineer_headers, png_bytes).json()
    other_user = submit(client, {"X-Demo-User": "rahul"}, analysis["analysis_id"], "Scratch")
    assert other_user.status_code == 403
    accepted = submit(
        client,
        engineer_headers,
        analysis["analysis_id"],
        analysis["prediction"]["defect_type"],
    )
    assert accepted.status_code == 201
    duplicate = submit(
        client,
        engineer_headers,
        analysis["analysis_id"],
        analysis["prediction"]["defect_type"],
    )
    assert duplicate.status_code == 409


def test_analysis_cannot_be_submitted_by_another_quality_engineer(
    client, engineer_headers, png_bytes
):
    client.app.state.container.users._users["anita"] = User(
        "anita", "Anita", UserRole.QUALITY_ENGINEER
    )
    analysis = request_prediction(client, engineer_headers, png_bytes).json()
    response = submit(
        client,
        {"X-Demo-User": "anita"},
        analysis["analysis_id"],
        "Scratch",
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "analysis_forbidden"


def test_list_filtering_pagination_sorting_and_detail(client, engineer_headers, png_bytes):
    for final_type in ("Scratch", "Dent", "Scratch"):
        analysis = request_prediction(client, engineer_headers, png_bytes).json()
        response = submit(client, engineer_headers, analysis["analysis_id"], final_type)
        assert response.status_code == 201

    page = client.get(
        "/api/v1/inspections?defect_type=Scratch&page=1&page_size=1&sort_by=inspected_at&sort_order=asc",
        headers=engineer_headers,
    )
    assert page.status_code == 200
    data = page.json()
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["total_pages"] == 2
    assert data["items"][0]["final_defect_type"] == "Scratch"
    detail = client.get(f"/api/v1/inspections/{data['items'][0]['id']}", headers=engineer_headers)
    assert detail.status_code == 200
    assert detail.json()["id"] == data["items"][0]["id"]


def test_filters_by_batch_inspector_and_date_range(client, engineer_headers, png_bytes):
    analysis = request_prediction(client, engineer_headers, png_bytes, "BATCH-002").json()
    created = submit(client, engineer_headers, analysis["analysis_id"], "Dent").json()
    result = client.get(
        "/api/v1/inspections",
        params={
            "batch_id": "BATCH-002",
            "inspector_id": "priya",
            "date_from": created["inspected_at"],
            "date_to": created["inspected_at"],
        },
        headers=engineer_headers,
    )
    assert result.status_code == 200
    assert result.json()["total"] == 1


def test_invalid_pagination_sorting_and_date_range_are_rejected(client, engineer_headers):
    assert client.get("/api/v1/inspections?page=0", headers=engineer_headers).status_code == 422
    assert (
        client.get("/api/v1/inspections?sort_by=comments", headers=engineer_headers).status_code
        == 422
    )
    later = datetime.now(UTC)
    earlier = later - timedelta(days=1)
    response = client.get(
        "/api/v1/inspections",
        params={"date_from": later.isoformat(), "date_to": earlier.isoformat()},
        headers=engineer_headers,
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_date_range"


def test_supervisor_can_read_dashboard_and_history(client):
    headers = {"X-Demo-User": "rahul"}
    assert client.get("/api/v1/inspections", headers=headers).status_code == 200
    response = client.get("/api/v1/dashboard/summary", headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        "total_inspections": 0,
        "passed_inspections": 0,
        "rejected_inspections": 0,
        "defect_rate": 0.0,
        "ai_acceptance_rate": 0.0,
        "defect_breakdown": [{"defect_type": kind.value, "count": 0} for kind in DefectType],
    }


def test_dashboard_uses_final_type_and_acceptance_includes_no_defect(
    client, engineer_headers, png_bytes
):
    provider = client.app.state.container.ai_provider
    provider.analyze = async_fixed_no_defect  # type: ignore[method-assign]
    first = request_prediction(client, engineer_headers, png_bytes).json()
    second = request_prediction(client, engineer_headers, png_bytes).json()
    assert submit(client, engineer_headers, first["analysis_id"], "No Defect").status_code == 201
    assert submit(client, engineer_headers, second["analysis_id"], "Dent").status_code == 201

    summary = client.get("/api/v1/dashboard/summary", headers=engineer_headers).json()
    assert summary["total_inspections"] == 2
    assert summary["passed_inspections"] == 1
    assert summary["rejected_inspections"] == 1
    assert summary["defect_rate"] == 50.0
    assert summary["ai_acceptance_rate"] == 50.0
    assert {item["defect_type"]: item["count"] for item in summary["defect_breakdown"]}["Dent"] == 1


async def async_fixed_no_defect(image, media_type, batch):
    del image, media_type, batch
    return '{"defect_type":"No Defect","confidence":0.91}'


@pytest.mark.parametrize(
    "raw_response",
    [
        "not-json",
        '{"defect_type":"Other","confidence":0.8}',
        '{"defect_type":"Scratch"}',
        '{"defect_type":"Scratch","confidence":1.2}',
        '{"defect_type":"Scratch","confidence":-0.1}',
        '{"defect_type":"Scratch","confidence":true}',
    ],
)
def test_invalid_ai_responses_are_rejected_without_fallback(
    client, engineer_headers, png_bytes, raw_response
):
    provider = client.app.state.container.ai_provider

    async def invalid_response(image, media_type, batch):
        del image, media_type, batch
        return raw_response

    provider.analyze = invalid_response  # type: ignore[method-assign]
    response = request_prediction(client, engineer_headers, png_bytes)
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "invalid_ai_response"
    assert client.get("/api/v1/inspections", headers=engineer_headers).json()["total"] == 0


def test_ai_timeout_and_rate_limit_return_useful_errors(client, engineer_headers, png_bytes):
    provider = client.app.state.container.ai_provider

    async def timeout(image, media_type, batch):
        del image, media_type, batch
        raise TimeoutError

    provider.analyze = timeout  # type: ignore[method-assign]
    timed_out = request_prediction(client, engineer_headers, png_bytes)
    assert timed_out.status_code == 504
    assert timed_out.json()["error"]["code"] == "ai_timeout"

    from app.core.errors import AIProviderRateLimited

    async def rate_limited(image, media_type, batch):
        del image, media_type, batch
        raise AIProviderRateLimited

    provider.analyze = rate_limited  # type: ignore[method-assign]
    limited = request_prediction(client, engineer_headers, png_bytes)
    assert limited.status_code == 503
    assert limited.json()["error"]["code"] == "ai_rate_limited"

    from app.core.errors import AIProviderError

    async def provider_error(image, media_type, batch):
        del image, media_type, batch
        raise AIProviderError("private provider detail")

    provider.analyze = provider_error  # type: ignore[method-assign]
    failed = request_prediction(client, engineer_headers, png_bytes)
    assert failed.status_code == 502
    assert failed.json()["error"]["code"] == "ai_provider_error"
    assert "private provider detail" not in failed.text


def test_invalid_images_mime_and_size_are_rejected(client, engineer_headers, png_bytes):
    invalid = request_prediction(client, engineer_headers, b"not an image")
    assert invalid.status_code == 422
    mismatch = request_prediction(client, engineer_headers, png_bytes, content_type="image/jpeg")
    assert mismatch.status_code == 415
    too_large_app = create_app(
        Settings(
            image_storage_path=str(client.app.state.container.settings.image_storage_path),
            max_image_size_bytes=8,
        )
    )
    from fastapi.testclient import TestClient

    with TestClient(too_large_app) as small_client:
        large = request_prediction(small_client, engineer_headers, png_bytes)
    assert large.status_code == 413


def test_uploaded_name_is_not_used_and_image_route_is_safe(client, engineer_headers, png_bytes):
    analysis = request_prediction(client, engineer_headers, png_bytes).json()
    image_ref = analysis["image_url"].rsplit("/", maxsplit=1)[-1]
    assert "client-supplied-name" not in image_ref
    downloaded = client.get(analysis["image_url"], headers=engineer_headers)
    assert downloaded.status_code == 200
    assert downloaded.headers["content-type"] == "image/png"
    traversal = client.get("/api/v1/images/..%2F..%2F.env", headers=engineer_headers)
    assert traversal.status_code in (404, 422)


def test_database_mode_fails_instead_of_falling_back(tmp_path):
    with pytest.raises(RuntimeError, match="APP_MODE=database"):
        create_app(Settings(app_mode="database", image_storage_path=str(tmp_path)))


def test_vision_provider_boundary_fails_clearly_without_falling_back(tmp_path, png_bytes):
    from fastapi.testclient import TestClient

    app = create_app(Settings(ai_provider="vision", image_storage_path=str(tmp_path)))
    with TestClient(app) as vision_client:
        response = request_prediction(vision_client, {"X-Demo-User": "priya"}, png_bytes)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ai_unavailable"
    assert "private" not in response.text


def test_openapi_contains_phase_two_routes(client):
    schema = client.get("/openapi.json").json()
    for path in (
        "/api/v1/users",
        "/api/v1/batches",
        "/api/v1/ai/predict",
        "/api/v1/inspections",
        "/api/v1/inspections/{inspection_id}",
        "/api/v1/dashboard/summary",
    ):
        assert path in schema["paths"]


def test_real_ai_boundary_has_taxonomy_and_structured_request_contract():
    from app.repositories.mock import MockBatchRepository
    from app.services.ai.provider import VisionProviderBoundary

    spec = VisionProviderBoundary()
    context = spec.request_context(MockBatchRepository().get_batch("BATCH-001"))
    assert context["allowed_defect_types"] == [kind.value for kind in DefectType]
    assert spec.response_schema["additionalProperties"] is False
    assert "Return JSON only" in spec.classification_instructions
