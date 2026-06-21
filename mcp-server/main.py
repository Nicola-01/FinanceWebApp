"""
FinanceWebApp MCP Server
========================
A Model Context Protocol server that bridges LLM clients (Claude, Cursor, etc.)
to the FinanceWebApp Spring Boot backend.

Transport : Streamable HTTP (stateless, JSON responses)
Endpoint  : http://localhost:8000/mcp
Auth      : Personal Access Token (fin_pat_...) forwarded as-is to the Java backend.
            ALL validation (signature, expiry, wallet permissions) is delegated
            exclusively to the Java backend — this server is a pure proxy.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

import httpx
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession

# ──────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────
# BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
BACKEND_URL = os.getenv("BACKEND_URL", "https://finance-api.busato.dev")


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
mcp = FastMCP(
    "FinanceWebApp",
    instructions=(
        "You are connected to a personal finance management application. "
        "Use the available tools to help the user manage their wallets and transactions. "
        "Every call requires a valid Personal Access Token (starts with 'fin_pat_') — "
        "ask the user for it if you don't have one. "
        "The token controls which wallets you can access and whether you can write: "
        "if the backend returns 403, the token doesn't have permission for that operation."
    ),
    lifespan=app_lifespan,
    host="0.0.0.0",
    port=8000,
)


# ──────────────────────────────────────────────────────────────────────
# Helper — authenticated request to the Java backend
# ──────────────────────────────────────────────────────────────────────
async def _backend_request(
        ctx: Context[ServerSession, AppContext],
        *,
        method: str,
        path: str,
        token: str,
        body: dict | None = None,
) -> dict | list:
    """
    Make an authenticated HTTP request to the Spring Boot backend.
    The token is forwarded as-is in the Authorization header.
    ALL auth and permission checks are performed by the Java backend.

    Raises a descriptive RuntimeError on failure so the LLM can
    understand what went wrong and inform the user.
    """
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
    """
    Static description of the wallets resource.
    To actually fetch wallets, use the get_wallets tool with a token.
    """
    return (
        "This resource represents the user's wallets. "
        "Use the 'get_wallets' tool to retrieve the actual wallet data "
        "(requires a Personal Access Token with READ permission)."
    )


# ──────────────────────────────────────────────────────────────────────
# Tool — get_wallets
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_wallets(
        token: str,
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve the wallets accessible with this token.
    The backend automatically filters to only the wallets the token has READ access to.

    Args:
        token: The user's Personal Access Token (starts with 'fin_pat_').
    """

    # 1. Call the backend (receives the full JSON with colors, icons, etc.)
    raw_wallets = await _backend_request(
        ctx,
        method="GET",
        path="/api/wallets",
        token=token,
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
        token: str,
        wallet_id: str,
        ctx: Context[ServerSession, AppContext],
        date_from: str | None = None,
        date_until: str | None = None,
        tags: list[str] | None = None,
) -> str:
    """
    Retrieve and optionally filter transactions for a specific wallet.
    Requires READ permission on the wallet.

    Args:
        token:      The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:  UUID of the target wallet (use get_wallets to find IDs).
        date_from:  Optional start date filter in YYYY-MM-DD format.
        date_until: Optional end date filter in YYYY-MM-DD format.
        tags:       Optional list of tag names to filter by (case-insensitive).
    """
    raw_transactions = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/transactions/{wallet_id}",
        token=token,
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
        token: str,
        wallet_id: str,
        ctx: Context[ServerSession, AppContext],
        date_from: str | None = None,
        date_until: str | None = None,
) -> str:
    """
    Calculates total income, expenses, and difference for a period.
    Aggregates data by parent categories and sub-tags with their respective percentages.

    Args:
        token:      The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:  UUID of the target wallet.
        date_from:  Optional start date filter (YYYY-MM-DD).
        date_until: Optional end date filter (YYYY-MM-DD).
    """
    raw_transactions = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/transactions/{wallet_id}",
        token=token,
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
        token: str,
        wallet_id: str,
        name: str,
        amount: float,
        type: str,
        tag: str,
        notes: str = "",
        transaction_date: str = "",
        ctx: Context[ServerSession, AppContext] = None,  # type: ignore[assignment]
) -> str:
    """
    Create a new transaction in the specified wallet.
    Requires WRITE permission on the wallet — the backend enforces this.

    Args:
        token:            The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:        UUID of the target wallet (use get_wallets to find IDs).
        name:             Transaction description (e.g. "Grocery shopping").
        amount:           Transaction amount as a decimal number (e.g. 42.50).
        type:             Transaction type: "INCOME" or "EXPENSE".
        tag:              Category tag (e.g. "Food", "Transport", "Salary").
        notes:            Optional notes for the transaction.
        transaction_date: Optional date in ISO format (YYYY-MM-DD). Defaults to today.
    """
    body: dict = {
        "name": name,
        "amount": amount,
        "type": type,
        "tag": tag,
        "originalAmount": amount,
        "exchangeValue": 1,
        "originalCurrency": "EUR",
        "notes": notes,
        "transactionDate": transaction_date
    }

    result = await _backend_request(
        ctx,
        method="POST",
        path=f"/api/transactions/{wallet_id}",
        token=token,
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — update_transaction
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def update_transaction(
        token: str,
        wallet_id: str,
        transaction_id: str,
        name: str,
        amount: float,
        type: str,
        ctx: Context[ServerSession, AppContext],
        tag: str | None = None,
        notes: str = "",
        transaction_date: str | None = None,
        original_amount: float | None = None,
        original_currency: str = "EUR",
        exchange_value: float = 1.0,
) -> str:
    """
    Update an existing transaction in the specified wallet.
    Requires WRITE permission on the wallet — the backend enforces this.

    Args:
        token:             The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:         UUID of the target wallet.
        transaction_id:    UUID of the transaction to update (use get_transactions to find IDs).
        name:              Updated description (3-40 characters).
        amount:            Updated amount as a decimal number.
        type:              Transaction type: "INCOME" or "EXPENSE".
        tag:               Optional category tag name (empty string to remove, null to keep unchanged).
        notes:             Optional notes for the transaction.
        transaction_date:  Optional date in ISO format (YYYY-MM-DD). Null keeps the existing date.
        original_amount:   Optional original amount (for foreign currency conversions).
        original_currency: Currency code of the original amount (default: "EUR").
        exchange_value:    Exchange rate applied (default: 1.0).
    """
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
        token=token,
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_tags
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_tags(
        token: str,
        wallet_id: str,
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve all tags (categories) for a specific wallet.
    Tags are used to categorize transactions and subscriptions.
    Use this to discover available tags before creating transactions or subscriptions.

    Args:
        token:     The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id: UUID of the target wallet (use get_wallets to find IDs).
    """
    raw_tags = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/tags/{wallet_id}",
        token=token,
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
        token: str,
        wallet_id: str,
        name: str,
        ctx: Context[ServerSession, AppContext],
        icon: str = "",
        color_hex: str = "",
        parent_name: str | None = None,
) -> str:
    """
    Create a new tag (category) in the specified wallet.
    Tags are used to categorize transactions. Requires WRITE permission.

    Tags can be hierarchical: set parent_name to nest under an existing tag.
    Name must be between 2 and 25 characters.

    Args:
        token:       The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:   UUID of the target wallet.
        name:        Tag name (2-25 characters, e.g. "Groceries", "Entertainment").
        icon:        Optional icon identifier for the tag.
        color_hex:   Optional hex color for the tag (e.g. "#FF5733").
        parent_name: Optional parent tag name for hierarchical categorization.
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
        token=token,
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_subscriptions
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_subscriptions(
        token: str,
        wallet_id: str,
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve all subscriptions (recurring transactions) for a specific wallet.
    Subscriptions represent automated recurring charges like rent, Netflix, salary, etc.

    Args:
        token:     The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id: UUID of the target wallet (use get_wallets to find IDs).
    """
    raw_subs = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/subscription/{wallet_id}",
        token=token,
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
        token: str,
        wallet_id: str,
        name: str,
        amount: float,
        type: str,
        frequency_type: str,
        ctx: Context[ServerSession, AppContext],
        tag: str = "",
        notes: str = "",
        original_amount: float | None = None,
        original_currency: str = "EUR",
        exchange_value: float = 1.0,
        auto_exchange_rate: bool = False,
        status: str = "ACTIVE",
        start_date: str = "",
        frequency_interval: int = 1,
        monthly_specific_day: int | None = None,
        last_working_day_of_month: bool = False,
        duration: str = "FOREVER",
        duration_times: int | None = None,
        duration_until: str | None = None,
) -> str:
    """
    Create a new subscription (recurring transaction) in the specified wallet.
    Requires WRITE permission on the wallet.

    Args:
        token:                     The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:                 UUID of the target wallet.
        name:                      Subscription description (3-40 chars, e.g. "Netflix", "Rent").
        amount:                    Amount in the wallet's currency.
        type:                      Transaction type: "INCOME" or "EXPENSE".
        frequency_type:            Recurrence type: "DAILY", "WEEKLY", "MONTHLY", or "YEARLY".
        tag:                       Optional category tag name (must exist in the wallet).
        notes:                     Optional notes.
        original_amount:           Optional original amount (for foreign currency).
        original_currency:         Currency code of the original amount (default: "EUR").
        exchange_value:            Exchange rate applied (default: 1.0).
        auto_exchange_rate:        Whether to auto-fetch exchange rates (default: false).
        status:                    Initial status: "ACTIVE", "PAUSED" (default: "ACTIVE").
        start_date:                Start date in YYYY-MM-DD format (default: today).
        frequency_interval:        How many frequency units between each execution (default: 1).
        monthly_specific_day:      Optional day of month (1-31) for monthly subscriptions.
        last_working_day_of_month: If true, execute on last working day of each month.
        duration:                  Duration rule: "FOREVER", "TIMES", or "UNTIL" (default: "FOREVER").
        duration_times:            Number of times to execute (required when duration is "TIMES").
        duration_until:            End date in YYYY-MM-DD (required when duration is "UNTIL").
    """
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
        token=token,
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — update_subscription
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def update_subscription(
        token: str,
        wallet_id: str,
        subscription_id: str,
        ctx: Context[ServerSession, AppContext],
        name: str | None = None,
        amount: float | None = None,
        type: str | None = None,
        tag: str | None = None,
        notes: str | None = None,
        original_amount: float | None = None,
        original_currency: str | None = None,
        exchange_value: float | None = None,
        auto_exchange_rate: bool = False,
        status: str | None = None,
        start_date: str | None = None,
        frequency_type: str | None = None,
        frequency_interval: int = 0,
        monthly_specific_day: int | None = None,
        last_working_day_of_month: bool = False,
        duration: str | None = None,
        duration_times: int | None = None,
        duration_until: str | None = None,
) -> str:
    """
    Update an existing subscription. Only provided fields are changed.
    Requires WRITE permission on the wallet.

    Args:
        token:                     The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:                 UUID of the target wallet.
        subscription_id:           UUID of the subscription to update (use get_subscriptions to find IDs).
        name:                      Optional new name (3-40 characters).
        amount:                    Optional new amount.
        type:                      Optional new type: "INCOME" or "EXPENSE".
        tag:                       Optional new tag name (empty string to remove tag).
        notes:                     Optional new notes.
        original_amount:           Optional original amount (foreign currency).
        original_currency:         Optional currency code.
        exchange_value:            Optional exchange rate.
        auto_exchange_rate:        Whether to auto-fetch exchange rates.
        status:                    Optional new status: "ACTIVE", "PAUSED", "COMPLETED".
        start_date:                Optional new start date (YYYY-MM-DD).
        frequency_type:            Optional new frequency: "DAILY", "WEEKLY", "MONTHLY", "YEARLY".
        frequency_interval:        Optional new interval (0 means unchanged).
        monthly_specific_day:      Optional day of month for monthly subscriptions.
        last_working_day_of_month: Whether to use last working day of month.
        duration:                  Optional duration rule: "FOREVER", "TIMES", "UNTIL".
        duration_times:            Optional number of times (for "TIMES" duration).
        duration_until:            Optional end date (for "UNTIL" duration).
    """
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
        token=token,
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — delete_subscription
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def delete_subscription(
        token: str,
        wallet_id: str,
        subscription_id: str,
        ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Delete a subscription from the specified wallet.
    Requires WRITE permission. This does NOT delete past transactions
    already generated by this subscription.

    Args:
        token:           The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:       UUID of the target wallet.
        subscription_id: UUID of the subscription to delete (use get_subscriptions to find IDs).
    """
    result = await _backend_request(
        ctx,
        method="DELETE",
        path=f"/api/subscription/{wallet_id}/{subscription_id}",
        token=token,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — get_financial_timeseries
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_financial_timeseries(
        token: str,
        wallet_id: str,
        ctx: Context[ServerSession, AppContext],
        date_from: str | None = None,
        date_until: str | None = None,
        granularity: str = "MONTHLY",
        include_subscriptions: bool = True,
) -> str:
    """
    Generate a time-series dataset of income, expenses, and balance over time.
    Designed for forecasting future trends and analysing past financial patterns.

    The data is grouped by the specified granularity (DAILY, WEEKLY, MONTHLY, YEARLY)
    and includes running totals, cumulative balance, and optionally projected
    future subscription costs.

    Args:
        token:                  The user's Personal Access Token (starts with 'fin_pat_').
        wallet_id:              UUID of the target wallet.
        date_from:              Optional start date (YYYY-MM-DD). Defaults to 12 months ago.
        date_until:             Optional end date (YYYY-MM-DD). Defaults to today.
        granularity:            Aggregation granularity: "DAILY", "WEEKLY", "MONTHLY", or "YEARLY" (default: "MONTHLY").
        include_subscriptions:  If true, includes active subscriptions data for future projections.
    """
    from collections import defaultdict
    from datetime import date, timedelta

    # -- Fetch transactions --
    raw_transactions = await _backend_request(
        ctx,
        method="GET",
        path=f"/api/transactions/{wallet_id}",
        token=token,
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
            token=token,
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
    # mcp.run("sse")
    mcp.run(transport="streamable-http")

# npx @modelcontextprotocol/inspector sse http://localhost:8000/sse

