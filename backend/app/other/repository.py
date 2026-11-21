from datetime import datetime, timezone

from app.db.database import db

contacts = db.table("contacts")


def create(name: str, email: str, message: str):
    contact_id = contacts.insert(
        {
            "name": name,
            "email": email,
            "message": message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return contacts.get(doc_id=contact_id)


def list_all():
    return contacts.all()


def get_by_id(contact_id: int):
    return contacts.get(doc_id=contact_id)


def delete(contact_id: int) -> bool:
    if get_by_id(contact_id) is None:
        return False
    contacts.remove(doc_ids=[contact_id])
    return True