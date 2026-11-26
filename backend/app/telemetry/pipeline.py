"""Pandas analysis pipeline for the telemetry events stored by this app.

TinyDB is the existing persistence layer (not SQL/Supabase), so events are
loaded through the telemetry repository and the requested UTC window is applied
before aggregation. The stored events currently have no technical error status
or request latency fields; metrics below only report dimensions present today.
"""

from datetime import datetime, timezone
from typing import Any

import pandas as pd

from app.telemetry.repository import list_all


def _as_utc_timestamp(value: datetime) -> pd.Timestamp:
    """Normalize an aware or naive datetime to a UTC Pandas timestamp."""
    timestamp = pd.Timestamp(value)
    if timestamp.tzinfo is None:
        return timestamp.tz_localize(timezone.utc)
    return timestamp.tz_convert(timezone.utc)


def _load_events(start_date: datetime, end_date: datetime) -> pd.DataFrame:
    """Load events and keep the half-open [start_date, end_date) UTC window."""
    start = _as_utc_timestamp(start_date)
    end = _as_utc_timestamp(end_date)
    if start >= end:
        raise ValueError("start_date must be earlier than end_date")

    frame = pd.json_normalize(list_all())
    required_columns = {"event", "timestamp"}
    if frame.empty:
        return pd.DataFrame(columns=["event", "timestamp", "route"])
    if not required_columns.issubset(frame.columns):
        return pd.DataFrame(columns=["event", "timestamp", "route"])

    # Convert timestamps before filtering or any temporal grouping.
    # TinyDB may contain both ISO timestamps ending in `Z` and timestamps with
    # explicit offsets (for example `+00:00`); mixed parsing avoids silently
    # dropping valid events when Pandas infers the format from the first row.
    frame["timestamp"] = pd.to_datetime(
        frame["timestamp"], utc=True, errors="coerce", format="mixed"
    )
    frame = frame.dropna(subset=["timestamp"])
    frame = frame.loc[(frame["timestamp"] >= start) & (frame["timestamp"] < end)].copy()
    if "context.route" not in frame.columns:
        frame["context.route"] = pd.NA
    return frame.rename(columns={"context.route": "route"})


def _records(grouped: pd.DataFrame, date_column: str = "date") -> list[dict[str, Any]]:
    """Return JSON-friendly records, including ISO-formatted date dimensions."""
    if date_column in grouped.columns:
        grouped[date_column] = grouped[date_column].astype(str)
    return grouped.to_dict(orient="records")


def volume_by_day(start_date: datetime, end_date: datetime) -> list[dict[str, Any]]:
    """Count all telemetry events per UTC calendar day."""
    frame = _load_events(start_date, end_date)
    if frame.empty:
        return []
    frame["date"] = frame["timestamp"].dt.strftime("%Y-%m-%d")
    result = (
        frame.groupby("date", as_index=False)
        .agg(event_count=("event", "count"))
        .sort_values("date")
    )
    return _records(result)


def event_types_breakdown(start_date: datetime, end_date: datetime) -> list[dict[str, Any]]:
    """Count events by type, ordered from most to least frequent."""
    frame = _load_events(start_date, end_date)
    if frame.empty:
        return []
    result = (
        frame.groupby("event", as_index=False)
        .agg(event_count=("timestamp", "count"))
        .sort_values(["event_count", "event"], ascending=[False, True])
    )
    return _records(result, date_column="")


def route_activity_by_day(start_date: datetime, end_date: datetime) -> list[dict[str, Any]]:
    """Count events per UTC day and application route, omitting missing routes."""
    frame = _load_events(start_date, end_date)
    frame = frame.dropna(subset=["route"])
    if frame.empty:
        return []
    frame["date"] = frame["timestamp"].dt.strftime("%Y-%m-%d")
    result = (
        frame.groupby(["date", "route"], as_index=False)
        .agg(event_count=("event", "count"))
        .sort_values(["date", "event_count", "route"], ascending=[True, False, True])
    )
    return _records(result)


def build_telemetry_report(start_date: datetime, end_date: datetime) -> dict[str, Any]:
    """Build a report for one explicit UTC period; no window defaults are hidden here."""
    start = _as_utc_timestamp(start_date)
    end = _as_utc_timestamp(end_date)
    if start >= end:
        raise ValueError("start_date must be earlier than end_date")

    return {
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "metrics": {
            "volume_by_day": volume_by_day(start_date, end_date),
            "event_types_breakdown": event_types_breakdown(start_date, end_date),
            "route_activity_by_day": route_activity_by_day(start_date, end_date),
        },
    }
