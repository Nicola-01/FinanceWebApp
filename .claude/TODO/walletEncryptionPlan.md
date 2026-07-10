# Wallet End-to-End Encryption — Architecture Plan

Status: **PLAN** (no code changed). Companion checklist: [`walletEncryptionTODO.md`](walletEncryptionTODO.md).

Goal: users can mark selected wallets as end-to-end encrypted. All encryption/decryption
happens in the frontend; the server stores and returns ciphertext, public keys and
structural metadata only. The protected asset is the content of **Transaction,
Subscription and Tag** rows. The adversary model is the **server operator** (full DB +
API access, honest-but-curious or key-deriving); an actively malicious server serving
compromised JS is explicitly out of scope (§14).

---

## 1. What I extracted from the codebase

### 1.1 Entities (backend `model/`, PostgreSQL via `ddl-auto=update`, no Flyway)

- **`User`** (`app_users`) — `id` (UUIDv7 via `persistence/UuidV7Generator`), `username`
  (unique), `email` (unique), `password` (**BCrypt hash**), `role` (ADMIN/USER),
  `passwordMustChange`, `demo`, `tokenVersion` (bumping invalidates all JWTs + deletes
  PATs), `createdAt`. Implements `UserDetails`. No key material of any kind today.
- **`Wallet`** (`wallets`) — `id`, `name`, `color`, `icon`, `description`, `currency`,
  `createdAt`; `@OneToMany` to `WalletAccess`, `Tag`, `Transaction` (all
  `cascade = ALL, orphanRemoval = true`). Pure container — matches the decision to keep
  wallet metadata plaintext.
- **`WalletAccess`** (`wallet_access`) — composite key (`userId`,`walletId`), `role`
  (OWNER/EDITOR/VIEWER), `status` (PENDING/ACCEPTED/REJECTED/LEFT/REVOKED), `invitedAt`,
  `updatedAt`. This is the natural home of the per-member wrapped wallet key.
- **`Transaction`** (`transactions`) — `id`, `wallet` FK (NOT NULL), `tag` FK (nullable),
  `subscription` FK (nullable), `name` (NOT NULL), `amount` (NOT NULL, 19,2),
  `originalAmount` (NOT NULL), `exchangeValue`, `originalCurrency`, `type`
  (INCOME/EXPENSE), `notes` (TEXT), `transactionDate` (NOT NULL). **There is already a
  vestigial `encryptedAmount` String column** (unused leftover) — same on Subscription;
  the plan removes both fields from the entities.
- **`Tag`** (`tags`) — `id`, `name` (NOT NULL, **unique per wallet** via
  `uk_tag_wallet_name(wallet_id,name)`), `wallet` FK, `icon`, `colorHex`, `parent` FK
  (hierarchical). Tag API addresses tags **by name in the URL**
  (`/api/tags/{walletID}/{tagName}`) — impossible for encrypted tags; the e2ee plane is
  id-addressed instead.
- **`Subscription`** (`subscriptions`) — `id`, `wallet` FK, `tag` FK, `name`, `amount`,
  `originalAmount`, `exchangeValue`, `originalCurrency`, `autoExchangeRate`, `type`,
  `notes`, plus plaintext scheduling machinery the cron needs: `status`
  (ACTIVE/PAUSED/COMPLETED), `startDate`, `nextExecutionDate`, `lastExecutionDate`,
  `frequencyType`, `frequencyInterval`, `monthlySpecificDay`, `lastWorkingDayOfMonth`,
  `duration`, `durationTimes`, `executedTimes`, `durationUntil`.
- **`PersonalAccessToken`** — SHA-256 token hash + `walletPermissions` JSON
  (`[{"walletId":..., "permissions":["READ","WRITE"]}]`), enforced by
  `security/WalletSecurity.verifyPatPermissions`.
- **`Registrations`** — invite/password-reset rows (token, email, status incl.
  `FORGOTPASSWORD`, expiry). Reused across a user's lifecycle.

### 1.2 Current auth flow

- **Login** (`controller/AuthController.login`): `LoginRequest{username, password,
  rememberMe}` → `AuthenticationManager` → BCrypt check (via
  `security/CustomUserDetailsService`) → 15-min access JWT (claims `userId`, `role`,
  `ver` = tokenVersion) + 30-day refresh JWT in an HTTP-only cookie scoped to
  `/api/auth`. **The plaintext password travels to the server today** — that is what
  invariant #4 removes.
- **Refresh** (`/api/auth/refresh`): cookie-based, rotates the refresh token in the last
  7 days of validity (`JwtService.isInRenewalWindow`).
- **Remember-me** is purely client-side storage choice: access JWT goes to
  `localStorage` (remember) vs `sessionStorage` (session), plus cookie Max-Age
  (`LoginForm.tsx`, `axiosConfig.ts` auto-refresh interceptor).
- **Password change** (`UserService.changePassword`): verifies current password, regex
  strength check **server-side**, bumps `tokenVersion`, deletes PATs.
- **Password reset** (`RegisterService.requestPasswordReset/resetPassword`): email link
  with token in `Registrations`, 15-min validity, sets new BCrypt password, bumps
  `tokenVersion`, deletes PATs. Server-side strength regex.
- **Registration** is invite-only (`RegisterService.registerViaInvite`; invites created
  by `AdminUserInviteService`): the user picks username+password on
  `/register/{token}`; `DemoService.generateDemoWallet(userId)` seeds a demo wallet
  **server-side** (plaintext data, server-generated — an encrypted wallet can never be
  seeded this way).
- **OAuth2** (`OAuthController`, `/oauth/*`, `/.well-known/*`) serves only the MCP PKCE
  flow (issues a PAT); it is **not** a user-login path — user login is password-only,
  so the auth change touches exactly: login, register-via-invite, change-password,
  forgot/reset-password.
- **First boot**: `config/DataInitializer` creates the admin from `ADMIN_*` env vars —
  a server-side password the server necessarily knows; the admin upgrades to the new
  scheme at first client login like any legacy user (§5.6).

### 1.3 Current offline / sync layer (frontend)

- `utils/offlineDb.ts` — Dexie DB `FinanceAppOffline`, v1, two tables: `cache`
  (raw GET response by URL) and `syncQueue` (queued offline POST/PUT/DELETE:
  `{url, method, payload, headers, createdAt}`).
- `api/axiosConfig.ts` — response interceptor (a) caches every GET body by URL,
  (b) on network error serves the cached GET or enqueues the mutation and returns a
  mock (`id: "offline-..."` for POST), (c) transparently refreshes JWT on 401.
- `utils/syncService.ts` — on `online`, replays `syncQueue` in order (drops items on
  4xx), fires `offline-sync-complete`.
- `api/walletDataCache.ts` — in-memory 60 s TTL cache in front of
  `GET /api/wallets/{id}/dashboard` (the unified payload:
  `{wallet, transactions, subscriptions, tags}` built by `WalletDashboardService`).
- `dashboard/wallet/WalletContext.tsx` — context contract (wallet, transactions,
  subscriptions, tags, filters, `fetchData`); the provider fills it from
  `walletDataCache.getWalletData`.
- Consequences for E2EE: raw-GET caching is useless for encrypted wallets (client must
  store **decrypted** entities and pull deltas); the syncQueue is reused as the "dirty"
  tracker; the offline mock-id path (`offline-${Date.now()}`) is replaced by real
  client-generated UUIDs.
- **Cross-plan dependency — check before phases 3/5:** `.claude/TODO/offline-sync.md`
  (offline rework of the plaintext plane, planned 2026-07-08) may land BEFORE this
  plan. If completed (file in `DONE/` or checkboxes done), the following already exist
  and MUST be extended, not rebuilt: typed domain-ops queue + coalescing
  (`src/sync/opsQueue.ts`), read overlay (`src/sync/overlay.ts`), replay engine
  (`src/sync/replay.ts`), client-assigned UUIDs honored on insert (backend
  `persistence/AssignableUuidV7Generator` + pin test — satisfies TODO 3.6), `updatedAt`
  timestamps on Transaction/Subscription/Tag with the 409 "Stale Write" precondition,
  and the mine/theirs conflict UI (`src/header/SyncCenterOverlay.tsx`, §8.4).

### 1.4 Current MCP behavior

`mcp-server/mcp_server.py` (FastMCP, :8000) is a **keyless pure proxy**: it forwards
the Bearer token to the backend and performs **Python-side plaintext analytics** —
`get_wallet_statistics` (sums/percentages over `amount`, `tag.name`),
`get_financial_timeseries` (bucketing over `transactionDate`, `amount`, tags,
subscription projections over `amount`/`frequency*`), plus flat CRUD tools. None of
this can work on ciphertext; §12 defines the refusal behavior.

### 1.5 Authorization & other cross-cutting facts

- Per-wallet RBAC via `@PreAuthorize("@walletSecurity.hasWriteAccess/hasReadAccess/
  isWalletOwner(#userId, #walletId)")`; PAT permissions checked on top.
- `SubscriptionService.executeSubscription` (daily `CronJob/SubscriptionCronJob`, 00:05)
  builds the generated Transaction from subscription plaintext (name from tag, notes
  counter "Recurring: X (#N)", optional **live exchange-rate re-pricing** when
  `autoExchangeRate`). All three server-side behaviors are incompatible with E2EE and
  are handled in §10.
- IDs are UUIDv7 generated by `@UuidGenerator(algorithm = UuidV7Generator.class)`
  (Hibernate `UuidValueGenerator`). E2EE upserts need **client-assigned** UUIDs to be
  honored on insert — Hibernate 6.6 (Spring Boot 3.5) supports assigned values for
  `@UuidGenerator`d ids; this must be pinned by a test (TODO 3.6), with a small
  generator tweak as fallback.
- CI gates: backend `./gradlew check` = Spotless + **90 % line coverage**; every backend
  change requires tests. Frontend: ESLint + `tsc -b && vite build`; Vitest exists
  (`src/__tests__/`), not CI-gated.
- Frontend UI rules: `frontend/style.md` — reuse `src/components/ui/` primitives, `app-*`
  tokens, `--r-*` radii, no colored glow, auth screens always dark, English copy.

### 1.6 Files that will be touched (complete map)

Backend — modified: `model/User.java`, `model/Wallet.java`, `model/WalletAccess.java`,
`model/Transaction.java`, `model/Subscription.java`, `model/Tag.java`,
`controller/AuthController.java`, `controller/UserController.java`,
`controller/MembersController.java`, `service/UserService.java`,
`service/RegisterService.java`, `service/MemberService.java`,
`service/WalletService.java`, `service/SubscriptionService.java`,
`service/TransactionService.java`, `service/TagService.java`,
`service/WalletDashboardService.java`, `mappers/*` (Wallet/Transaction/Subscription/Tag
mappers), `dto/*` (LoginRequest, ChangePasswordRequest, ResetPasswordRequest,
RegisterInviteRequest, WalletResponse, MemberRequest, TransactionResponse,
SubscriptionResponse, TagResponse), `config/SecurityConfig.java` (public matcher for the
salt endpoint), `controller/GlobalExceptionHandler.java` (new exceptions).
Backend — new: `model/UserKeyWrap.java`, `model/WalletChangeLog.java`,
`repository/UserKeyWrapRepository.java`, `repository/WalletChangeLogRepository.java`,
`service/UserKeyService.java`, `service/E2eeSyncService.java`,
`service/WalletEncryptionService.java`, `controller/UserKeyController.java`,
`controller/E2eeController.java`, `CronJob/ChangeLogCompactionCronJob.java`,
`config/EncryptionSchemaFixRunner.java`, `exceptions/EncryptedWalletException.java` (+
sibling exceptions), DTOs under `dto/e2ee/`.
Frontend — modified: `src/api/axiosConfig.ts`, `src/api/walletDataCache.ts`,
`src/utils/offlineDb.ts`, `src/utils/syncService.ts`, `src/utils/types.ts`,
`src/auth/LoginForm.tsx`, the register / change-password / reset-password forms,
`src/dashboard/wallet/WalletContext.tsx` + its provider, wallet settings/members UI,
`src/App.tsx` (new routes).
Frontend — new: `src/crypto/` (sodium.ts, keys.ts, blob.ts, keyring.ts, recovery.ts,
deviceKey.ts), `src/sync/` (e2eeSync.ts, conflictQueue.ts), conflict-resolution UI,
migration wizard modal, recovery-code screen, `src/pages/HowEncryptionWorks.tsx` (last
phase), Vitest suites under `src/__tests__/crypto/` and `src/__tests__/sync/`.
MCP — modified: `mcp-server/mcp_server.py` only.

---

## 2. Cryptographic foundations (decisions + rationale)

1. **Library: libsodium** via `libsodium-wrappers-sumo` (WASM, audited), plus WebCrypto
   for exactly two jobs: HKDF-SHA-256 (native `deriveBits`) and the non-extractable
   AES-GCM device key (§5.5). Rationale: Argon2id is mandatory and WebCrypto has no
   Argon2 — libsodium's `crypto_pwhash` (sumo build) provides it; X25519 **sealed boxes**
   (`crypto_box_seal`) are precisely the "wrap SKW to a member's PubK" primitive with no
   ephemeral-key bookkeeping; XChaCha20-Poly1305 (`crypto_aead_xchacha20poly1305_ietf_*`)
   gives AEAD with AAD and 24-byte random nonces (no nonce-counter state to persist —
   important for a multi-device offline-first client). A WebCrypto-only stack (ECDH
   P-256 + AES-GCM) would still need a third-party Argon2 WASM anyway.
2. **Primitives map** — KDF: Argon2id (`crypto_pwhash`,
   `ALG_ARGON2ID13`), params INTERACTIVE (opslimit 2, memlimit 64 MiB) — chosen over
   MODERATE because the app is a mobile PWA and the password additionally gates server
   auth through BCrypt-of-authHash; params are stored per-user (`kdfParams` JSON) for
   agility. Key separation: HKDF-SHA-256 (WebCrypto) with distinct `info` strings.
   Identity keypair: X25519. Key wrapping to a pubkey: `crypto_box_seal`. Symmetric
   wrapping + row encryption: XChaCha20-Poly1305 AEAD. Hashing/fingerprints: BLAKE2b
   (`crypto_generichash`). Randomness: `randombytes_buf`. **Nothing hand-rolled.**
3. **AAD binding** — every row ciphertext is bound with
   `AAD = "<entityType>:<entityId>:<walletId>"` (lowercase UUID strings), so the server
   cannot transplant a blob between rows, entity types or wallets. The one deliberate
   exception is the subscription→transaction template (§10).
4. **Wire formats** —
   - Row blob column `enc_blob`: `v1:<base64(nonce ‖ ciphertext)>` (nonce 24 B).
   - Wrapped `SKW` on WalletAccess: `sbx1:<base64(sealed_box)>` (sealed to member PubK).
   - Wrapped `PriK` per unlock method: `sk1:<base64(nonce ‖ secretbox_ct)>`, key =
     the method's 32-byte wrapping key, AAD = `prik:<userId>:<method>`.
   - Public key on User: `base64(X25519 pubkey)` (32 B).
5. **Blob JSON schemas** (one blob per row; amounts as **strings** to preserve
   BigDecimal fidelity; `v` = schema version):
   - Transaction: `{"v":1,"name","amount","originalAmount","originalCurrency",
     "exchangeValue","type","notes","transactionDate"}`
   - Subscription: `{"v":1,"name","amount","originalAmount","originalCurrency",
     "exchangeValue","type","notes"}`
   - Tag: `{"v":1,"name","icon","colorHex"}`
   Structural/plaintext remainder per entity is listed in §6.

---

## 3. Key hierarchy

```
password ──Argon2id(kdfSalt)──► masterKey (32 B, client-only)
                                  ├─HKDF("financewebapp/e2ee/auth-hash/v1")──► authHash    → sent to server, BCrypt-stored
                                  └─HKDF("financewebapp/e2ee/wrap-key/v1")──► wrappingKey  → never leaves client
recoveryCode ──Argon2id(recoverySalt)──► recoveryWrapKey (client-only)
passkey PRF output ──HKDF──► passkeyWrapKey (client-only, last phase)

PriK/PubK  = permanent random X25519 identity keypair (generated once, client-side)
             PubK stored cleartext on User; PriK stored ONLY as N independent wraps:
             user_key_wraps: (PASSWORD, wrap by wrappingKey)
                             (RECOVERY, wrap by recoveryWrapKey)
                             (PASSKEY,  wrap by passkeyWrapKey)      [later]

SKW        = per-wallet random 32-B symmetric key. For EVERY member (owner included),
             sealed-boxed to that member's PubK on their WalletAccess row.

row blob   = XChaCha20-Poly1305(SKW, nonce, AAD=type:id:walletId, JSON of sensitive fields)
```

Properties: password change / adding-removing an unlock method re-wraps **only PriK**
(one row), never wallet keys, never other users' data. Server sees: `kdfSalt`,
`kdfParams`, BCrypt(authHash), PubK, opaque wraps — none of which yields `wrappingKey`
or `PriK` (authHash and wrappingKey are independent HKDF outputs of a key the server
never sees).

---

## 4. Data model changes (entity edits; `ddl-auto=update`)

1. **`User`** — add `kdfSalt` (String b64, nullable), `kdfParams` (String JSON,
   nullable), `publicKey` (String b64, nullable), `authScheme` (enum String
   `V1_PASSWORD` | `V2_AUTHHASH`, NOT NULL, default V1). `password` keeps storing the
   BCrypt hash — of the plaintext password for V1 users, of the authHash for V2. All
   existing users backfill to V1 (column default).
2. **New `UserKeyWrap`** (`user_key_wraps`) — `id` UUIDv7, `user` FK (indexed),
   `method` enum String (PASSWORD/RECOVERY/PASSKEY), `wrappedPrivateKey` TEXT,
   `methodParams` TEXT JSON (RECOVERY: its own Argon2id salt+params; PASSKEY:
   credentialId + PRF salt; PASSWORD: empty — it reuses `User.kdfSalt`), `createdAt`.
   Unique constraint (`user_id`,`method`).
3. **`Wallet`** — add `encrypted` boolean NOT NULL default `false` (the locked flag) and
   `encrypting` boolean NOT NULL default `false` (migration-in-progress marker, §11).
   Existing rows backfill `false`/`false`.
4. **`WalletAccess`** — add `encryptedWalletKey` TEXT nullable (sealed-box SKW wrap) and
   `keyState` enum String nullable (`PROVIDED` | `AWAITING_KEY` | `PENDING_REWRAP`;
   null for plaintext wallets).
5. **`Transaction`** — `name`, `amount`, `originalAmount`, `transactionDate` become
   nullable in the entity; add `encBlob` TEXT nullable; add `createdAt`
   (`@CreationTimestamp Instant`, plaintext record-creation time — a domain field, NOT
   the sync cursor); add `subscriptionExecutionDate` LocalDate nullable (§10). Delete
   the vestigial `encryptedAmount` field. Invariant (service-enforced, since one table
   serves both modes): plaintext wallet ⇒ `encBlob IS NULL` + legacy NOT-NULL semantics;
   encrypted wallet ⇒ `encBlob NOT NULL` + sensitive columns NULL.
6. **`Subscription`** — `name`, `amount`, `originalAmount` nullable; add `encBlob` TEXT
   nullable and `encTxTemplateBlob` TEXT nullable (§10); delete vestigial
   `encryptedAmount`. Scheduling fields stay plaintext NOT NULL (cron needs them);
   `autoExchangeRate` must be `false` for encrypted wallets (validated).
7. **`Tag`** — `name` nullable; add `encBlob` TEXT nullable. `icon`/`colorHex` move
   into the blob for encrypted tags (columns null). The
   `uk_tag_wallet_name` unique constraint is kept — Postgres treats NULL names as
   distinct, so encrypted tags coexist; name-uniqueness for encrypted tags is enforced
   client-side at creation.
8. **New `WalletChangeLog`** (`wallet_change_log`) — `id` **Long, `@GeneratedValue
   (strategy = IDENTITY)`** = the monotonic `seq` (deliberately NOT a UUID and NOT a
   timestamp), `walletId` UUID (indexed together with id: index `(wallet_id, id)`),
   `entityType` enum String (TRANSACTION/SUBSCRIPTION/TAG), `entityId` UUID, `op` enum
   String (UPSERT/DELETE), `encBlob` TEXT nullable (null on DELETE), `structuralJson`
   TEXT nullable (the plaintext structural fields snapshot, §7.3), `createdAt` Instant.
   Also add to `Wallet`: `tombstonePurgedThroughSeq` Long nullable (compaction
   watermark, §8.5).
9. **NOT-NULL relaxation gotcha** — `ddl-auto=update` adds columns but **never drops an
   existing NOT NULL**. New `config/EncryptionSchemaFixRunner` (CommandLineRunner,
   ordered before `DataInitializer`) executes idempotent
   `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL` for
   transactions(name, amount, original_amount, transaction_date),
   subscriptions(name, amount, original_amount), tags(name) — plain SQL via
   `JdbcTemplate`, guarded by dialect checks so H2 tests use the equivalent
   `ALTER TABLE ... ALTER COLUMN ... SET NULL`. Optional cleanup of the orphaned
   `encrypted_amount` columns documented in the runner but not executed automatically.

---

## 5. Authentication protocol changes

### 5.1 Pre-auth salt endpoint

`GET /api/auth/login-params?username=<username-or-email>` — public (SecurityConfig
matcher). Response: `{authScheme, kdfSalt, kdfParams}`. **Anti-enumeration**: for
unknown usernames it returns `authScheme: "V2_AUTHHASH"` and a **deterministic fake
salt** = first 16 B of HMAC-SHA-256(serverPepper, lowercase(username)) so the response
shape/latency is uniform and repeat queries are consistent; `serverPepper` is derived
from the existing `JWT_SECRET_KEY` with a distinct HKDF info string (no new env var).

### 5.2 Login (V2)

Client: fetch login-params → `masterKey = Argon2id(password, kdfSalt, kdfParams)` →
HKDF → `authHash` (b64) + `wrappingKey` (in memory). POST `/api/auth/login` with
`password = authHash` — **the server-side login path is mechanically unchanged**
(AuthenticationManager + BCrypt now verifies BCrypt(authHash)). After login the client
GETs its key bundle (`/api/users/me/keys`: publicKey + wraps) and unwraps PriK
(PASSWORD wrap) with `wrappingKey`. `AuthResponse` gains `authScheme` so the client
knows whether to run the upgrade flow (§5.6).

### 5.3 Registration via invite (V2 from birth)

`/register/{token}` client-side: generate `kdfSalt`, compute authHash, generate
X25519 keypair, generate the **recovery code** (128-bit, Crockford-base32, shown once
with forced "I saved it" acknowledgement + download button), build PASSWORD and
RECOVERY wraps. `RegisterInviteRequest` gains `{kdfSalt, kdfParams, publicKey,
wraps:[{method, wrappedPrivateKey, methodParams}]}`; password field carries the
authHash. Server stores everything, `authScheme = V2`. Password-strength validation
moves **client-side** for V2 paths (the server only ever sees a uniform 32-B hash);
server keeps the regex only for V1 legacy paths.

### 5.4 Password change (re-wrap PriK only)

Client (has PriK in memory): compute current authHash (form already collects current
password), compute NEW kdfSalt + authHash + wrappingKey, re-wrap PriK →
`POST /api/auth/change-password` body gains `{newKdfSalt, newKdfParams,
newWrappedPrivateKey}` (current/new password fields carry authHashes).
`UserService.changePassword` updates password + salt + params + the PASSWORD wrap row
**atomically**, keeps bumping `tokenVersion` + deleting PATs. No wallet key, no other
user is touched. RECOVERY/PASSKEY wraps remain valid (they wrap the same PriK).

### 5.5 Remember-me and local key persistence

- In-memory: `src/crypto/keyring.ts` holds PriK + per-wallet unwrapped SKWs for the tab
  lifetime.
- Persistent (both remember-me and plain sessions — justified by the locked "local
  at-rest is low priority" call, and required so a mid-session page reload doesn't
  re-prompt for the password): a per-device **non-extractable AES-GCM-256 WebCrypto
  `CryptoKey`** generated once and stored in a Dexie `keystore` table (CryptoKeys are
  structured-cloneable; non-extractability blunts *exfiltration* of the key by XSS —
  a live XSS can still call decrypt(), documented in §14). PriK is stored AES-GCM
  encrypted under the device key. Unwrapped SKWs are never persisted; the *wrapped*
  SKWs are cached (they're server data) so offline unlock works with PriK alone.
- **Logout wipes local data**: keystore, decrypted entity tables, cursors, conflicts,
  syncQueue — wired into both the explicit logout and the 401-refresh-failure redirect
  in `axiosConfig.ts`.

### 5.6 Legacy users — lazy upgrade V1 → V2

Existing users (and the env-created admin, and users created before this feature) have
`authScheme = V1`. Login-params says V1 → the client sends the **plaintext password one
last time** (current behavior); after successful login the frontend runs a blocking
upgrade step (same UX slot as the existing `passwordMustChange` gate): re-enter/confirm
password → generate salt/keypair/recovery code/wraps →
`POST /api/users/me/security/upgrade` `{kdfSalt, kdfParams, authHash, publicKey,
wraps[]}`. Server re-encodes `password = BCrypt(authHash)`, sets V2, stores keys; no
tokenVersion bump (the session stays valid). Until a user upgrades they cannot be a
member of, or create, an encrypted wallet (no PubK exists).

### 5.7 Forgot / reset password

The email link proves mailbox control but **cannot decrypt anything** — this is the
E2EE tradeoff, stated in the UI. New/changed endpoints on the existing token:

- `GET /api/auth/reset-password/{token}/keys` → `{authScheme, publicKey,
  recoveryWrap: {wrappedPrivateKey, methodParams} | null}`.
- `POST /api/auth/reset-password/{token}` — two V2 shapes:
  - **With recovery code** (happy path): client Argon2id's the code with the salt from
    `methodParams`, unwraps PriK, generates new kdfSalt/authHash/wrappingKey, re-wraps →
    body `{authHash, kdfSalt, kdfParams, newPasswordWrap}`. Nothing else changes; all
    wallets remain readable.
  - **Without recovery code** (`resetKeys: true`): client generates a **new keypair** +
    new recovery code + wraps → body `{authHash, kdfSalt, kdfParams, publicKey,
    wraps[]}`. Server replaces keys, and for every WalletAccess of the user sets
    `encryptedWalletKey = NULL, keyState = PENDING_REWRAP`. Consequences (stated in the
    UI before confirming): encrypted wallets shared with others become readable again
    only after another member re-wraps SKW to the new PubK (§9.4); **sole-member
    encrypted wallets are permanently unreadable** — forgotten password + lost recovery
    code = data loss, by design (invariant #7).
- V1 users keep today's reset flow (they have no keys yet).

---

## 6. Plaintext vs ciphertext, per entity (encrypted wallets)

| Entity | In `encBlob` (AEAD, AAD-bound) | Stays plaintext (structural) |
|---|---|---|
| Transaction | name, amount, originalAmount, originalCurrency, exchangeValue, type, notes, **transactionDate** | id, wallet_id, tag_id, subscription_id, createdAt, subscriptionExecutionDate (§10), encBlob |
| Subscription | name, amount, originalAmount, originalCurrency, exchangeValue, type, notes | id, wallet_id, tag_id, all scheduling fields (status, startDate, nextExecutionDate, lastExecutionDate, frequency*, monthly*, duration*, executedTimes), encBlob, encTxTemplateBlob |
| Tag | name, icon, colorHex | id, wallet_id, parent_id, encBlob |

Known metadata still visible to the server (leak inventory, restated in §14): wallet
names/colors, member graph and roles, row counts, tag hierarchy shape, tag↔transaction
linkage, subscription schedules (hence occurrence dates), record creation times, op
timing in the change log.

---

## 7. E2EE data plane (new API, coexisting with the legacy plane)

### 7.1 Why a separate plane

The existing services validate plaintext (name lengths, amount ≥ 0), resolve tags by
name, compute exchange rates, and address tags by name in URLs — all impossible on
ciphertext. Contorting them would double every method's branches. Instead: a compact,
id-addressed, batch-first plane used **only** for wallets with `encrypted = true` (or
`encrypting = true` during migration). Legacy mutation endpoints **reject** encrypted
wallets with 409 (`EncryptedWalletException` → ProblemDetail); legacy read endpoints
(incl. `/dashboard`) return encrypted rows with null sensitive fields + `encBlob`, but
the frontend does not use them for encrypted wallets.

### 7.2 Endpoints (`controller/E2eeController`, service `E2eeSyncService`)

- `POST /api/e2ee/wallets/{walletId}/entities` — batch upsert, gated
  `@walletSecurity.hasWriteAccess`. Body: `[{entityType, entityId (client UUID),
  encBlob, structural}]` where `structural` is the per-type plaintext subset (§6; for
  subscriptions it includes `encTxTemplateBlob`). Semantics: **idempotent upsert by
  entityId** (insert-or-replace; re-delivery converges). Per-row validation only on
  structural fields (FKs belong to the same wallet, scheduling sanity,
  `autoExchangeRate == false`). Response: per-row status.
- `POST /api/e2ee/wallets/{walletId}/entities/delete` — batch delete
  `[{entityType, entityId}]`, idempotent (deleting a missing id is OK).
- `GET /api/e2ee/wallets/{walletId}/changes?cursor=<seq>&limit=<n≤500>` — gated
  `hasReadAccess`. Returns `{changes: [{seq, entityType, entityId, op, encBlob,
  structural}], nextCursor, hasMore, resetRequired}` ordered by seq, `seq > cursor`
  only. `resetRequired = true` when `cursor < wallet.tombstonePurgedThroughSeq` (§8.5).
  **Cursor 0 = full snapshot**: with latest-op-per-entity compaction the log always
  reconstructs current state from zero, so initial load and resync are the same code
  path.
- `GET /api/users/me/keys`, `GET /api/users/public-key?user=<username|email>`
  (authenticated; returns publicKey + fingerprint material only),
  `GET /api/wallets/{walletId}/key-requests` (owner: accesses with
  `keyState IN (AWAITING_KEY, PENDING_REWRAP)`),
  `POST /api/wallets/{walletId}/key-grants` (owner: `[{userId, encryptedWalletKey}]`).

### 7.3 Change-log append (correctness details)

- Every e2ee upsert/delete writes the entity row **and** the `WalletChangeLog` row in
  the same transaction; `structuralJson` snapshots the structural fields so a delta
  consumer never needs a second query.
- **Ordering hazard**: with concurrent writers, IDENTITY values can become visible out
  of order (seq 5 commits before seq 4 → a reader at that instant advances its cursor
  past 4 forever). Fix: serialize appends **per wallet** with a pessimistic lock on the
  Wallet row (`SELECT ... FOR UPDATE` via `@Lock(PESSIMISTIC_WRITE)`) inside the append
  transaction — portable to H2, contention is per-wallet only, write volume is human-
  scale. This makes seq gap-free-per-wallet in commit order, so `>` vs `>=` boundary
  bugs and clock skew are structurally impossible (and why the cursor is not a
  timestamp).

---

## 8. Sync design (frontend `src/sync/`, extending the existing layer)

### 8.1 Local store (Dexie v2 upgrade of `FinanceAppOffline`)

New tables: `entities` (decrypted rows, key `[walletId+entityType+entityId]`),
`syncState` (`walletId → cursor`), `conflicts` (§8.4), `badRows` (undecryptable rows),
`keystore` (§5.5). Kept: `syncQueue` (offline mutation queue = the **dirty tracker**),
`cache` (still used for plaintext wallets and non-wallet GETs only — `axiosConfig.ts`
stops raw-caching e2ee URLs).

### 8.2 Pull (delta apply)

On wallet open, on `online`, after every push, and on `offline-sync-complete`: loop
`GET /changes` with stored cursor. For each row: build AAD from row fields → decrypt →
apply. Rules:
- **Per-row error handling**: a blob that fails decrypt/parse goes to `badRows` (id +
  seq + reason), is surfaced as a non-blocking banner, and does NOT stop the batch —
  one bad row never wedges sync.
- **Dirty guard (no LWW)**: if the incoming entityId has pending local mutations
  (present in `syncQueue`) or an unresolved conflict, do NOT overwrite the local
  version — enqueue a conflict entry with both versions (§8.4).
- **Cursor commit**: the new cursor is written in the SAME Dexie transaction as the
  applied batch, only after decrypt+apply succeeded (at-least-once delivery; re-applied
  UPSERTs converge because apply is idempotent by entityId; re-applied DELETEs are
  no-ops).
- `resetRequired` → full resync: pull from 0 into a shadow table, diff local entityIds
  vs received (missing = deleted), swap atomically, keep dirty/conflict rows.

### 8.3 Push (offline mutations)

Offline mutations for encrypted wallets are enqueued as **domain ops**
(`{walletId, entityType, entityId, op, payload-plaintext}`) rather than raw HTTP bodies
— `entityId` is a client-generated UUIDv4 for creations (kills the `offline-${Date.now()}`
mock-id hack for this plane). On replay: encrypt fresh blob from current local state →
batch e2ee upsert/delete → on success remove from queue → pull. 4xx handling mirrors
today's syncService (drop + surface); 401/403 on a since-revoked wallet drops the
wallet's local data.

### 8.4 Conflicts — two-way, whole-entity choice (mine or theirs)

Chosen granularity: **whole-entity 2-way choice** (local vs remote). No 3-way merge (it
would require persisting shadow base versions of every entity for a marginal payoff on
short finance records) and **no per-field cherry-pick** — user decision 2026-07-08: the
resolution is one version or the other; a user who wants a mix picks one and re-edits
it manually afterwards. Conflict entry: `{walletId, entityType, entityId, localVersion,
remoteVersion, remoteSeq, detectedAt}`. UI: **reuse the Sync Center built by
`.claude/TODO/offline-sync.md`** (header badge + `SyncCenterOverlay`) — if that plan is
already completed, this phase only plugs the e2ee conflict source into the existing
component. The two versions may be shown side-by-side for context (read-only, numbers
in `font-app-mono`), but the only actions are: **Keep mine** (re-encrypt + push local)
/ **Take theirs** (apply remote, drop local edit). Resolution removes the queue entry
and the conflict row. Deletes: remote DELETE vs local edit → the same two actions
(Keep mine = restore/push mine, Take theirs = accept delete).

### 8.5 Compaction (`CronJob/ChangeLogCompactionCronJob`, ManagedJob, default weekly)

Per wallet: (1) delete every change-log row superseded by a newer row for the same
(entityType, entityId) — "latest op per entity", which preserves the pull-from-0
snapshot property; (2) purge DELETE tombstones older than 90 days, recording
`wallet.tombstonePurgedThroughSeq = max(purged seq)` so pre-watermark cursors get
`resetRequired` instead of silently missing deletions. Growth bound: O(live entities +
90 days of tombstones) per wallet.

---

## 9. Sharing, invitation, revocation

### 9.1 Invite A → B (encrypted wallet)

Extends `MemberService.inviteMember` / `MembersController`. A's client: fetch B's
`publicKey` → unwrap own SKW with PriA → `crypto_box_seal(SKW, PubB)` → include
`encryptedWalletKey` in the invite request. Server stores it on the PENDING
WalletAccess (`keyState = PROVIDED`). B accepts (existing `/accept`), then B's client
unwraps SKW with PriB on first open. The server only ever relays a sealed box —
invariant #6 holds. Optional trust hardening: the invite UI shows **both** users a
short fingerprint of PubB (`BLAKE2b(PubK)` → 8 hex groups) to compare out-of-band;
cosmetic-optional, documented as the only web-feasible mitigation for server key
substitution.

### 9.2 Invitee without a keypair (V1 user) or without an account

- **No account at all**: current behavior already returns a synthetic PENDING response
  without persisting — unchanged (nothing exists to wrap to).
- **Account but V1 (no PubK)**: invite is stored with `encryptedWalletKey = NULL,
  keyState = AWAITING_KEY`. B sees the invite flagged "requires account upgrade"; B can
  accept only after upgrading (§5.6). Once B has a PubK, the owner's client — via the
  `key-requests` endpoint polled on wallet open — gets a "pending key deliveries"
  prompt, wraps SKW to PubB, posts a key-grant (`keyState → PROVIDED`). Wrapping is
  restricted to the OWNER (any member holds SKW, but key distribution is an owner
  privilege, consistent with invite rights).

### 9.3 Revocation semantics (chosen behavior, stated plainly)

`removeMember` (and LEFT/REJECTED transitions) additionally nulls
`encryptedWalletKey`. This stops all future deltas (RBAC already denies reads) but does
**not** cryptographically un-share: the removed member may retain cached plaintext and
the SKW itself. True forward secrecy requires **SKW rotation** = generate SKW′, client
re-encrypts every row, re-wraps SKW′ to remaining members — mechanically identical to
the migration machinery (§11), exposed as an explicit owner action "Rotate wallet key"
with honest copy ("protects future data; anything already synced by the removed member
stays with them"). Default removal = lazy revocation; rotation = opt-in button.

### 9.4 PENDING_REWRAP recovery (after §5.7 key reset)

Same machinery as 9.2: the affected accesses sit in `keyState = PENDING_REWRAP`; any
wallet OWNER with a valid key sees the pending delivery and re-wraps. If the resetting
user IS the sole owner/member, there is no key holder left — permanent loss, by design.

---

## 10. Subscriptions under encryption (cron never decrypts)

1. Subscription rows carry **two blobs**: `encBlob` (its own display fields, AAD
   `subscription:<id>:<walletId>`) and `encTxTemplateBlob` — a pre-encrypted
   **transaction blob** (schema §2.5 with `transactionDate: null`), AAD =
   `txn-from-sub:<subscriptionId>:<walletId>`. The client writes/refreshes both on
   every subscription create/update.
2. `SubscriptionService.executeSubscription` branches on `wallet.encrypted`: build the
   Transaction with `encBlob = sub.encTxTemplateBlob`, plaintext sensitive columns
   NULL, `subscriptionExecutionDate = nextExecutionDate` (plaintext occurrence date —
   not a new leak: occurrence dates are already derivable from the plaintext schedule),
   `subscription_id` FK set. Then append TWO change-log rows in the same transaction:
   UPSERT for the new transaction and UPSERT for the subscription itself (its
   structural `executedTimes`/`nextExecutionDate`/`lastExecutionDate`/`status` changed;
   `encBlob` re-emitted unchanged). Scheduling math (`calculateNextExecutionDate`,
   `checkCompletion`) is untouched — it runs on plaintext scheduling columns.
3. Client-side decrypt of a subscription-generated transaction: AAD is reconstructed
   from the row's `subscription_id`; the display date comes from
   `subscriptionExecutionDate`; the "Recurring: X (#N)" label is rendered client-side
   from `executedTimes` (the server can no longer compose notes).
4. AAD consequence (documented, §14): all transactions of one subscription share a
   template blob, so the server could fabricate/replay an extra occurrence of an
   existing subscription (it cannot alter its content or move it across
   subscriptions/wallets). Inherent to server-side materialization; detectable
   client-side by comparing occurrence count against `executedTimes`.
5. `autoExchangeRate = true` is rejected for encrypted wallets (server can't re-price a
   ciphertext amount; the live-rate branch is skipped). Client hides the toggle.

---

## 11. Migrating an existing plaintext wallet → encrypted (resumable)

Owner-only client-driven wizard:

1. **Preflight**: every ACCEPTED member must have `authScheme = V2` (else show blocking
   list); user confirms consequences (MCP loses analytics on this wallet, recovery-code
   responsibility).
2. **Begin**: client generates SKW, wraps to own PubK + every ACCEPTED member's PubK →
   `POST /api/wallets/{id}/encryption/begin {wraps:[{userId, encryptedWalletKey}]}` —
   server (owner-gated) sets `encrypting = true`, stores wraps (`keyState = PROVIDED`),
   PENDING members get `AWAITING_KEY`. While `encrypting`: all legacy mutation
   endpoints AND subscription cron execution for this wallet are suspended (cron skips
   `encrypting` wallets; missed occurrences run on the next cron after finish — same
   catch-up semantics the cron already has for past-due dates).
3. **Encrypt rows in batches**: client pages
   `GET /api/wallets/{id}/encryption/pending?type=<t>&limit=200` (rows with
   `encBlob IS NULL`), encrypts locally (subscriptions also get their template blob),
   pushes standard e2ee upserts (accepted while `encrypting`); the server persists
   `encBlob`, **nulls the plaintext sensitive columns in the same transaction**, and
   appends the change-log row. Resumable/idempotent by construction: crash at any point
   → re-run continues from whatever still has `encBlob IS NULL`; re-sent batches
   converge.
4. **Finish**: `POST /api/wallets/{id}/encryption/finish` — server verifies zero
   pending plaintext rows across the three tables, flips `encrypted = true,
   encrypting = false`. Client swaps the wallet to the e2ee read path.
5. Decrypt-back (un-encrypt) is intentionally out of scope for this iteration.
6. **Key rotation** (§9.3) reuses steps 2–4 with SKW′ re-encryption of already-encrypted
   rows (server accepts blob replacement while a `rotating` flag is set; same
   resumability).

New encrypted wallets skip all this: `WalletRequest` gains `encrypted` +
`encryptedWalletKey` (owner's self-wrap); `WalletService.createWallet` stores both and
demo seeding is skipped for encrypted wallets.

---

## 12. MCP server — detect and refuse (decision + rationale)

Decision: the MCP **cleanly refuses content operations on encrypted wallets**.
Rationale: the two alternatives violate constraints — giving the proxy a key breaks
invariant #1 (server-side component holding decryption capability), and "move analysis
client-side" is not an MCP fix at all (an LLM client without keys can't decrypt either;
E2EE wallet analysis via LLM would require a local, key-holding client — out of scope).
Implementation (all inside `mcp_server.py`):
- `WalletResponse` gains `encrypted` (backend mapper change); `get_wallets` passes it
  through (add to `allowed_keys`) so the model sees which wallets are locked.
- New helper `_ensure_not_encrypted(ctx, wallet_id)`: one `GET /api/wallets/{id}`,
  raises `RuntimeError("This wallet is end-to-end encrypted. Its contents can only be
  read in the FinanceWebApp client; the MCP server never has decryption keys, so
  transactions, tags, subscriptions and statistics are unavailable for it. Wallet
  metadata and membership operations still work.")`.
- Wired into every content tool (get/add/update/delete transactions, tags,
  subscriptions, `get_wallet_statistics`, `get_financial_timeseries`). Member/invite
  tools and `create/update/delete_wallet` keep working (they're plaintext-plane).

---

## 13. Demo mode, admin, PATs

- **Demo users/wallets** stay plaintext forever: demo data is server-generated
  (`DemoService`), which is impossible for an encrypted wallet. Encryption UI hidden
  for `user.demo`; backend rejects `encrypted=true` wallet creation and
  `/encryption/begin` for demo users.
- **Admin bootstrap** (`DataInitializer`) is unchanged; the admin is a V1 user until
  first client login (§5.6).
- **PATs** authenticate the legacy plane and the e2ee plane alike (RBAC unchanged). A
  PAT holder without keys reads only ciphertext; with WRITE it could push garbage blobs
  — equivalent to today's write trust, noted in §14. `AccountDeletionService` must also
  delete `UserKeyWrap` rows (WalletAccess cascade already covers wrapped SKWs).

---

## 14. Honest limitations (must ship in user-facing docs page + README section)

1. **Actively malicious server**: the server ships the JavaScript. A compromised
   operator can serve modified JS that exfiltrates keys, or substitute public keys
   during sharing (MITM the sealed box). Inherent to web-delivered E2EE; the optional
   pubkey fingerprint (§9.1) lets careful users detect substitution out-of-band.
   Protection target is the honest-but-curious operator, DB dumps, and backup theft.
2. **XSS**: any script running in the origin can read decrypted data and use (though
   not trivially extract) the device CryptoKey. The non-extractable key only raises the
   bar from "steal once, decrypt forever offline" to "must keep active access".
3. **Metadata is not hidden**: wallet names/colors/currency, member graph and roles,
   row counts, tag hierarchy and tag↔row linkage, subscription schedules and occurrence
   dates, record creation times, and change-log op timing are all visible. Traffic
   analysis on the change log reveals activity patterns.
4. **No rollback/withholding protection**: AEAD authenticates rows but the server can
   drop, withhold, or roll back change-log entries; clients cannot distinguish "no new
   changes" from censorship. Per-wallet seq contiguity gives partial tamper evidence
   (a gap in seq per wallet is observable) but is not a guarantee.
5. **Subscription replay**: the server can materialize extra copies of an existing
   subscription's template blob (§10.4). Content forgery is still impossible.
6. **Recovery is unforgiving**: forgotten password + lost recovery code (no passkey) =
   permanently unreadable data; the server cannot help. Stated at every enrollment.
7. **Legacy edges**: V1 users still send a plaintext password until upgraded; demo
   wallets are plaintext; local device storage of decrypted data is accepted by design.
8. **Write-capable tokens** (PAT/members) can vandalize ciphertext (overwrite blobs);
   AEAD prevents forging *plausible* plaintext, not destruction. Change-log history +
   conflict UI give practical recovery paths.

---

## 15. Explanatory animated page (spec only — final phase)

- Route `/how-it-works/encryption` (public), linked from the landing page; React 19 +
  Framer Motion + Tailwind 4; obeys `frontend/style.md` (brand gradient accents, `--r-*`
  radii, neutral shadows, **no colored glow, no animated wordmark**, `app-*` tokens,
  English copy). Explanatory scroll-narrative, NOT an interactive playground; honors
  `prefers-reduced-motion` (falls back to static diagrams).
- Sections (each a full-viewport scroll step with `whileInView` staged reveals):
  1. **Hero** — "Your finances, readable by you alone." One-line claim + CTA to docs.
  2. **The key ladder** — animated hierarchy: password ⇒ (Argon2id) master key ⇒ unlock
     of the identity key ⇒ unlock of each wallet key ⇒ a row blob flipping from
     ciphertext glyphs to a readable transaction card. Uses the shared card/`Button`
     primitives; monospace ciphertext in `font-app-mono`.
  3. **Sharing without exposure** — A→B animation: SKW sprite gets sealed into an
     envelope stamped with B's public key, travels across a "server" column that only
     ever sees the envelope, opens on B's side with B's private key.
  4. **What the server sees** — split pane: left = actual UI card (name, amount, date);
     right = the same row as stored (uuid, `v1:9k3B…`, seq) — driven by the same data
     object to make the point concrete.
  5. **Your responsibility** — recovery-code card, "we cannot reset this for you",
     link to limitations (honest §14 summary in plain language).
- No live crypto in the page (pure presentation); copy reviewed against §14 so marketing
  never overclaims.

---

## 16. Phasing overview (details in walletEncryptionTODO.md)

0. Frontend crypto foundations (libsodium module + tests)
1. Backend key infrastructure + auth V2 (salt endpoint, wraps, upgrade, change/reset)
2. Frontend auth integration (login/register/upgrade/recovery UX, keyring, device key)
3. Data model: encrypted columns, change log, schema-fix runner, invariants
4. E2EE data plane API + change-log append/pull + compaction job
5. Frontend sync rework (Dexie v2, pull/push, conflicts UI) + encrypted wallet UX
6. Sharing/invites/key-grants/revocation (+ optional fingerprints)
7. Plaintext→encrypted migration wizard (+ key rotation reuse)
8. MCP refusal
9. Passkey (WebAuthn PRF) unlock method
10. Explanatory animated page

Each backend phase lands with tests satisfying the 90 % gate; each frontend phase keeps
`npm run lint && npm run build` green and adds Vitest coverage for crypto/sync logic.
