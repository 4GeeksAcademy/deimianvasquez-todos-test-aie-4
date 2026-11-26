# Reporte técnico de telemetría

El endpoint `GET /telemetry/report` agrega los eventos almacenados en TinyDB en un período UTC y responde con volumen por día, conteo por tipo de evento y actividad diaria por ruta. El resultado se cachea en memoria durante 60 segundos; al recibir un lote nuevo de eventos se invalida la caché.

## Probar el endpoint

Desde `backend/`, inicia FastAPI:

```bash
uv run fastapi dev app/main.py
```

Consulta el período predeterminado (últimos 7 días):

```bash
curl http://localhost:8000/telemetry/report
```

O especifica fechas ISO 8601. `start_date` se incluye y `end_date` se excluye:

```bash
curl 'http://localhost:8000/telemetry/report?start_date=2026-11-20T00:00:00Z&end_date=2026-11-27T00:00:00Z'
```

La respuesta incluye `period.from`, `period.to` y estas métricas en `metrics`: `volume_by_day`, `event_types_breakdown` y `route_activity_by_day`. Si no hay eventos en el rango, las listas de métricas aparecen vacías. Fechas inválidas o un inicio posterior/igual al fin devuelven HTTP 422.

## Reporte web

Con el frontend iniciado (`cd frontend && pnpm dev`), abre [http://localhost:3000/telemetry](http://localhost:3000/telemetry). La página consulta el endpoint anterior y muestra las tres métricas.

## Límites de las métricas actuales

El catálogo existente registra actividad de producto, pero no latencia de solicitudes ni un estado técnico de error. Por ello, este reporte no calcula latencia ni tasa de errores. El almacenamiento del proyecto es TinyDB, no SQL; el pipeline filtra el período después de cargar eventos desde el repositorio.

## Pruebas

```bash
uv run pytest
```
