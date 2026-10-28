from datetime import datetime, timezone

from tinydb import Query

from app.db.database import db

tasks = db.table("tasks")


def list_by_owner(owner_id: int):
    return tasks.search(Query().owner_id == owner_id)


def get_for_owner(task_id: int, owner_id: int):
    document = tasks.get(doc_id=task_id)
    if document is None or document["owner_id"] != owner_id:
        return None
    return document


def create(title: str, owner_id: int):
    task_id = tasks.insert(
        {
            "title": title,
            "done": False,
            "owner_id": owner_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return tasks.get(doc_id=task_id)


def update(task_id: int, owner_id: int, changes: dict):
    if get_for_owner(task_id, owner_id) is None:
        return None
    if changes:
        tasks.update(changes, doc_ids=[task_id])
    return tasks.get(doc_id=task_id)


def delete(task_id: int, owner_id: int) -> bool:
    if get_for_owner(task_id, owner_id) is None:
        return False
    tasks.remove(doc_ids=[task_id])
    return True
