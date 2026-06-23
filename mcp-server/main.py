"""
FinanceWebApp MCP Server
========================
A Model Context Protocol server that bridges LLM clients (Claude, Cursor, etc.)
to the FinanceWebApp Spring Boot backend.

Transport : Streamable HTTP (stateless, JSON responses)
Endpoint  : http://localhost:8000/mcp
Auth      : Bearer token read from the HTTP Authorization header.
            Supports both OAuth 2.0 (Claude.ai) and manual API tokens (fin_pat_...).
            ALL validation (signature, expiry, wallet permissions) is delegated
            exclusively to the Java backend — this server is a pure proxy.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Annotated, Literal

import httpx
import uvicorn
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession
from pydantic import Field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# ──────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────
# BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")


# ──────────────────────────────────────────────────────────────────────
# OAuth — Bearer token extracted from HTTP Authorization header
# ──────────────────────────────────────────────────────────────────────
_oauth_token: ContextVar[str | None] = ContextVar('oauth_token', default=None)


# ──────────────────────────────────────────────────────────────────────
# Lifespan — shared httpx.AsyncClient with connection pooling
# ──────────────────────────────────────────────────────────────────────
@dataclass
class AppContext:
    """Typed lifespan context holding shared resources."""
    http: httpx.AsyncClient


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    """Create and teardown the shared HTTP client."""
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=30.0) as client:
        yield AppContext(http=client)


# ──────────────────────────────────────────────────────────────────────
# FastMCP Server
# ──────────────────────────────────────────────────────────────────────
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:8000")
AUTH_SERVER_URL = os.getenv("AUTH_SERVER_URL", BACKEND_URL)

mcp = FastMCP(
    "FinanceWebApp",
    instructions=(
        "You are connected to a personal finance management application. "
        "Use the available tools to help the user manage their wallets and transactions. "
        "Authentication is handled automatically via the Bearer token in the request header — "
        "do NOT ask the user for a token or pass it as a parameter. "
        "The token controls which wallets are accessible and whether write operations are allowed: "
        "if the backend returns 403, the token lacks permission for that operation."
    ),
    lifespan=app_lifespan,
    host="0.0.0.0",
    port=8000,
)


# ──────────────────────────────────────────────────────────────────────
# OAuth — well-known endpoint (MCP spec requirement)
# Tells the MCP client where to find the authorization server.
# ──────────────────────────────────────────────────────────────────────
@mcp.custom_route("/.well-known/oauth-protected-resource", methods=["GET"])
async def protected_resource_metadata(request: Request) -> JSONResponse:
    return JSONResponse({
        "resource": MCP_SERVER_URL,
        "authorization_servers": [AUTH_SERVER_URL],
    })


# ──────────────────────────────────────────────────────────────────────
# OAuth — middleware
# Intercepts every HTTP request before it reaches the tools.
# Reads the Bearer token from the Authorization header and stores it
# in a ContextVar so _backend_request can forward it to the Java backend.
# ──────────────────────────────────────────────────────────────────────
class BearerTokenMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Well-known endpoints must be public — no token required
        if request.url.path.startswith("/.well-known"):
            return await call_next(request)

        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            _oauth_token.set(auth[len("Bearer "):].strip())
            return await call_next(request)

        # No token → 401 with pointer to the OAuth resource metadata
        return Response(
            status_code=401,
            headers={
                "WWW-Authenticate": (
                    f'Bearer resource_metadata="{MCP_SERVER_URL}/.well-known/oauth-protected-resource"'
                )
            }
        )


# ──────────────────────────────────────────────────────────────────────
# Helper — authenticated request to the Java backend
# ──────────────────────────────────────────────────────────────────────
async def _backend_request(
        ctx: Context[ServerSession, AppContext],
        *,
        method: str,
        path: str,
        body: dict | None = None,
) -> dict | list:
    """
    Make an authenticated HTTP request to the Spring Boot backend.
    The Bearer token is read from the HTTP Authorization header (set by middleware).
    ALL auth and permission checks are performed by the Java backend.

    Raises a descriptive RuntimeError on failure so the LLM can
    understand what went wrong and inform the user.
    """
    token = _oauth_token.get()
    if not token:
        raise RuntimeError(
            "No authentication token provided. "
            "Connect via OAuth or pass a Bearer token in the Authorization header."
        )

    http = ctx.request_context.lifespan_context.http
    headers = {"Authorization": f"Bearer {token}"}

    await ctx.info(f"→ {method} {BACKEND_URL}{path}")

    try:
        response = await http.request(
            method=method,
            url=path,
            headers=headers,
            json=body,
        )
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Network error while contacting the backend at {BACKEND_URL}{path}: {exc}"
        ) from exc

    if response.status_code == 401:
        raise RuntimeError(
            "Authentication failed (401). The token is invalid or expired. "
            "Ask the user to generate a new token from the app's API Tokens section."
        )
    if response.status_code == 403:
        raise RuntimeError(
            "Access denied (403). This token does not have permission for this operation. "
            "The token may not have access to the requested wallet, or may be missing WRITE permission. "
            "Ask the user to check the token's permissions in the API Tokens section."
        )
    if response.status_code >= 400:
        detail = response.text[:500]
        raise RuntimeError(
            f"Backend returned HTTP {response.status_code} for {method} {path}: {detail}"
        )

    # Some endpoints return 204 No Content
    if response.status_code == 204:
        return {"status": "success", "message": "Operation completed successfully."}

    return response.json()


# ──────────────────────────────────────────────────────────────────────
# Resource — wallets description
# ──────────────────────────────────────────────────────────────────────
@mcp.resource("finance://wallets")
def get_wallets_description() -> str:
    """Static description of the wallets resource."""
    return (
        "This resource represents the user's wallets. "
        "Use the 'get_wallets' tool to retrieve the actual wallet data."
    )


# ──────────────────────────────────────────────────────────────────────
# Tool — get_wallets
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_wallets(
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve the wallets accessible with the current token.
    The backend automatically filters to only the wallets the token has READ access to.
    """
    raw_wallets = await _backend_request(
        ctx,
        method="GET",
        path="/api/wallets",
    )

    # Ensure the response is a list before filtering
    if isinstance(raw_wallets, list):
        # 2. Define EXACTLY which fields you want to pass to the LLM
        allowed_keys = {"id", "name", "currency"}

        # 3. Filter the list keeping only the allowed keys
        optimized_wallets = [
            {key: wallet[key] for key in allowed_keys if key in wallet}
            for wallet in raw_wallets
        ]
    else:
        # Fallback in case the API returns an error or an unexpected format
        optimized_wallets = raw_wallets

    # 4. Return the "slimmed down" version to the LLM
    return json.dumps(optimized_wallets, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_transactions
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_transactions(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet (use get_wallets to find IDs).")],
        ctx: Context[ServerSession, AppContext],
        date_from: Annotated[str | None, Field(description="Optional start date filter in YYYY-MM-DD format.")] = None,
        date_until: Annotated[str | None, Field(description="Optional end date filter in YYYY-MM-DD format.")] = None,
        tags: Annotated[list[str] | None, Field(description="Optional list of tag names to filter by (case-insensitive).")] = None,
) -> str:
    """Retrieve and optionally filter transactions for a specific wallet. Requires READ permission."""
    raw_transactions = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/transactions/{wallet_id}",
    )

    if isinstance(raw_transactions, list):
        allowed_keys = {
            "id", "name", "tag", "amount", "originalAmount",
            "originalCurrency", "exchangeValue", "type", "notes", "transactionDate"
        }

        # Pre-process tags for case-insensitive filtering
        filter_tags = {t.lower() for t in tags} if tags else None

        optimized_transactions = []
        for transaction in raw_transactions:
            # --- FILTERING LOGIC ---
            tx_date = transaction.get("transactionDate")

            # Filter by date_from (string comparison works safely for YYYY-MM-DD)
            if date_from and tx_date and tx_date < date_from:
                continue

            # Filter by date_until
            if date_until and tx_date and tx_date > date_until:
                continue

            # Filter by tags (case-insensitive)
            tx_tag_dict = transaction.get("tag", {})
            tx_tag_name = tx_tag_dict.get("name") if isinstance(tx_tag_dict, dict) else None

            if filter_tags is not None:
                if not tx_tag_name or tx_tag_name.lower() not in filter_tags:
                    continue

            # --- OPTIMIZATION LOGIC ---
            # 1. Filter only the allowed keys
            opt_tx = {key: transaction[key] for key in allowed_keys if key in transaction}

            # 2. Flatten the nested 'tag' object
            if "tag" in opt_tx:
                opt_tx["tag"] = tx_tag_name  # We already extracted the name above

            optimized_transactions.append(opt_tx)

    else:
        # Fallback in case the API returns an error or unexpected format
        optimized_transactions = raw_transactions

    # Return the "slimmed down" version to the LLM
    return json.dumps(optimized_transactions, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_wallet_statistics
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_wallet_statistics(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet (use get_wallets to find IDs).")],
        ctx: Context[ServerSession, AppContext],
        date_from: Annotated[str | None, Field(description="Optional start date filter in YYYY-MM-DD format.")] = None,
        date_until: Annotated[str | None, Field(description="Optional end date filter in YYYY-MM-DD format.")] = None,
) -> str:
    """
    Calculate total income, expenses, and net for a period.
    Aggregates data by parent categories and sub-tags with their respective percentages.
    """
    raw_transactions = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/transactions/{wallet_id}",
    )

    if not isinstance(raw_transactions, list):
        return json.dumps({"error": "Failed to retrieve transactions"}, indent=2)

    # 1. Filter by date
    filtered_txs = []
    for tx in raw_transactions:
        tx_date = tx.get("transactionDate")
        if date_from and tx_date and tx_date < date_from:
            continue
        if date_until and tx_date and tx_date > date_until:
            continue
        filtered_txs.append(tx)

    # 2. Aggregation Helper Function
    def aggregate_by_type(tx_type: str):
        total = 0.0
        # Structure: { "ParentName": { "amount": 0.0, "sub_tags": { "SubName": 0.0 } } }
        parents = {}

        for tx in filtered_txs:
            if tx.get("type") == tx_type:
                amt = float(tx.get("amount", 0.0))
                total += amt

                tag_info = tx.get("tag")
                if not isinstance(tag_info, dict):
                    continue

                # Fallback: if parentName is missing/null, use the tag name itself as parent
                sub_name = tag_info.get("name", "Uncategorized")
                parent_name = tag_info.get("parentName") or sub_name

                if parent_name not in parents:
                    parents[parent_name] = {"amount": 0.0, "sub_tags": {}}

                parents[parent_name]["amount"] += amt

                if sub_name not in parents[parent_name]["sub_tags"]:
                    parents[parent_name]["sub_tags"][sub_name] = 0.0
                parents[parent_name]["sub_tags"][sub_name] += amt

        # 3. Build the final sorted list with percentages
        category_list = []
        for p_name, p_data in parents.items():
            p_amt = p_data["amount"]
            sub_list = []

            for s_name, s_amt in p_data["sub_tags"].items():
                sub_list.append({
                    "name": s_name,
                    "amount": round(s_amt, 2),
                    "percentageOfTotal": round((s_amt / total * 100), 2) if total > 0 else 0.0,
                    "percentageOfParent": round((s_amt / p_amt * 100), 2) if p_amt > 0 else 0.0
                })

            # Sort sub-tags descending by amount
            sub_list.sort(key=lambda x: x["amount"], reverse=True)

            category_list.append({
                "parentName": p_name,
                "amount": round(p_amt, 2),
                "percentageOfTotal": round((p_amt / total * 100), 2) if total > 0 else 0.0,
                "subTags": sub_list
            })

        # Sort parent categories descending by amount
        category_list.sort(key=lambda x: x["amount"], reverse=True)
        return round(total, 2), category_list

    # Execute aggregation for both incomes and expenses
    total_income, income_categories = aggregate_by_type("INCOME")
    total_expense, expense_categories = aggregate_by_type("EXPENSE")

    # 4. Final JSON Structure
    result = {
        "summary": {
            "totalIncome": total_income,
            "totalExpense": total_expense,
            "difference": round(total_income - total_expense, 2)
        },
        "incomeByCategory": income_categories,
        "expenseByCategory": expense_categories
    }

    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — add_transaction
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def add_transaction(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet (use get_wallets to find IDs).")],
        name: Annotated[str, Field(description="Transaction description, e.g. 'Grocery shopping' (3-40 characters).")],
        amount: Annotated[float, Field(description="Transaction amount as a decimal number, e.g. 42.50.", gt=0)],
        type: Annotated[Literal["INCOME", "EXPENSE"], Field(description="Transaction type.")],
        tag: Annotated[str, Field(description="Category tag name (use get_tags to find available tags).")],
        ctx: Context[ServerSession, AppContext],
        notes: Annotated[str, Field(description="Optional notes for the transaction.")] = "",
        transaction_date: Annotated[str, Field(description="Date in YYYY-MM-DD format. Defaults to today.")] = "",
) -> str:
    """Create a new transaction in the specified wallet. Requires WRITE permission."""
    body: dict = {
        "name": name,
        "amount": amount,
        "type": type,
        "tag": tag,
        "originalAmount": amount,
        "exchangeValue": 1,
        "originalCurrency": "EUR",
        "notes": notes,
        "transactionDate": transaction_date,
    }

    result = await _backend_request(
        ctx,
        method="POST",
        path=f"/api/transactions/{wallet_id}",
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — update_transaction
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def update_transaction(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet.")],
        transaction_id: Annotated[str, Field(description="UUID of the transaction to update (use get_transactions to find IDs).")],
        name: Annotated[str, Field(description="Updated description (3-40 characters).")],
        amount: Annotated[float, Field(description="Updated amount as a decimal number.", gt=0)],
        type: Annotated[Literal["INCOME", "EXPENSE"], Field(description="Transaction type.")],
        ctx: Context[ServerSession, AppContext],
        tag: Annotated[str | None, Field(description="Tag name. Empty string to remove, null to keep unchanged.")] = None,
        notes: Annotated[str, Field(description="Optional notes for the transaction.")] = "",
        transaction_date: Annotated[str | None, Field(description="Date in YYYY-MM-DD format. Null keeps the existing date.")] = None,
        original_amount: Annotated[float | None, Field(description="Original amount for foreign currency conversions.")] = None,
        original_currency: Annotated[str, Field(description="Currency code of the original amount.")] = "EUR",
        exchange_value: Annotated[float, Field(description="Exchange rate applied.", gt=0)] = 1.0,
) -> str:
    """Update an existing transaction in the specified wallet. Requires WRITE permission."""
    body: dict = {
        "name": name,
        "amount": amount,
        "type": type,
        "tag": tag,
        "originalAmount": original_amount if original_amount is not None else amount,
        "originalCurrency": original_currency,
        "exchangeValue": exchange_value,
        "notes": notes,
        "transactionDate": transaction_date,
    }

    result = await _backend_request(
        ctx,
        method="PUT",
        path=f"/api/transactions/{wallet_id}/{transaction_id}",
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_tags
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_tags(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet (use get_wallets to find IDs).")],
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve all tags (categories) for a specific wallet.
    Call this before creating transactions or subscriptions to discover available tags.
    """
    raw_tags = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/tags/{wallet_id}",
    )

    if isinstance(raw_tags, list):
        allowed_keys = {"name", "icon", "colorHex", "parentName"}
        optimized_tags = [
            {key: tag[key] for key in allowed_keys if key in tag}
            for tag in raw_tags
        ]
    else:
        optimized_tags = raw_tags

    return json.dumps(optimized_tags, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — create_tag
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def create_tag(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet.")],
        name: Annotated[str, Field(description="Tag name (2-25 characters, e.g. 'Groceries', 'Entertainment').")],
        ctx: Context[ServerSession, AppContext],
        icon: Annotated[str, Field(description="Optional icon identifier for the tag.")] = "",
        color_hex: Annotated[str, Field(description="Optional hex color for the tag, e.g. '#FF5733'.")] = "",
        parent_name: Annotated[str | None, Field(description="Optional parent tag name for hierarchical categorization.")] = None,
) -> str:
    """
    Create a new tag (category) in the specified wallet. Requires WRITE permission.
    Tags can be hierarchical: set parent_name to nest under an existing tag.
    """
    body: dict = {
        "name": name,
        "icon": icon,
        "colorHex": color_hex,
    }
    if parent_name:
        body["parentName"] = parent_name

    result = await _backend_request(
        ctx,
        method="POST",
        path=f"/api/tags/{wallet_id}",
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_subscriptions
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_subscriptions(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet (use get_wallets to find IDs).")],
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve all subscriptions (recurring transactions) for a specific wallet.
    Subscriptions represent automated recurring charges like rent, Netflix, salary, etc.
    """
    raw_subs = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/subscription/{wallet_id}",
    )

    if isinstance(raw_subs, list):
        allowed_keys = {
            "id", "name", "amount", "originalAmount", "originalCurrency",
            "exchangeValue", "type", "notes", "status",
            "startDate", "nextExecutionDate", "lastExecutionDate",
            "frequencyType", "frequencyInterval",
            "monthlySpecificDay", "lastWorkingDayOfMonth",
            "duration", "durationTimes", "executedTimes", "durationUntil",
        }
        optimized_subs = []
        for sub in raw_subs:
            opt = {key: sub[key] for key in allowed_keys if key in sub}
            # Flatten tag to just the name
            tag_info = sub.get("tag")
            if isinstance(tag_info, dict):
                opt["tag"] = tag_info.get("name")
            else:
                opt["tag"] = tag_info
            optimized_subs.append(opt)
    else:
        optimized_subs = raw_subs

    return json.dumps(optimized_subs, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — create_subscription
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def create_subscription(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet.")],
        name: Annotated[str, Field(description="Subscription description (3-40 characters, e.g. 'Netflix', 'Rent').")],
        amount: Annotated[float, Field(description="Amount in the wallet's currency.", gt=0)],
        type: Annotated[Literal["INCOME", "EXPENSE"], Field(description="Transaction type.")],
        frequency_type: Annotated[Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], Field(description="Recurrence frequency.")],
        ctx: Context[ServerSession, AppContext],
        tag: Annotated[str, Field(description="Optional category tag name (use get_tags to find available tags).")] = "",
        notes: Annotated[str, Field(description="Optional notes.")] = "",
        original_amount: Annotated[float | None, Field(description="Original amount for foreign currency conversions.")] = None,
        original_currency: Annotated[str, Field(description="Currency code of the original amount.")] = "EUR",
        exchange_value: Annotated[float, Field(description="Exchange rate applied.", gt=0)] = 1.0,
        auto_exchange_rate: Annotated[bool, Field(description="Whether to auto-fetch exchange rates.")] = False,
        status: Annotated[Literal["ACTIVE", "PAUSED"], Field(description="Initial status.")] = "ACTIVE",
        start_date: Annotated[str, Field(description="Start date in YYYY-MM-DD format. Defaults to today.")] = "",
        frequency_interval: Annotated[int, Field(description="How many frequency units between each execution.", ge=1)] = 1,
        monthly_specific_day: Annotated[int | None, Field(description="Day of month (1-31) for monthly subscriptions.", ge=1, le=31)] = None,
        last_working_day_of_month: Annotated[bool, Field(description="If true, execute on the last working day of each month.")] = False,
        duration: Annotated[Literal["FOREVER", "TIMES", "UNTIL"], Field(description="Duration rule.")] = "FOREVER",
        duration_times: Annotated[int | None, Field(description="Number of times to execute. Required when duration is 'TIMES'.")] = None,
        duration_until: Annotated[str | None, Field(description="End date in YYYY-MM-DD. Required when duration is 'UNTIL'.")] = None,
) -> str:
    """Create a new recurring subscription in the specified wallet. Requires WRITE permission."""
    body: dict = {
        "name": name,
        "amount": amount,
        "originalAmount": original_amount if original_amount is not None else amount,
        "originalCurrency": original_currency,
        "exchangeValue": exchange_value,
        "autoExchangeRate": auto_exchange_rate,
        "type": type,
        "tag": tag,
        "notes": notes,
        "status": status,
        "startDate": start_date if start_date else None,
        "frequencyType": frequency_type,
        "frequencyInterval": frequency_interval,
        "monthlySpecificDay": monthly_specific_day,
        "lastWorkingDayOfMonth": last_working_day_of_month,
        "duration": duration,
        "durationTimes": duration_times,
        "durationUntil": duration_until,
    }

    result = await _backend_request(
        ctx,
        method="POST",
        path=f"/api/subscription/{wallet_id}",
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — update_subscription
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def update_subscription(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet.")],
        subscription_id: Annotated[str, Field(description="UUID of the subscription to update (use get_subscriptions to find IDs).")],
        ctx: Context[ServerSession, AppContext],
        name: Annotated[str | None, Field(description="New name (3-40 characters).")] = None,
        amount: Annotated[float | None, Field(description="New amount.", gt=0)] = None,
        type: Annotated[Literal["INCOME", "EXPENSE"] | None, Field(description="New transaction type.")] = None,
        tag: Annotated[str | None, Field(description="New tag name. Empty string to remove tag, null to keep unchanged.")] = None,
        notes: Annotated[str | None, Field(description="New notes.")] = None,
        original_amount: Annotated[float | None, Field(description="New original amount (foreign currency).")] = None,
        original_currency: Annotated[str | None, Field(description="New currency code.")] = None,
        exchange_value: Annotated[float | None, Field(description="New exchange rate.", gt=0)] = None,
        auto_exchange_rate: Annotated[bool, Field(description="Whether to auto-fetch exchange rates.")] = False,
        status: Annotated[Literal["ACTIVE", "PAUSED", "COMPLETED"] | None, Field(description="New status.")] = None,
        start_date: Annotated[str | None, Field(description="New start date in YYYY-MM-DD format.")] = None,
        frequency_type: Annotated[Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] | None, Field(description="New recurrence frequency.")] = None,
        frequency_interval: Annotated[int, Field(description="New interval between executions. 0 means unchanged.", ge=0)] = 0,
        monthly_specific_day: Annotated[int | None, Field(description="Day of month for monthly subscriptions.", ge=1, le=31)] = None,
        last_working_day_of_month: Annotated[bool, Field(description="Whether to use last working day of month.")] = False,
        duration: Annotated[Literal["FOREVER", "TIMES", "UNTIL"] | None, Field(description="New duration rule.")] = None,
        duration_times: Annotated[int | None, Field(description="Number of times to execute. Required when duration is 'TIMES'.")] = None,
        duration_until: Annotated[str | None, Field(description="End date in YYYY-MM-DD. Required when duration is 'UNTIL'.")] = None,
) -> str:
    """Update an existing subscription. Only provided fields are changed. Requires WRITE permission."""
    body: dict = {
        "name": name,
        "amount": amount,
        "originalAmount": original_amount,
        "originalCurrency": original_currency,
        "exchangeValue": exchange_value,
        "autoExchangeRate": auto_exchange_rate,
        "type": type,
        "tag": tag,
        "notes": notes,
        "status": status,
        "startDate": start_date,
        "frequencyType": frequency_type,
        "frequencyInterval": frequency_interval,
        "monthlySpecificDay": monthly_specific_day,
        "lastWorkingDayOfMonth": last_working_day_of_month,
        "duration": duration,
        "durationTimes": duration_times,
        "durationUntil": duration_until,
    }

    result = await _backend_request(
        ctx,
        method="PUT",
        path=f"/api/subscription/{wallet_id}/{subscription_id}",
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — delete_subscription
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def delete_subscription(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet.")],
        subscription_id: Annotated[str, Field(description="UUID of the subscription to delete (use get_subscriptions to find IDs).")],
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Delete a subscription from the specified wallet. Requires WRITE permission.
    This does NOT delete past transactions already generated by this subscription.
    """
    result = await _backend_request(
        ctx,
        method="DELETE",
        path=f"/api/subscription/{wallet_id}/{subscription_id}",
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_financial_timeseries
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_financial_timeseries(
        wallet_id: Annotated[str, Field(description="UUID of the target wallet.")],
        ctx: Context[ServerSession, AppContext],
        date_from: Annotated[str | None, Field(description="Start date in YYYY-MM-DD format. Defaults to 12 months ago.")] = None,
        date_until: Annotated[str | None, Field(description="End date in YYYY-MM-DD format. Defaults to today.")] = None,
        granularity: Annotated[Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], Field(description="Aggregation granularity.")] = "MONTHLY",
        include_subscriptions: Annotated[bool, Field(description="If true, includes active subscriptions for future recurring projections.")] = True,
) -> str:
    """
    Generate a time-series dataset of income, expenses, and balance over time.
    Designed for trend analysis and forecasting future financial patterns.
    Includes running totals, cumulative balance, and optionally projected recurring costs.
    """
    from collections import defaultdict
    from datetime import date, timedelta

    # -- Fetch transactions --
    raw_transactions = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/transactions/{wallet_id}",
    )

    if not isinstance(raw_transactions, list):
        return json.dumps({"error": "Failed to retrieve transactions"}, indent=2)

    # -- Parse date boundaries --
    today = date.today()
    if date_from:
        start = date.fromisoformat(date_from)
    else:
        # Default: 12 months ago
        start = today.replace(year=today.year - 1)
    if date_until:
        end = date.fromisoformat(date_until)
    else:
        end = today

    # -- Bucket key function based on granularity --
    def bucket_key(d: date) -> str:
        if granularity == "DAILY":
            return d.isoformat()
        elif granularity == "WEEKLY":
            # ISO week: YYYY-Www
            iso_year, iso_week, _ = d.isocalendar()
            return f"{iso_year}-W{iso_week:02d}"
        elif granularity == "YEARLY":
            return str(d.year)
        else:  # MONTHLY (default)
            return d.strftime("%Y-%m")

    # -- Aggregate transactions into time buckets --
    buckets: dict[str, dict] = defaultdict(lambda: {
        "income": 0.0,
        "expense": 0.0,
        "transaction_count": 0,
        "tags": defaultdict(float),
    })

    for tx in raw_transactions:
        tx_date_str = tx.get("transactionDate")
        if not tx_date_str:
            continue
        tx_date = date.fromisoformat(tx_date_str)
        if tx_date < start or tx_date > end:
            continue

        key = bucket_key(tx_date)
        amount = float(tx.get("amount", 0.0))
        tx_type = tx.get("type", "")

        if tx_type == "INCOME":
            buckets[key]["income"] += amount
        elif tx_type == "EXPENSE":
            buckets[key]["expense"] += amount

        buckets[key]["transaction_count"] += 1

        # Track per-tag spending
        tag_info = tx.get("tag")
        tag_name = tag_info.get("name", "Uncategorized") if isinstance(tag_info, dict) else "Uncategorized"
        buckets[key]["tags"][tag_name] += amount

    # -- Build sorted time-series --
    sorted_keys = sorted(buckets.keys())
    cumulative_balance = 0.0
    timeseries = []

    for key in sorted_keys:
        b = buckets[key]
        net = round(b["income"] - b["expense"], 2)
        cumulative_balance += net

        # Top tags for this period
        top_tags = sorted(b["tags"].items(), key=lambda x: x[1], reverse=True)[:5]

        timeseries.append({
            "period": key,
            "income": round(b["income"], 2),
            "expense": round(b["expense"], 2),
            "net": net,
            "cumulativeBalance": round(cumulative_balance, 2),
            "transactionCount": b["transaction_count"],
            "topTags": [{"name": t[0], "amount": round(t[1], 2)} for t in top_tags],
        })

    # -- Optionally fetch subscriptions for projections --
    subscription_summary = None
    if include_subscriptions:
        raw_subs = await _backend_request(
            ctx,
            method="GET",
            path=f"/api/subscription/{wallet_id}",
        )

        if isinstance(raw_subs, list):
            active_subs = [s for s in raw_subs if s.get("status") == "ACTIVE"]
            monthly_recurring_income = 0.0
            monthly_recurring_expense = 0.0

            for sub in active_subs:
                amt = float(sub.get("amount", 0))
                freq = sub.get("frequencyType", "MONTHLY")
                interval = sub.get("frequencyInterval", 1)

                # Normalize to monthly equivalent
                if freq == "DAILY":
                    monthly_amt = amt * (30 / interval)
                elif freq == "WEEKLY":
                    monthly_amt = amt * (4.33 / interval)
                elif freq == "MONTHLY":
                    monthly_amt = amt / interval
                elif freq == "YEARLY":
                    monthly_amt = amt / (12 * interval)
                else:
                    monthly_amt = amt

                if sub.get("type") == "INCOME":
                    monthly_recurring_income += monthly_amt
                else:
                    monthly_recurring_expense += monthly_amt

            subscription_summary = {
                "activeSubscriptionCount": len(active_subs),
                "estimatedMonthlyRecurringIncome": round(monthly_recurring_income, 2),
                "estimatedMonthlyRecurringExpense": round(monthly_recurring_expense, 2),
                "estimatedMonthlyRecurringNet": round(monthly_recurring_income - monthly_recurring_expense, 2),
                "subscriptions": [
                    {
                        "name": s.get("name"),
                        "amount": s.get("amount"),
                        "type": s.get("type"),
                        "frequencyType": s.get("frequencyType"),
                        "frequencyInterval": s.get("frequencyInterval"),
                        "nextExecutionDate": s.get("nextExecutionDate"),
                    }
                    for s in active_subs
                ],
            }

    # -- Compute summary statistics --
    total_income = sum(p["income"] for p in timeseries)
    total_expense = sum(p["expense"] for p in timeseries)
    period_count = len(timeseries)

    result = {
        "metadata": {
            "walletId": wallet_id,
            "dateFrom": str(start),
            "dateUntil": str(end),
            "granularity": granularity,
            "periodsCount": period_count,
        },
        "summary": {
            "totalIncome": round(total_income, 2),
            "totalExpense": round(total_expense, 2),
            "totalNet": round(total_income - total_expense, 2),
            "avgIncomePerPeriod": round(total_income / period_count, 2) if period_count > 0 else 0,
            "avgExpensePerPeriod": round(total_expense / period_count, 2) if period_count > 0 else 0,
            "avgNetPerPeriod": round((total_income - total_expense) / period_count, 2) if period_count > 0 else 0,
        },
        "timeseries": timeseries,
    }

    if subscription_summary:
        result["recurringProjection"] = subscription_summary

    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Entrypoint
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = mcp.streamable_http_app()
    app.add_middleware(BearerTokenMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)