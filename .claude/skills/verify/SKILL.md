---
name: verify
description: Drive this repo's backend/API end-to-end for verification — throwaway Postgres + second bootRun instance, without touching the user's running services or the shared dev DB.
---

# Verifying FinanceWebApp changes at runtime

## What is usually already running (do NOT touch)

- `finance_db` — the user's shared dev Postgres on :5432 (docker). Never write to it.
- The user's backend on :8080, typically launched from IntelliJ (old code — it won't have your changes).
- Vite dev server on :5173 (never kill it).

## Recipe: isolated backend instance with your working-tree code

1. **Throwaway DB** (image `postgres:16-alpine` is already local):
   ```bash
   docker run --rm -d --name verify_pg -e POSTGRES_PASSWORD=verify \
     -e POSTGRES_USER=verify -e POSTGRES_DB=verifydb -p 5433:5432 postgres:16-alpine
   ```
   Schema is created by `ddl-auto=update` on boot; `DataInitializer` creates the admin
   from `ADMIN_*` env, so you get known credentials for free.

2. **Env**: `source .env` is a trap —
   - plain `source .env` may load a different file (bash searches `$PATH` first); use `./.env`;
   - `POSTGRES_PASSWORD` contains a space → shell parsing truncates it;
   - `R2_*` values are wrapped in double quotes (docker-compose strips them, the shell doesn't).
   Generate a quoted `env.sh` with Python (strip surrounding quotes per value) and source that.
   Set `R2_ENABLED=false` to keep the run off the real bucket.

3. **JWT**: `.env` has `JWT_EXPIRATION=15000` → access tokens die in **15 seconds**
   (the SPA masks it via auto-refresh). Export `JWT_EXPIRATION=900000` for curl-based flows.

4. **Boot** (the Gradle daemon does not inherit your shell env — use `--no-daemon`):
   ```bash
   export DB_HOST=localhost DB_PORT=5433 POSTGRES_DB=verifydb POSTGRES_USER=verify \
     POSTGRES_PASSWORD=verify ADMIN_USERNAME=verifyadmin \
     ADMIN_EMAIL=verifyadmin@example.com ADMIN_PASSWORD='VerifyPass123!' JWT_EXPIRATION=900000
   cd backend && ./gradlew bootRun --no-daemon --args='--server.port=8081' &
   ```
   Ready when `GET :8081/api/wallets` returns 401 (~30-60 s incl. compile).

5. **Login**: `POST /api/auth/login` with `{"username":"verifyadmin","password":"...","rememberMe":false}`
   → `{token}`. The fresh admin has `passwordMustChange=true`; API calls still work with the token.

6. **Drive**: all endpoints under `/api/...`; RFC-7807 errors (`title`/`detail`), row errors → 409.
   DB-level assertions: `docker exec verify_pg psql -U verify -d verifydb -t -c "SELECT ..."`
   (tables: `wallets`, `tags`, `subscriptions`, `transactions`, `app_users`, `wallet_access`).

7. **Teardown**: kill the pid listening on :8081, `docker rm -f verify_pg`
   (`--rm` makes stop enough). Confirm :8080/:5173 still respond.

## Frontend

The dev server on :5173 proxies to the user's :8080 backend (old code), so browser flows
won't exercise new endpoints; no browser automation is set up in this repo. Verify the API
surface with the exact JSON the frontend layer sends (see `src/modals/wallet/walletCreation.ts`
etc.) and rely on Vitest for the orchestration logic.
