from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

from app.telemetry.cache import clear_telemetry_report_cache, get_cached_telemetry_report
from app.telemetry.repository import count_all, count_by_event, delete_all, insert_events_batch, list_all, list_by_event, list_recent
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
    clear_telemetry_report_cache()

    print(f"[telemetry] Recibidos {len(events_data)} evento(s):")
    for event in events_data:
        print(f"  → {event['event']} | {event['timestamp']} | ruta: {event['context']['route']}")

    return {"ok": True, "count": len(events_data)}


@router.get("/report")
def read_report(
    start_date: datetime | None = Query(None, description="Inicio inclusivo del periodo, ISO 8601"),
    end_date: datetime | None = Query(None, description="Fin exclusivo del periodo, ISO 8601"),
):
    """Devuelve métricas operacionales con cache TTL de 60 segundos."""
    now = datetime.now(timezone.utc)
    resolved_end = end_date or now
    resolved_start = start_date or (resolved_end - timedelta(days=7))

    # Interpretar valores ISO sin zona como UTC y normalizar los demás offsets.
    if resolved_start.tzinfo is None:
        resolved_start = resolved_start.replace(tzinfo=timezone.utc)
    else:
        resolved_start = resolved_start.astimezone(timezone.utc)
    if resolved_end.tzinfo is None:
        resolved_end = resolved_end.replace(tzinfo=timezone.utc)
    else:
        resolved_end = resolved_end.astimezone(timezone.utc)

    if resolved_start >= resolved_end:
        raise HTTPException(status_code=422, detail="start_date must be earlier than end_date")

    return get_cached_telemetry_report(resolved_start, resolved_end)


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


@router.get("/stats")
def read_stats():
    """Devuelve estadísticas agregadas de telemetría.

    - total_events: número total de eventos
    - by_event: desglose por tipo de evento
    - recent_events: últimos 10 eventos
    """
    by_event = count_by_event()
    recent = list_recent(10)
    return {
        "total_events": count_all(),
        "by_event": by_event,
        "recent_events": [TelemetryEventPublic.from_document(e) for e in recent],
    }


@router.delete("/events", status_code=200)
def delete_all_events():
    """Elimina todos los eventos de telemetría."""
    deleted = delete_all()
    return {"ok": True, "deleted": deleted}