from datetime import datetime, timezone

from tinydb import Query

from app.db.database import db

users = db.table("users")


def get_by_email(email: str):
    return users.get(Query().email == email)


def get_by_id(user_id: int):
    return users.get(doc_id=user_id)


def list_all():
    return users.all()


def update(user_id: int, changes: dict):
    if get_by_id(user_id) is None:
        return None
    if changes:
        changes["updated_at"] = datetime.now(timezone.utc).isoformat()
        users.update(changes, doc_ids=[user_id])
    return get_by_id(user_id)


def delete(user_id: int) -> bool:
    if get_by_id(user_id) is None:
        return False
    users.remove(doc_ids=[user_id])
    return True


def create(name: str, email: str, password_hash: str, role: str):
    now = datetime.now(timezone.utc).isoformat()
    user_id = users.insert(
        {
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "created_at": now,
            "updated_at": now,
        }
    )
    return users.get(doc_id=user_id)
