"""Timestamp serialisation.

`created_at` is stored naive in UTC. Emitting it without an offset makes
clients guess: `new Date("2026-08-13T09:49:57")` in a browser resolves a naive
string as *local* time, so an IST viewer read a 09:49 UTC session as 09:49 IST
and every timestamp appeared 5h30m early. Always send the offset.
"""

from datetime import datetime, timezone


def iso_utc(dt: datetime | None) -> str | None:
    """ISO-8601 with an explicit UTC offset, e.g. 2026-08-13T09:49:57+00:00."""
    if dt is None:
        return None
    aware = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
    return aware.isoformat()
