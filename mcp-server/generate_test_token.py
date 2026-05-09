import jwt

payload = {
    "sub": "user123",
    "allowed_wallets": ["wallet-1", "wallet-2"] # Ipotetici ID del tuo DB
}
# Creiamo il token fittizio
token = jwt.encode(payload, "secret", algorithm="HS256")
print(f"IL TUO TOKEN DI TEST:\n{token}")