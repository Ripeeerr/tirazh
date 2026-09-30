from copy import deepcopy

import pytest


def product_payload(client):
    products = client.get("/api/products").json()
    options = next(
        product["options"] for product in products if product["slug"] == "business-cards"
    )
    return {
        "slug": "calendars",
        "title": "Календари",
        "description": "Печать календарей на заказ",
        "base_price": 20,
        "options": deepcopy(options),
    }


def manager_login(client):
    response = client.post(
        "/api/auth/login", json={"email": "manager@example.com", "password": "manager-password"}
    )
    assert response.status_code == 200


def test_manager_can_publish_a_product_that_is_immediately_orderable(client):
    payload = product_payload(client)
    assert client.post("/api/manager/products", json=payload).status_code == 401
    manager_login(client)
    created = client.post("/api/manager/products", json=payload)
    assert created.status_code == 201
    assert created.json()["title"] == "Календари"
    assert any(product["slug"] == "calendars" for product in client.get("/api/products").json())
    quote = client.post(
        "/api/quotes",
        json={
            "product_slug": "calendars",
            "format": "standard",
            "paper": "standard",
            "printing": "double",
            "quantity": 100,
        },
    )
    assert quote.status_code == 200
    assert quote.json()["price"] == 2400
    assert client.post("/api/manager/products", json=payload).status_code == 409


def test_client_cannot_publish_catalog_products(client):
    payload = product_payload(client)
    response = client.post(
        "/api/auth/register",
        json={"email": "client@example.com", "name": "Клиент", "password": "client-password"},
    )
    assert response.status_code == 201
    assert client.post("/api/manager/products", json=payload).status_code == 403


@pytest.mark.parametrize(
    "case",
    [
        "negative_price",
        "empty_formats",
        "duplicate_options",
        "invalid_dimensions",
        "invalid_quantity",
        "oversized_price",
        "zero_price",
    ],
)
def test_catalog_rejects_unusable_product_configurations(client, case):
    payload = product_payload(client)
    if case == "negative_price":
        payload["base_price"] = -1
    elif case == "empty_formats":
        payload["options"]["format"] = []
    elif case == "duplicate_options":
        payload["options"]["paper"].append(deepcopy(payload["options"]["paper"][0]))
    elif case == "invalid_dimensions":
        payload["options"]["format"][0]["hint"] = "0 × 5000 мм"
    elif case == "invalid_quantity":
        payload["options"]["quantities"] = [0]
    elif case == "oversized_price":
        payload["base_price"] = 1000000
        payload["options"]["quantities"] = [10000]
    elif case == "zero_price":
        for field in ("format", "paper", "printing"):
            payload["options"][field][0]["multiplier"] = 0.0001
    manager_login(client)
    assert client.post("/api/manager/products", json=payload).status_code == 422
    assert not any(product["slug"] == "calendars" for product in client.get("/api/products").json())
