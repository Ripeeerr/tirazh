from app.core.config import get_settings
from app.db.models import User


def register(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "security@example.com", "name": "Клиент", "password": "client-password"},
    )
    assert response.status_code == 201
    return response


def test_request_host_does_not_expand_trusted_origins(client):
    register(client)
    response = client.patch(
        "/api/auth/me",
        headers={"Host": "evil.example", "Origin": "http://evil.example"},
        json={"name": "Другое имя", "phone": ""},
    )
    assert response.status_code == 403
    assert client.get("/api/auth/me").json()["name"] == "Клиент"


def test_only_configured_frontend_origin_can_write(client):
    register(client)
    response = client.patch(
        "/api/auth/me",
        headers={"Origin": get_settings().frontend_origin},
        json={"name": "Обновлённое имя", "phone": ""},
    )
    assert response.status_code == 200


def test_uploads_are_private_downloads_and_cannot_be_html_or_svg(client):
    register(client)
    for name, content in [
        ("page.html", b"<script>alert(1)</script>"),
        ("image.svg", b'<svg onload="alert(1)"></svg>'),
        ("image.png", b'<svg onload="alert(1)"></svg>'),
    ]:
        response = client.post("/api/files", content=content, headers={"X-Filename": name})
        assert response.status_code == 422
    upload = client.post(
        "/api/files",
        content=b"%PDF-1.7\nsecurity-test",
        headers={"X-Filename": "../../artwork.pdf"},
    )
    assert upload.status_code == 201
    assert upload.json()["name"] == "artwork.pdf"
    response = client.get(f"/api/files/{upload.json()['id']}")
    assert response.status_code == 200
    assert response.headers["content-disposition"].startswith("attachment;")
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["content-security-policy"] == "sandbox; default-src 'none'"
    assert response.headers["cross-origin-resource-policy"] == "same-origin"
    client.cookies.clear()
    assert client.get(f"/api/files/{upload.json()['id']}").status_code == 401


def test_passwords_and_session_tokens_are_not_returned_in_json(client, database):
    response = register(client)
    assert set(response.json()) == {"id", "name", "email", "phone", "role"}
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    with database() as db:
        user = db.get(User, response.json()["id"])
        assert user.password_hash.startswith("scrypt$")
        assert user.password_hash != "client-password"
