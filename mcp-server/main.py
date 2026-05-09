"""
FinanceWebApp MCP Server
========================
A Model Context Protocol server that bridges LLM clients (Claude, Cursor, etc.)
to the FinanceWebApp Spring Boot backend.

Transport : Streamable HTTP (stateless, JSON responses)
Endpoint  : http://localhost:8000/mcp
Auth      : Custom JWT (Personal Access Token) forwarded as Bearer to the Java backend.
            The MCP server decodes the token to enforce scope restrictions locally.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

import httpx
import jwt
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
        "Use the available tools and resources to help the user manage their "
        "wallets and transactions. Every call requires a valid API token — "
        "ask the user for it if you don't have one."
    ),
    lifespan=app_lifespan,
    host="0.0.0.0",
    port=8000,
)


# ──────────────────────────────────────────────────────────────────────
# Control Layer — Token Scope Validation
# ──────────────────────────────────────────────────────────────────────
def _validate_token_and_scope(jwt_token: str, requested_wallet_id: str | None = None) -> dict:
    """
    Internal MCP server control layer.
    Decodes the token payload (without verifying the cryptographic signature,
    which is strictly delegated to the Java backend) to check scopes.

    Raises RuntimeError to guide the LLM if the operation is out of scope.
    """
    try:
        # Decode the payload without signature verification
        payload = jwt.decode(jwt_token, options={"verify_signature": False})

        # Check if the token has wallet restrictions (e.g., allowed_wallets: ["wallet-id-1"])
        allowed_wallets = payload.get("allowed_wallets")

        if requested_wallet_id and allowed_wallets is not None:
            if requested_wallet_id not in allowed_wallets:
                raise RuntimeError(
                    f"ACCESS DENIED: This token only authorizes access to wallets: {allowed_wallets}. "
                    f"Wallet '{requested_wallet_id}' is not permitted. Inform the user."
                )

        return payload

    except jwt.DecodeError:
        raise RuntimeError(
            "The provided token is not in a valid format. Ask the user for a correct token."
        )


# ──────────────────────────────────────────────────────────────────────
# Helper — authenticated request to the Java backend
# ──────────────────────────────────────────────────────────────────────
async def _backend_request(
    ctx: Context[ServerSession, AppContext],
    *,
    method: str,
    path: str,
    jwt_token: str,
    body: dict | None = None,
) -> dict | list:
    """
    Make an authenticated HTTP request to the Spring Boot backend.

    Raises a descriptive error message on failure so the LLM can
    understand what went wrong and inform the user.
    """
    http = ctx.request_context.lifespan_context.http
    headers = {"Authorization": f"Bearer {jwt_token}"}

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
            "Authentication failed (401). The token may be expired or invalid. "
            "Ask the user to provide a fresh token."
        )
    if response.status_code == 403:
        raise RuntimeError(
            "Access denied (403). The user does not have permission for this operation."
        )
    if response.status_code >= 400:
        detail = response.text[:500]
        raise RuntimeError(
            f"Backend returned HTTP {response.status_code} for {method} {path}: {detail}"
        )

    # Some endpoints return 204 No Content
    if response.status_code == 204:
        return {"status": "success", "message": "Operation completed (no content)."}

    return response.json()


# ──────────────────────────────────────────────────────────────────────
# Resource — get_wallets
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
        "(requires an API token)."
    )


@mcp.tool()
async def get_wallets(
    jwt_token: str,
    ctx: Context[ServerSession, AppContext],
) -> str:
    """
    Retrieve all wallets for the authenticated user based on their token.

    Returns a JSON list of wallets.

    Args:
        jwt_token: The user's Personal Access Token.
    """
    # Validate token structure before calling the backend
    payload = _validate_token_and_scope(jwt_token)
    allowed_wallets = payload.get("allowed_wallets")

    wallets = await _backend_request(
        ctx,
        method="GET",
        path="/api/wallets",
        jwt_token=jwt_token,
    )

    # Optional: Filter the returned wallets locally if the Java backend
    # doesn't enforce the 'allowed_wallets' scope on the GET endpoint itself.
    if isinstance(wallets, list) and allowed_wallets is not None:
        wallets = [w for w in wallets if w.get("id") in allowed_wallets]

    return json.dumps(wallets, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Tool — add_transaction
# ──────────────────────────────────────────────────────────────────────
@mcp.tool()
async def add_transaction(
    jwt_token: str,
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

    Args:
        jwt_token:        The user's Personal Access Token.
        wallet_id:        UUID of the target wallet (use get_wallets to find IDs).
        name:             Transaction description (e.g. "Grocery shopping").
        amount:           Transaction amount as a decimal number (e.g. 42.50).
        type:             Transaction type: "INCOME" or "EXPENSE".
        tag:              Category tag (e.g. "Food", "Transport", "Salary").
        notes:            Optional notes for the transaction.
        transaction_date: Optional date in ISO format (YYYY-MM-DD). Defaults to today.
    """
    # 1. MCP CONTROL LAYER: Verify the LLM is allowed to write to this wallet
    _validate_token_and_scope(jwt_token, requested_wallet_id=wallet_id)

    # 2. PREPARE REQUEST
    body: dict = {
        "name": name,
        "amount": amount,
        "type": type,
        "tag": tag,
    }
    if notes:
        body["notes"] = notes
    if transaction_date:
        body["transactionDate"] = transaction_date

    # 3. BACKEND EXECUTION (Java validates the actual cryptographic signature)
    result = await _backend_request(
        ctx,
        method="POST",
        path=f"/api/transactions/{wallet_id}",
        jwt_token=jwt_token,
        body=body,
    )
    return json.dumps(result, indent=2, default=str)


# ──────────────────────────────────────────────────────────────────────
# Entrypoint
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="sse")