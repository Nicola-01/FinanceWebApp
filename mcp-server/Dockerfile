# ── Stage 1: Base & Dependencies ──────────────────────────────────────
FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Development (hot-reload) ────────────────────────────────
FROM base AS development
COPY . .
EXPOSE 8000
# Run with uvicorn reload so file changes are picked up via volume mount
CMD ["python", "main.py"]

# ── Stage 3: Production ──────────────────────────────────────────────
FROM base AS production
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
