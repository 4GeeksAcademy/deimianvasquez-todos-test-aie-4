from datetime import datetime

from pydantic import BaseModel, Field


class TelemetryUser(BaseModel):
    """Información del usuario que genera el evento.

    - userId: id opaco del usuario logueado (o null si es anónimo)
    - anonymousId: id opaco anónimo (o null si está logueado)
    - sessionId: siempre presente
    """
    userId: str | None = None
    anonymousId: str | None = None
    sessionId: str


class TelemetryContext(BaseModel):
    """Contexto de la aplicación al momento del evento."""
    appVersion: str
    env: str
    route: str


class TelemetryEvent(BaseModel):
    """Un evento individual de telemetría."""
    event: str = Field(description="Nombre del evento en snake_case")
    timestamp: datetime = Field(description="ISO 8601 del momento en que ocurrió")
    user: TelemetryUser
    context: TelemetryContext
    properties: dict = Field(default_factory=dict, description="Propiedades específicas del evento")


class TelemetryBatch(BaseModel):
    """Lote de eventos que llegan en una sola petición."""
    events: list[TelemetryEvent] = Field(min_length=1)


class TelemetryEventPublic(BaseModel):
    """Evento tal como se devuelve en la respuesta GET (con su id interno)."""
    id: int
    event: str
    timestamp: datetime
    user: TelemetryUser
    context: TelemetryContext
    properties: dict

    @classmethod
    def from_document(cls, document):
        data = {"id": document.doc_id, **document}
        # Eventos generados desde el backend pueden no tener user/context
        if "user" not in data:
            data["user"] = {"userId": None, "anonymousId": None, "sessionId": "server"}
        if "context" not in data:
            data["context"] = {"appVersion": "0.1.0", "env": "development", "route": "/unknown"}
        return cls.model_validate(data)