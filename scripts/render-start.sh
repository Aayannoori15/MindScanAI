#!/bin/sh
# Bind 0.0.0.0:$PORT immediately. Render kills the service if this does not happen.
set -e
export PYTHONPATH="${PYTHONPATH:-.}"
if [ -z "$PORT" ]; then
  echo "PORT is not set" >&2
  exit 1
fi
exec python -m uvicorn backend.app:app --host 0.0.0.0 --port "$PORT"
