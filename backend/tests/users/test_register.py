from fastapi.testclient import TestClient
from tinydb.table import Document

from app.main import app
from app.users import router as users_router


def test_register_user_creates_user(monkeypatch):
    stored_user = {}
    sent_emails = []

    def fake_create(name, email, password_hash, role):
        stored_user.update(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
        )
        return Document(
            {
                **stored_user,
                "created_at": "2026-01-01T00:00:00+00:00",
                "updated_at": "2026-01-01T00:00:00+00:00",
            },
            doc_id=1,
        )

    monkeypatch.setattr(users_router, "get_by_email", lambda email: None)
    monkeypatch.setattr(users_router, "create", fake_create)
    monkeypatch.setattr(users_router, "hash_password", lambda password: "hashed-password")
    monkeypatch.setattr(
        users_router,
        "send_welcome_email",
        lambda **email: sent_emails.append(email),
    )

    response = TestClient(app).post(
        "/users",
        json={
            "name": "Ana",
            "email": "ANA@example.com",
            "password": "secure-password",
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": 1,
        "name": "Ana",
        "email": "ana@example.com",
        "role": "user",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    assert stored_user["password_hash"] == "hashed-password"
    assert sent_emails == [{"to": "ana@example.com", "name": "Ana"}]


def test_register_user_rejects_duplicate_email(monkeypatch):
    monkeypatch.setattr(users_router, "get_by_email", lambda email: object())

    response = TestClient(app).post(
        "/users",
        json={
            "name": "Ana",
            "email": "ana@example.com",
            "password": "secure-password",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_register_user_rejects_invalid_email():
    response = TestClient(app).post(
        "/users",
        json={"name": "Ana", "email": "not-an-email", "password": "secure-password"},
    )

    assert response.status_code == 422