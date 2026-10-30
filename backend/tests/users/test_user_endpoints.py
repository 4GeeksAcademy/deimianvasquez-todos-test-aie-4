import pytest
from fastapi.testclient import TestClient
from tinydb.table import Document

from app.auth.dependencies import get_current_user, require_admin
from app.main import app
from app.users import router as users_router
from app.users.schemas import UserPublic


def user_document(user_id=1, name="Ana", email="ana@example.com", role="user"):
    return Document(
        {
            "name": name,
            "email": email,
            "password_hash": "hashed-password",
            "role": role,
            "created_at": "2026-01-01T00:00:00+00:00",
            "updated_at": "2026-01-01T00:00:00+00:00",
        },
        doc_id=user_id,
    )


def public_user(user_id=1, role="user"):
    return UserPublic.from_document(user_document(user_id=user_id, role=role))


@pytest.fixture
def client():
    app.dependency_overrides.clear()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_list_users_returns_users_for_admin(client, monkeypatch):
    app.dependency_overrides[require_admin] = lambda: public_user(role="admin")
    monkeypatch.setattr(users_router, "list_all", lambda: [user_document()])

    response = client.get("/users")

    assert response.status_code == 200
    assert response.json()[0]["email"] == "ana@example.com"


def test_list_users_rejects_non_admin(client):
    app.dependency_overrides[get_current_user] = lambda: public_user()

    response = client.get("/users")

    assert response.status_code == 403


@pytest.mark.parametrize("path", ["/users", "/users/me"])
def test_protected_user_routes_require_authentication(client, path):
    response = client.get(path)

    assert response.status_code == 401


def test_read_current_user_returns_authenticated_user(client):
    app.dependency_overrides[get_current_user] = lambda: public_user()

    response = client.get("/users/me")

    assert response.status_code == 200
    assert response.json()["id"] == 1
    assert response.json()["email"] == "ana@example.com"


def test_read_user_returns_own_user(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user(user_id=5)
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))

    response = client.get("/users/5")

    assert response.status_code == 200
    assert response.json()["id"] == 5


def test_read_user_returns_not_found(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user()
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: None)

    response = client.get("/users/99")

    assert response.status_code == 404


def test_read_user_forbids_reading_another_user(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user(user_id=1)
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))

    response = client.get("/users/2")

    assert response.status_code == 403


def test_update_user_changes_own_profile(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user()
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))
    monkeypatch.setattr(users_router, "get_by_email", lambda email: None)
    monkeypatch.setattr(users_router, "hash_password", lambda password: "new-hash")
    updated_fields = {}

    def fake_update(user_id, changes):
        updated_fields.update(changes)
        return user_document(
            user_id=user_id,
            name=changes.get("name", "Ana"),
            email=changes.get("email", "ana@example.com"),
        )

    monkeypatch.setattr(users_router, "update", fake_update)

    response = client.patch(
        "/users/1",
        json={"name": "Ana Nueva", "email": "NUEVA@example.com", "password": "new-password"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Ana Nueva"
    assert response.json()["email"] == "nueva@example.com"
    assert updated_fields == {
        "name": "Ana Nueva",
        "email": "nueva@example.com",
        "password_hash": "new-hash",
    }


def test_update_user_rejects_duplicate_email(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user()
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))
    monkeypatch.setattr(users_router, "get_by_email", lambda email: user_document(user_id=2))

    response = client.patch("/users/1", json={"email": "other@example.com"})

    assert response.status_code == 409


def test_update_user_rejects_missing_user(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user()
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: None)

    response = client.patch("/users/1", json={"name": "Ana Nueva"})

    assert response.status_code == 404


def test_update_user_forbids_updating_another_user(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user(user_id=1)
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))

    response = client.patch("/users/2", json={"name": "Ana Nueva"})

    assert response.status_code == 403


def test_delete_user_deletes_own_account(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user()
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))
    deleted_ids = []
    monkeypatch.setattr(users_router, "delete", lambda user_id: deleted_ids.append(user_id))

    response = client.delete("/users/1")

    assert response.status_code == 204
    assert deleted_ids == [1]


def test_delete_user_returns_not_found(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user()
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: None)

    response = client.delete("/users/1")

    assert response.status_code == 404


def test_delete_user_forbids_deleting_another_user(client, monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: public_user(user_id=1)
    monkeypatch.setattr(users_router, "get_by_id", lambda user_id: user_document(user_id=user_id))

    response = client.delete("/users/2")

    assert response.status_code == 403