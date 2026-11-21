from tinydb import Query

from app.db.telemetry_database import telemetry_db

events = telemetry_db.table("events")


def insert_event(event_data: dict) -> int:
    """Guarda un evento de telemetría y devuelve su doc_id."""
    return events.insert(event_data)


def insert_events_batch(events_data: list[dict]) -> list[int]:
    """Guarda varios eventos de una sola vez y devuelve sus doc_ids."""
    return events.insert_multiple(events_data)


def list_all() -> list[dict]:
    """Devuelve todos los eventos de telemetría."""
    return events.all()


def list_by_event(event_name: str) -> list[dict]:
    """Devuelve los eventos que coinciden con un nombre específico."""
    return events.search(Query().event == event_name)


def list_recent(limit: int = 50) -> list[dict]:
    """Devuelve los últimos N eventos ordenados por doc_id descendente."""
    all_events = events.all()
    return list(reversed(all_events))[:limit]


def count_all() -> int:
    """Devuelve el número total de eventos almacenados."""
    return len(events)


def delete_all() -> int:
    """Elimina todos los eventos y devuelve cuántos se borraron."""
    total = len(events)
    events.truncate()
    return total