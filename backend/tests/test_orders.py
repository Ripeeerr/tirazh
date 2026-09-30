import pytest

from app.db.models import Product

SPEC = {
    "product_slug": "business-cards",
    "format": "standard",
    "paper": "standard",
    "printing": "double",
    "quantity": 500,
}


def register(client, email="client@example.com"):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "name": "Анна Павлова", "password": "client-password"},
    )
    assert response.status_code == 201
    return response.json()


def upload(client):
    response = client.post(
        "/api/files", content=b"%PDF-1.7\nportfolio-test", headers={"X-Filename": "artwork.pdf"}
    )
    assert response.status_code == 201
    return response.json()["id"]


def order(client):
    file_id = upload(client)
    response = client.post(
        "/api/orders",
        json={
            **SPEC,
            "artwork_id": file_id,
            "contact_name": "Анна",
            "contact_phone": "+7 999 123-45-67",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def login_manager(client):
    assert (
        client.post(
            "/api/auth/login", json={"email": "manager@example.com", "password": "manager-password"}
        ).status_code
        == 200
    )


def test_price_is_calculated_and_order_snapshot_is_immutable(client, database):
    assert client.post("/api/quotes", json=SPEC).json()["price"] == 4800
    register(client)
    created = order(client)
    assert created["price"] == 4800
    with database() as db:
        db.get(Product, "business-cards").base_price = 100
        db.commit()
    assert client.post("/api/quotes", json=SPEC).json()["price"] == 60000
    assert client.get(f"/api/orders/{created['id']}").json()["price"] == 4800


@pytest.mark.parametrize(
    "field,value",
    [
        ("paper", "unknown"),
        ("format", "a0"),
        ("printing", "free"),
        ("quantity", 99),
        ("quantity", -1),
    ],
)
def test_invalid_configurations_are_rejected(client, field, value):
    assert client.post("/api/quotes", json={**SPEC, field: value}).status_code == 422


def test_client_cannot_access_other_orders_files_or_manager_routes(client):
    register(client)
    created = order(client)
    register(client, "other@example.com")
    assert client.get(f"/api/orders/{created['id']}").status_code == 404
    assert client.get(f"/api/files/{created['files'][0]['id']}").status_code == 404
    assert client.get("/api/manager/orders").status_code == 403
    assert (
        client.patch(f"/api/orders/{created['id']}/status", json={"status": "review"}).status_code
        == 403
    )


def test_complete_revision_workflow_and_file_version_history(client):
    register(client)
    created = order(client)
    url = f"/api/orders/{created['id']}"
    login_manager(client)
    assert client.patch(f"{url}/status", json={"status": "completed"}).status_code == 409
    assert client.patch(f"{url}/status", json={"status": "review"}).status_code == 200
    assert client.patch(f"{url}/status", json={"status": "revision"}).status_code == 422
    assert (
        client.patch(
            f"{url}/status", json={"status": "revision", "reason": "Добавьте вылеты"}
        ).status_code
        == 200
    )
    client.post(
        "/api/auth/login", json={"email": "client@example.com", "password": "client-password"}
    )
    replacement = upload(client)
    revised = client.post(f"{url}/artwork", params={"artwork_id": replacement})
    assert revised.status_code == 200
    assert len(revised.json()["files"]) == 2
    assert revised.json()["status"] == "review"
    login_manager(client)
    for status in ["printing", "ready", "completed"]:
        assert client.patch(f"{url}/status", json={"status": status}).status_code == 200
    assert len(client.get(url).json()["history"]) == 7
    assert (
        client.patch(f"{url}/status", json={"status": "cancelled", "reason": "Ошибка"}).status_code
        == 409
    )


def test_artwork_cannot_be_reused_for_another_order(client):
    register(client)
    created = order(client)
    response = client.post(
        "/api/orders",
        json={
            **SPEC,
            "artwork_id": created["files"][0]["id"],
            "quantity": 250,
            "contact_name": "Анна",
            "contact_phone": "+79991234567",
        },
    )
    assert response.status_code == 409


def test_upload_validation_and_authentication(client, monkeypatch):
    from app.core.config import get_settings

    assert (
        client.post(
            "/api/files", content=b"%PDF-1.7", headers={"X-Filename": "test.pdf"}
        ).status_code
        == 401
    )
    register(client)
    assert (
        client.post(
            "/api/files", content=b"executable", headers={"X-Filename": "test.pdf"}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/files", content=b"%PDF-1.7", headers={"X-Filename": "test.exe"}
        ).status_code
        == 422
    )
    monkeypatch.setattr(get_settings(), "max_upload_bytes", 10)
    assert (
        client.post(
            "/api/files", content=b"%PDF-1.7-too-large", headers={"X-Filename": "test.pdf"}
        ).status_code
        == 413
    )


def test_logout_revokes_session_and_cross_origin_writes_are_blocked(client):
    register(client)
    cookie = client.cookies.get("tirazh_session")
    assert client.post("/api/auth/logout").status_code == 204
    client.cookies.set("tirazh_session", cookie)
    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "manager@example.com", "password": "manager-password"},
            headers={"Origin": "https://evil.example"},
        ).status_code
        == 403
    )


def test_registration_cannot_grant_manager_role_and_duplicate_email_is_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "person@example.com",
            "name": "Анна",
            "password": "client-password",
            "role": "manager",
        },
    )
    assert response.json()["role"] == "client"
    duplicate = client.post(
        "/api/auth/register",
        json={"email": "PERSON@example.com", "name": "Анна", "password": "client-password"},
    )
    assert duplicate.status_code == 409


def test_retry_of_same_checkout_does_not_duplicate_order(client):
    register(client)
    created = order(client)
    retry = client.post(
        "/api/orders",
        json={
            **SPEC,
            "artwork_id": created["files"][0]["id"],
            "contact_name": "Анна",
            "contact_phone": "+7 999 123-45-67",
        },
    )
    assert retry.status_code == 201
    assert retry.json()["id"] == created["id"]
    assert len(client.get("/api/orders").json()) == 1


def test_whitespace_names_and_non_numeric_phone_are_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "blank@example.com", "name": "   ", "password": "client-password"},
    )
    assert response.status_code == 422
    register(client)
    file_id = upload(client)
    response = client.post(
        "/api/orders",
        json={**SPEC, "artwork_id": file_id, "contact_name": "Анна", "contact_phone": "-------"},
    )
    assert response.status_code == 422


def test_volume_discount_and_available_actions(client):
    assert client.post("/api/quotes", json={**SPEC, "quantity": 1000}).json()["price"] == 8160
    register(client)
    created = order(client)
    assert created["allowed_statuses"] == ["review", "cancelled"]


def test_expanded_catalog_is_idempotent_and_every_product_can_be_quoted(client):
    from app.seed import seed_catalog

    seed_catalog()
    products = client.get("/api/products").json()
    assert {product["slug"] for product in products} == {
        "business-cards",
        "flyers",
        "booklets",
        "postcards",
        "posters",
        "invitations",
    }
    for product in products:
        options = product["options"]
        for format_option in options["format"]:
            for paper in options["paper"]:
                response = client.post(
                    "/api/quotes",
                    json={
                        "product_slug": product["slug"],
                        "format": format_option["value"],
                        "paper": paper["value"],
                        "printing": options["printing"][0]["value"],
                        "quantity": options["quantities"][0],
                    },
                )
                assert response.status_code == 200
                assert response.json()["price"] > 0
