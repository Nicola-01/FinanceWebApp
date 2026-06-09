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
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")


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
# Entrypoint
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run()

# npx @modelcontextprotocol/inspector sse http://localhost:8000/sse
