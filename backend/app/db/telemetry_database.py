from tinydb import TinyDB

from app.core.config import settings

settings.telemetry_db_path.parent.mkdir(parents=True, exist_ok=True)
if not settings.telemetry_db_path.exists() or settings.telemetry_db_path.stat().st_size == 0:
    settings.telemetry_db_path.write_text("{}\n", encoding="utf-8")

telemetry_db = TinyDB(settings.telemetry_db_path)