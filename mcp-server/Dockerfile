# ── Stage 1: Base & Dependencies ──────────────────────────────────────
FROM python:3.13-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Development (hot-reload via volume mount) ────────────────
FROM base AS development
COPY . .
EXPOSE 8000
CMD ["python", "mcp_server.py"]

# ── Stage 3: Production ───────────────────────────────────────────────
FROM base AS production
COPY . .
EXPOSE 8000
CMD ["python", "mcp_server.py"]