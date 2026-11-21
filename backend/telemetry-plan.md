# Plan de Telemetría — Todolist App

## Objetivo

Agregar telemetría frontend (y backend mínimo) para capturar eventos clave del usuario sin alterar el flujo de las pantallas ni exponer datos personales.

---

## Bases de datos

| Propósito | Archivo | Conexión |
|-----------|---------|----------|
| App principal (auth, tasks, contacts) | `data/db.json` | `app/db/database.py` → `db` |
| Telemetría (eventos) | `data/telemetry.json` | `app/db/telemetry_database.py` → `telemetry_db` |

Ambas usan TinyDB con documentos separados.

---

## Backend — Ruta de telemetría

- **`POST /telemetry/events`**
  - Recibe `{ events: [...] }` sin autenticación
  - Valida que `events` sea una lista no vacía
  - Guarda cada evento en `telemetry_db`
  - Imprime el body en consola (solo dev)
  - Responde `200 OK`
  - No interfiere con auth, todos ni contactos

---

## Frontend — Eventos a capturar

| Evento | Dispara | Properties |
|--------|---------|------------|
| `page_view` | Al montar cada página | `url`, `route`, `referrer` |
| `login_attempted` | Al intentar login | `method`, `success` |
| `todo_created` | Al crear un todo | `todo_id` |
| `todo_completed` | Al completar un todo | `todo_id` |
| `todo_deleted` | Al eliminar una tarea | `todo_id` |
| `contact_created` | Al crear un contacto | `contact_id` |

---

## Pipeline del evento (`guardEvent`)

1. Si `consent.analytics === false` → `return null` (pedir consentimiento con aviso en localStorage)
2. Sanitizar: reemplazar emails → `[email]`, teléfonos → `[phone]`, cortar a 200 caracteres en campos libres
3. Lista blanca por evento (solo los campos definidos)
4. Muestreo: estos cuatro eventos van al 100 %
5. Si `env !== production` → `console.log` + `return null`

---

## Formato del evento

```json
{
  "event": "snake_case_del_evento",
  "timestamp": "ISO 8601 del momento en que ocurrió",
  "user": {
    "userId": "id opaco del usuario logueado o null",
    "anonymousId": "id opaco anónimo o null",
    "sessionId": "siempre presente"
  },
  "context": {
    "appVersion": "versión de la app",
    "env": "production | development",
    "route": "ruta actual"
  },
  "properties": {}
}
```

**Reglas estrictas:**
- `userId` y `anonymousId` son **excluyentes** (uno de los dos es `null`)
- `sessionId` va **siempre**
- Nunca incluir email, teléfono, nombre, token ni body de request/response

---

## Envío al backend

- Buffer en memoria
- `POST /telemetry/events` con `{ events: [...] }`, `keepalive: true`
- Vaciado: cada **50 eventos** o cada **3 segundos** sin nuevos eventos
- En `visibilitychange` (cuando la página queda hidden): `navigator.sendBeacon`
- Reintentos: si falla, guardar lote en localStorage y reintentar a 1s, 2s, 4s; al 4º fallo descartar

---

## Archivos planificados (frontend)

| Archivo | Propósito |
|---------|-----------|
| `src/lib/telemetry.ts` | Función `guardEvent()`, buffer, envío, reintentos |
| `src/lib/consent.ts` | Lógica de consentimiento y localStorage |

---

## Próximos pasos

1. ✅ Base de datos de telemetría separada (`telemetry_db`)
2. ⬜ Crear `POST /telemetry/events` en backend
3. ⬜ Crear `src/lib/telemetry.ts` con `guardEvent`, buffer, envío
4. ⬜ Crear `src/lib/consent.ts` con aviso y localStorage
5. ⬜ Integrar `track()` en cada página/handler (sin alterar flujo)