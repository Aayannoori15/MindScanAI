FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates libsndfile1 ffmpeg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements-ml.txt ./
COPY backend/requirements.txt backend/requirements.txt
COPY backend/requirements-ml.txt backend/requirements-ml.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements-ml.txt

COPY backend backend
COPY frontend frontend

WORKDIR /app/frontend
RUN npm ci && npm run build

WORKDIR /app
ENV PYTHONPATH=/app
ENV APP_ENV=production
ENV USE_MOCK_INFERENCE=false
EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
