"""
FinanceWebApp — Test MCP Server
================================
Minimal MCP server with mock data to test the connection
between Claude.ai / Antigravity and the remote MCP endpoint.

Transport : Streamable HTTP (stateless — no SSE sessions)
Endpoint  : http://<host>:8000/mcp
"""

from __future__ import annotations

import json
from mcp.server.fastmcp import FastMCP

# ──────────────────────────────────────────────────────────────────────
# FastMCP Server — stateless mode to avoid SSE stream timeouts
# ──────────────────────────────────────────────────────────────────────
mcp = FastMCP(
    "FinanceWebApp-Test",
    instructions=(
        "This is a TEST server for the FinanceWebApp. "
        "All data returned is mock/fake data for testing purposes. "
        "Use these tools to verify the MCP connection is working."
    ),
    host="0.0.0.0",
    port=8000,
    # Stateless mode: each request gets an immediate JSON response,
    # no long-lived SSE streams that can cause client timeouts.
    stateless_http=True,
)

# ──────────────────────────────────────────────────────────────────────
# Mock data
# ──────────────────────────────────────────────────────────────────────
MOCK_WALLETS = [
    {"id": "aaaa-1111-bbbb-2222", "name": "Main Wallet", "currency": "EUR"},
    {"id": "cccc-3333-dddd-4444", "name": "Savings", "currency": "EUR"},
]

MOCK_TRANSACTIONS = [
    {"id": "tx-001", "name": "Grocery Store", "amount": 45.90, "type": "EXPENSE", "tag": "Food", "transactionDate": "2025-06-08"},
    {"id": "tx-002", "name": "Monthly Salary", "amount": 2800.00, "type": "INCOME", "tag": "Salary", "transactionDate": "2025-06-01"},
    {"id": "tx-003", "name": "Netflix", "amount": 15.99, "type": "EXPENSE", "tag": "Entertainment", "transactionDate": "2025-06-05"},
]

MOCK_TAGS = [
    {"name": "Food", "icon": "🍕", "colorHex": "#FF6B35", "parentName": None},
    {"name": "Salary", "icon": "💰", "colorHex": "#2ECC71", "parentName": None},
    {"name": "Entertainment", "icon": "🎬", "colorHex": "#9B59B6", "parentName": None},
    {"name": "Transport", "icon": "🚗", "colorHex": "#3498DB", "parentName": None},
]


# ──────────────────────────────────────────────────────────────────────
# Tools
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def get_wallets(token: str) -> str:
    """
    [TEST] Retrieve mock wallets. Returns fake data.

    Args:
        token: Any string (not validated in test mode).
    """
    return json.dumps(MOCK_WALLETS, indent=2)


@mcp.tool()
async def get_transactions(token: str, wallet_id: str) -> str:
    """
    [TEST] Retrieve mock transactions for a wallet. Returns fake data.

    Args:
        token:     Any string (not validated in test mode).
        wallet_id: Any wallet ID (ignored, always returns mock data).
    """
    return json.dumps(MOCK_TRANSACTIONS, indent=2)


@mcp.tool()
async def get_tags(token: str, wallet_id: str) -> str:
    """
    [TEST] Retrieve mock tags. Returns fake data.

    Args:
        token:     Any string (not validated in test mode).
        wallet_id: Any wallet ID (ignored).
    """
    return json.dumps(MOCK_TAGS, indent=2)


@mcp.tool()
async def add_transaction(
    token: str,
    wallet_id: str,
    name: str,
    amount: float,
    type: str,
    tag: str,
) -> str:
    """
    [TEST] Simulate adding a transaction. Returns the input echoed back.

    Args:
        token:     Any string (not validated in test mode).
        wallet_id: Target wallet UUID.
        name:      Transaction description.
        amount:    Transaction amount.
        type:      "INCOME" or "EXPENSE".
        tag:       Category tag name.
    """
    return json.dumps({
        "status": "success (mock)",
        "created": {
            "id": "tx-mock-new",
            "name": name,
            "amount": amount,
            "type": type,
            "tag": tag,
            "walletId": wallet_id,
        }
    }, indent=2)


# ──────────────────────────────────────────────────────────────────────
# Entrypoint
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 Starting FinanceWebApp Test MCP Server on http://0.0.0.0:8000/mcp")
    print("   Mode: stateless (no SSE sessions)")
    mcp.run(transport="streamable-http")
