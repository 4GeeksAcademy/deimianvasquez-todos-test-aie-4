"""Small in-memory TTL cache for telemetry reports."""

from datetime import datetime, timezone
from threading import RLock
from time import monotonic
from typing import Any

from app.telemetry.pipeline import build_telemetry_report

CACHE_TTL_SECONDS = 60
_CacheEntry = tuple[float, dict[str, Any]]
_cache: dict[tuple[str, str], _CacheEntry] = {}
_lock = RLock()


def _utc_iso(value: datetime) -> str:
    normalized = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
    return normalized.isoformat()


def get_cached_telemetry_report(start_date: datetime, end_date: datetime) -> dict[str, Any]:
    """Return a cached report for this UTC period, building it lazily on a miss."""
    cache_key = (_utc_iso(start_date), _utc_iso(end_date))
    now = monotonic()

    # Keep the cache bounded by removing expired periods on every lookup.
    with _lock:
        expired_keys = [key for key, (expires_at, _) in _cache.items() if expires_at <= now]
        for key in expired_keys:
            del _cache[key]

        entry = _cache.get(cache_key)
        if entry is not None:
            return entry[1]

        report = build_telemetry_report(start_date, end_date)
        _cache[cache_key] = (now + CACHE_TTL_SECONDS, report)
        return report


def clear_telemetry_report_cache() -> None:
    """Invalidate cached reports when new telemetry events are ingested."""
    with _lock:
        _cache.clear()
