from fastapi import APIRouter, Query

from app.telemetry.repository import count_all, delete_all, insert_events_batch, list_by_event, list_recent
from app.telemetry.schemas import TelemetryBatch, TelemetryEventPublic

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("/events", status_code=200)
def receive_events(batch: TelemetryBatch):
    """Recibe un lote de eventos de telemetría y los guarda en la base de datos.

    - No requiere autenticación (sesión anónima).
    - Guarda todos los eventos y los imprime en consola (útil en desarrollo).
    - Responde siempre 200 para que el frontend no reintente.
    """
    events_data = [event.model_dump(mode="json") for event in batch.events]

    insert_events_batch(events_data)

    print(f"[telemetry] Recibidos {len(events_data)} evento(s):")
    for event in events_data:
        print(f"  → {event['event']} | {event['timestamp']} | ruta: {event['context']['route']}")

    return {"ok": True, "count": len(events_data)}


@router.get("/events", response_model=list[TelemetryEventPublic])
def read_events(
    event: str | None = Query(None, description="Filtrar por tipo de evento (page_view, login_attempted, ...)"),
    limit: int = Query(50, ge=1, le=500, description="Máximo de eventos a devolver"),
):
    """Devuelve los eventos de telemetría sin autenticación (solo desarrollo).

    - `event`: filtra por tipo de evento (opcional)
    - `limit`: máximo de eventos a devolver (1-500, default 50)
    - Devuelve los más recientes primero.
    """
    if event:
        raw_events = list_by_event(event)
    else:
        raw_events = list_recent(limit)

    return [TelemetryEventPublic.from_document(e) for e in raw_events]


@router.get("/events/summary")
def read_summary():
    """Devuelve un resumen con el total de eventos almacenados."""
    return {"total_events": count_all()}


@router.delete("/events", status_code=200)
def delete_all_events():
    """Elimina todos los eventos de telemetría."""
    deleted = delete_all()
    return {"ok": True, "deleted": deleted}