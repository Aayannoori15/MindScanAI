#!/bin/sh
# Bind 0.0.0.0:$PORT immediately. Render kills the service if this does not happen.
set -e
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export TOKENIZERS_PARALLELISM=false
export WEB_CONCURRENCY=1
if [ -z "$PORT" ]; then
  echo "PORT is not set" >&2
  exit 1
fi
exec python -m uvicorn backend.app:app --host 0.0.0.0 --port "$PORT"
