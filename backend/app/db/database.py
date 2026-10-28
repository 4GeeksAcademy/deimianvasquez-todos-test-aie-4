from tinydb import TinyDB

from app.core.config import settings

settings.tinydb_path.parent.mkdir(parents=True, exist_ok=True)
if not settings.tinydb_path.exists() or settings.tinydb_path.stat().st_size == 0:
    settings.tinydb_path.write_text("{}\n", encoding="utf-8")

db = TinyDB(settings.tinydb_path)
