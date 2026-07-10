# Wallet End-to-End Encryption — Implementation TODO

Ordered, phased checklist. Execute top-to-bottom; every step is self-contained
(what / where / acceptance / tests). Architecture, formats and rationale live in
[`walletEncryptionPlan.md`](walletEncryptionPlan.md) — section references like (§5.2)
point there. Conventions that apply to EVERY step:

- Backend: after any change under `backend/`, run `./gradlew test`, add/update tests
  for the change, re-run until green, then `./gradlew spotlessApply` and keep
  `./gradlew check` (Spotless + 90 % line coverage) passing.
- Frontend: keep `npm run lint` and `npm run build` green; new logic in `src/crypto/`
  and `src/sync/` gets Vitest suites under `src/__tests__/`.
- All UI copy and code comments in English. UI follows `frontend/style.md`
  (shared primitives, `app-*` tokens, `--r-*` radii, no colored glow).
- Never weaken an invariant from the plan §"Non-negotiables": no plaintext wallet data,
  no key, no plaintext password ever reaches the server on V2 paths.

---

## Phase 0 — Frontend crypto foundations

- [ ] **0.1 Add libsodium dependency.** `frontend/`: `npm i libsodium-wrappers-sumo`
  and `npm i -D @types/libsodium-wrappers-sumo`. Create `src/crypto/sodium.ts`
  exporting `await`-able `getSodium()` singleton (memoized `ready` promise).
  Acceptance: `npm run build` green; a Vitest smoke test encrypts/decrypts a string
  with `crypto_aead_xchacha20poly1305_ietf_*`.
- [ ] **0.2 KDF + key-separation module.** `src/crypto/keys.ts`:
  `deriveMasterKey(password, saltB64, params)` (Argon2id via `crypto_pwhash`, default
  params `{alg:'argon2id13', opsLimit:2, memLimit:67108864}` — §2.2);
  `deriveAuthHash(masterKey)` and `deriveWrappingKey(masterKey)` via WebCrypto
  HKDF-SHA-256 with info `"financewebapp/e2ee/auth-hash/v1"` /
  `"financewebapp/e2ee/wrap-key/v1"` (§3); `generateIdentityKeypair()` (X25519);
  `generateWalletKey()` (32 random bytes); `wrapPrivateKey/unwrapPrivateKey`
  (XChaCha20-Poly1305 secretbox, format `sk1:<b64(nonce‖ct)>`, AAD
  `prik:<userId>:<method>`); `sealWalletKey(skw, pubKeyB64)` /
  `unsealWalletKey(sealedB64, keypair)` (`crypto_box_seal[_open]`, format
  `sbx1:<b64>`); `publicKeyFingerprint(pubB64)` (BLAKE2b-128 → 8 hex groups).
  Tests: round-trips for every pair; distinct authHash vs wrappingKey from same
  password; wrong AAD / wrong key / tampered ciphertext all throw; deterministic
  Argon2id output for fixed salt+params.
- [ ] **0.3 Row-blob module.** `src/crypto/blob.ts`: `buildAad(entityType, entityId,
  walletId)` (`"<type>:<id>:<walletId>"` lowercase; special type `txn-from-sub` takes
  the subscription id — §10); `encryptBlob(skw, aad, obj)` →
  `v1:<b64(nonce‖ct)>`; `decryptBlob(skw, aad, blob)` → parsed JSON (validates `v`).
  Blob schema builders/parsers for Transaction/Subscription/Tag per §2.5 (amounts
  serialized as strings). Tests: round-trip each entity type; AAD swap between two
  rows fails; unknown version rejected; number-fidelity (e.g. `"0.10"` survives).
- [ ] **0.4 Recovery-code module.** `src/crypto/recovery.ts`:
  `generateRecoveryCode()` — 128-bit CSPRNG, Crockford base32, grouped
  `XXXX-XXXX-…` (26 chars); `deriveRecoveryWrapKey(code, methodParams)` (Argon2id with
  its own random salt stored in `methodParams` JSON); normalization (case/dash
  tolerant re-entry). Tests: normalize→derive→unwrap round-trip; typo detection via
  failed unwrap.
- [ ] **0.5 Keyring + device persistence.** `src/crypto/keyring.ts` (in-memory PriK +
  per-wallet SKW map, `lock()` clears) and `src/crypto/deviceKey.ts`
  (non-extractable AES-GCM-256 WebCrypto `CryptoKey` in a new Dexie `keystore` table;
  `persistPriK`/`loadPriK` AES-GCM under the device key — §5.5). Include
  `wipeLocalCryptoState()` used by logout. Tests with `fake-indexeddb`: persist→reload
  →unwrap; wipe removes everything.

## Phase 1 — Backend key infrastructure + auth V2

- [ ] **1.1 User entity + UserKeyWrap.** Edit `model/User.java`: add `kdfSalt`,
  `kdfParams`, `publicKey` (nullable Strings), `authScheme` (enum String
  `V1_PASSWORD`/`V2_AUTHHASH`, NOT NULL, columnDefinition default `'V1_PASSWORD'`).
  New `model/UserKeyWrap.java` + `repository/UserKeyWrapRepository.java` per §4.2
  (unique `(user_id, method)`). Extend `AccountDeletionService` to delete a user's
  wraps. Tests: entity persistence round-trip (H2), unique constraint violation,
  account deletion removes wraps.
- [ ] **1.2 Login-params endpoint.** New `controller/UserKeyController.java` (or
  extend AuthController): `GET /api/auth/login-params?username=` returning
  `{authScheme, kdfSalt, kdfParams}`; unknown users get uniform fake salt =
  HMAC-SHA-256(pepper, lowercase(username))[0..16] with `authScheme=V2_AUTHHASH`
  (§5.1); pepper derived from `application.security.jwt.secret-key` with distinct
  context. Permit in `SecurityConfig` (it's under `/api/auth/**`, already public —
  verify). Tests: known V1, known V2, unknown user (deterministic across calls,
  response shape identical), case-insensitivity.
- [ ] **1.3 Key-bundle endpoints.** `GET /api/users/me/keys` →
  `{publicKey, wraps:[{method, wrappedPrivateKey, methodParams}]}`;
  `GET /api/users/public-key?user=<username|email>` (authenticated) →
  `{userId, username, publicKey}` or 404. New `service/UserKeyService.java`. Tests:
  auth required; V1 user → empty bundle; public-key lookup by username and email.
- [ ] **1.4 Upgrade endpoint (V1→V2).** `POST /api/users/me/security/upgrade` body
  `{kdfSalt, kdfParams, authHash, publicKey, wraps[]}` — sets
  `password = BCrypt(authHash)`, `authScheme = V2`, saves publicKey + wraps (must
  include PASSWORD and RECOVERY); idempotency: reject if already V2 (409). NO
  tokenVersion bump (§5.6). Blocked for demo users. Tests: happy path (old password
  no longer authenticates, authHash does), missing wrap methods rejected, second call
  409, demo user 403.
- [ ] **1.5 Registration V2.** Extend `dto/RegisterInviteRequest` +
  `RegisterService.registerViaInvite` to accept and store `{kdfSalt, kdfParams,
  publicKey, wraps[]}`, set `authScheme = V2`; the `password` field carries the
  authHash (BCrypt as usual). Server-side strength regex NOT applied on V2 register
  (§5.3). Keep the old shape working (no keys ⇒ V1 user) for a transition window.
  Tests: V2 registration stores keys and scheme; V1 fallback still works;
  `AuthResponse` includes `authScheme` (add it in AuthController login/refresh).
- [ ] **1.6 Change-password V2.** Extend `dto/ChangePasswordRequest` with `newKdfSalt`,
  `newKdfParams`, `newWrappedPrivateKey`; `UserService.changePassword`: for V2 users
  skip the strength regex (fields carry authHashes), update password + salt + params +
  PASSWORD wrap row in one transaction, keep tokenVersion bump + PAT deletion; reject
  V2 requests missing the new wrap (400). Tests: V2 re-wrap flow (old wrap replaced,
  RECOVERY wrap untouched), V1 path unchanged, partial-body rejection, tokenVersion
  bumped.
- [ ] **1.7 Reset-password V2.** New `GET /api/auth/reset-password/{token}/keys` →
  `{authScheme, publicKey, recoveryWrap|null}` (validates token exactly like
  `getResetPasswordInvite`). Extend `POST /api/auth/reset-password/{token}` per §5.7:
  shape A `{authHash, kdfSalt, kdfParams, newPasswordWrap}` (recovery path — replaces
  PASSWORD wrap only); shape B `{authHash, kdfSalt, kdfParams, publicKey, wraps[],
  resetKeys:true}` (lost recovery — replace keypair + ALL wraps, and for every
  WalletAccess of the user set `encryptedWalletKey = NULL, keyState =
  PENDING_REWRAP`). Keep V1 behavior for V1 users. Tests: both shapes, wallet-access
  nulling, expired/used token, V1 regression.

## Phase 2 — Frontend auth integration

- [ ] **2.1 Login flow.** `src/auth/LoginForm.tsx` + a new `src/auth/authFlow.ts`:
  fetch login-params → if V2: derive authHash locally and send it as `password`;
  if V1: send plaintext password (legacy, one last time). After login: fetch key
  bundle, unwrap PriK into keyring, persist via deviceKey (§5.5). Store `authScheme`
  from `AuthResponse`. Acceptance: V2 login never puts the plaintext password on the
  wire (assert in Vitest by mocking `api.post` and inspecting the body).
- [ ] **2.2 Upgrade gate.** New blocking screen (same routing slot as
  `mustChangePWD`): explains the upgrade, asks the password again, generates
  salt/keypair/recovery wraps, shows the **recovery code once** (copy + download
  `.txt`, forced checkbox "I stored it safely"), calls `/security/upgrade`, then
  unlocks the app. Skippable "later" only if product wants soft rollout — default:
  NOT skippable once shipped. Tests: upgrade round-trip against mocked API; recovery
  code shown exactly once.
- [ ] **2.3 Register V2.** Register-via-invite page: client generates everything per
  §5.3, shows recovery code (same component as 2.2), sends V2 body. Client-side
  password-strength meter replicating the old server regex (≥8, upper, lower, digit,
  special).
- [ ] **2.4 Change-password V2.** Settings SecuritySection: derive current authHash,
  new salt/authHash, re-wrap PriK from keyring, send extended body; after success
  the existing forced re-login flow continues to work.
- [ ] **2.5 Reset-password page V2.** Two-branch UI per §5.7: with recovery code
  (input with normalization + live unwrap validation against `/keys` payload) or the
  destructive branch behind explicit typed confirmation (reuse `DeleteModal`
  friction level 2 — type + hold), with copy stating exactly what becomes
  unrecoverable.
- [ ] **2.6 Logout wipe.** Wire `wipeLocalCryptoState()` + wipe of decrypted tables /
  cursors / conflicts / syncQueue into explicit logout AND the 401-refresh-failure
  redirect in `axiosConfig.ts` (§5.5). Test: logout leaves no keystore/entities rows
  (fake-indexeddb).

## Phase 3 — Backend data model for encrypted content

- [ ] **3.1 Wallet + WalletAccess columns.** `Wallet`: add `encrypted` (boolean NOT
  NULL default false), `encrypting` (same), `tombstonePurgedThroughSeq` (Long
  nullable). `WalletAccess`: add `encryptedWalletKey` TEXT nullable, `keyState` enum
  String nullable (`PROVIDED`/`AWAITING_KEY`/`PENDING_REWRAP`). Expose `encrypted` in
  `WalletResponse` via `WalletMapper` and in frontend `types.ts`. Tests: persistence,
  mapper includes flag, default backfill false.
- [ ] **3.2 Transaction entity.** Make `name`, `amount`, `originalAmount`,
  `transactionDate` nullable in the entity; add `encBlob` TEXT, `createdAt`
  (`@CreationTimestamp Instant`, updatable false), `subscriptionExecutionDate`
  (LocalDate nullable); DELETE the vestigial `encryptedAmount` field. Tests: encrypted-
  shape row (nulls + blob) persists; plaintext-shape still validated by service layer.
- [ ] **3.3 Subscription entity.** Same nullability treatment (`name`, `amount`,
  `originalAmount`); add `encBlob`, `encTxTemplateBlob`; delete `encryptedAmount`.
- [ ] **3.4 Tag entity.** `name` nullable; add `encBlob`. Confirm
  `uk_tag_wallet_name` tolerates NULL names on Postgres and H2 (test inserting two
  encrypted tags in one wallet).
- [ ] **3.5 Schema-fix runner.** New `config/EncryptionSchemaFixRunner.java`
  (CommandLineRunner, `@Order` before DataInitializer): idempotent `ALTER TABLE …
  DROP NOT NULL` (Postgres) / `SET NULL` (H2) for the columns in 3.2–3.4 (§4.9),
  catching-and-logging when the column is already nullable. Tests: runner executes on
  H2 without error and is idempotent (run twice).
- [ ] **3.6 Client-assigned UUID pin-test.** JPA test that persists a Transaction with
  a pre-set UUID and asserts the id survives (Hibernate 6.6 assigned-id support with
  `@UuidGenerator` — §1.5). If it fails: adapt `persistence/UuidV7Generator` /
  id mapping so assigned ids win (fallback documented in plan), and keep this test as
  the regression guard. **Check first:** `.claude/TODO/offline-sync.md` Task 1 ships
  `persistence/AssignableUuidV7Generator` + `AssignableUuidV7GeneratorTest` — if that
  plan is done, this item is already satisfied; just verify the test exists.
- [ ] **3.7 WalletChangeLog entity + repository.** Per §4.8: Long IDENTITY id,
  indexes `(wallet_id, id)`; repository methods `findByWalletIdAndIdGreaterThan
  OrderByIdAsc(Pageable)`, compaction queries (latest-per-entity, tombstones older
  than cutoff). Tests: ordering, pagination.
- [ ] **3.8 Legacy-plane guards.** In `TransactionService`, `SubscriptionService`,
  `TagService` mutation methods (single + bulk) and CSV bulk paths: reject wallets
  with `encrypted || encrypting` via new `exceptions/EncryptedWalletException` →
  `GlobalExceptionHandler` maps to 409 ProblemDetail. Read paths keep working
  (mappers add `encBlob` + structural fields to Transaction/Subscription/Tag response
  DTOs). Tests per service: mutation on encrypted wallet 409; reads return blob
  fields.

## Phase 4 — E2EE data plane API (backend)

- [ ] **4.1 Batch upsert endpoint.** `controller/E2eeController` +
  `service/E2eeSyncService`: `POST /api/e2ee/wallets/{walletId}/entities`
  (`@PreAuthorize hasWriteAccess`), body per §7.2. Rules: wallet must be `encrypted ||
  encrypting`; idempotent upsert by client `entityId`; structural validation only
  (tag/subscription FKs belong to same wallet; scheduling sanity; `autoExchangeRate`
  false); per-row result list; each row writes entity + change-log row in ONE
  transaction with the per-wallet pessimistic Wallet lock (§7.3). Tests: create,
  update (same id twice converges), cross-wallet FK rejected, plaintext wallet 409,
  VIEWER 403, change-log row written with structuralJson snapshot.
- [ ] **4.2 Batch delete endpoint.** `POST /api/e2ee/wallets/{walletId}/entities/
  delete`: idempotent; appends DELETE change-log rows (encBlob null). Deleting a
  subscription must NOT cascade-delete its generated transactions (mirror legacy
  semantics: transactions keep living; their `subscription_id` nulls — verify current
  FK behavior and replicate). Tests: delete existing, delete missing (200), tombstone
  row appended.
- [ ] **4.3 Changes (delta pull) endpoint.** `GET /api/e2ee/wallets/{walletId}/
  changes?cursor&limit` per §7.2 (`hasReadAccess`): seq-ordered, `seq > cursor`,
  `limit ≤ 500`, `{changes, nextCursor, hasMore, resetRequired}`;
  `resetRequired = cursor < tombstonePurgedThroughSeq`. Tests: boundary `>` (row at
  cursor excluded), pagination continuity (no gap/dup across pages), resetRequired
  logic, member of other wallet 403/404.
- [ ] **4.4 Ordering-under-concurrency test.** Concurrency test (two threads
  appending to one wallet through the service) asserting the per-wallet lock
  serializes appends: reading with any intermediate cursor never skips a row.
- [ ] **4.5 Compaction job.** `CronJob/ChangeLogCompactionCronJob` implementing
  `ManagedJob` (pattern of `SubscriptionCronJob`; default WEEKLY): latest-op-per-entity
  pruning + 90-day tombstone purge updating `tombstonePurgedThroughSeq` (§8.5).
  Tests: superseded rows removed, latest kept, snapshot-from-0 still reconstructs
  state, watermark set, job registered in the admin System tab machinery.
- [ ] **4.6 Wallet key endpoints.** `GET /api/wallets/{id}/key-requests` (owner:
  list accesses with keyState AWAITING_KEY/PENDING_REWRAP incl. member publicKey) and
  `POST /api/wallets/{id}/key-grants` (owner: `[{userId, encryptedWalletKey}]` →
  stores wrap, keyState → PROVIDED). Tests: owner-only, grant flips state, member
  without publicKey can't be granted (400).
- [ ] **4.7 Encrypted wallet creation.** `WalletRequest` gains `encrypted` boolean +
  `encryptedWalletKey`; `WalletService.createWallet`: when encrypted — require the
  self-wrap, set flag, `keyState = PROVIDED`, skip nothing else; reject for demo
  users; `GET /api/wallets` response carries `encrypted` (done in 3.1). Tests: create
  encrypted wallet, missing wrap 400, demo 403.

## Phase 5 — Frontend sync rework + encrypted wallet UX

- [ ] **5.1 Dexie schema v2.** `utils/offlineDb.ts`: bump to version(2) adding
  `entities` (`[walletId+entityType+entityId], walletId`), `syncState` (`walletId`),
  `conflicts` (`++id, walletId`), `badRows` (`++id, walletId`), `keystore` (`id`);
  keep `cache`/`syncQueue` with upgrade hook. Tests (fake-indexeddb): v1→v2 upgrade
  preserves queue.
- [ ] **5.2 Pull engine.** New `src/sync/e2eeSync.ts`: `pullWallet(walletId)` loop per
  §8.2 — decrypt with AAD from row fields (`txn-from-sub` when `subscriptionId` set
  and blob came from materialization: detect via `subscriptionExecutionDate != null`),
  per-row try/catch → `badRows`, dirty-guard → conflicts, atomic Dexie tx
  (entities + cursor), resetRequired → full-resync path (shadow diff, §8.2). Tests:
  happy pull, bad blob isolated, cursor not committed on thrown apply, dirty row
  becomes conflict not overwrite, delete tombstone applied, reset path removes
  locally-deleted-remotely rows but preserves dirty ones.
- [ ] **5.3 Push engine.** Extend `syncService.ts`/new queue format for e2ee wallets
  (domain ops with client UUIDv4 ids — §8.3): replay = encrypt-from-current-local-state
  → batch upsert/delete → dequeue → pull. Update `axiosConfig.ts`: do NOT raw-cache
  `/api/e2ee/*` GETs; offline mutations for encrypted wallets go to the domain queue
  (not the raw HTTP queue). Tests: offline create→replay→server body contains blob +
  client id; 4xx drops with surfaced error; ordering preserved.
- [ ] **5.4 WalletContext branch.** Wallet provider: if `wallet.encrypted` — source
  transactions/subscriptions/tags from Dexie `entities` (decrypted at pull time),
  `fetchData` = pullWallet, mutations go through a new `src/sync/e2eeMutations.ts`
  (encrypt + optimistic local apply + queue/push); else legacy `walletDataCache`
  path unchanged. SKW unlock on wallet open: read own `encryptedWalletKey` from the
  wallet payload → `unsealWalletKey` with keyring PriK → keyring. Handle
  `keyState = PENDING_REWRAP/AWAITING_KEY` for self ("waiting for the owner to
  re-share the key" empty state). Acceptance: an encrypted wallet is fully usable
  (CRUD all three entity types) online and offline; plaintext wallets regress-free.
- [ ] **5.5 Subscription display rules.** For encrypted wallets: hide/disable
  `autoExchangeRate` in `SubscriptionModal`; generated transactions render name/date
  from template blob + `subscriptionExecutionDate` + client-side "Recurring (#N)"
  label (§10.3).
- [ ] **5.6 Conflict UI.** Per §8.4 (whole-entity, mine-or-theirs — NO per-field
  merge, user decision 2026-07-08): reuse/extend the Sync Center from
  `.claude/TODO/offline-sync.md` (`src/header/SyncCenterOverlay.tsx` + badge) if that
  plan is done, else build it there-style; two-column read-only context view (mono for
  numbers), actions **Keep mine** / **Take theirs** only; delete-vs-edit variant gets
  the same two actions. Follows `style.md` primitives. Tests: resolution logic (pure
  functions) in Vitest; a conflict resolved "keep mine" produces exactly one queued
  upsert.
- [ ] **5.7 Bad-rows surface.** Non-blocking banner in the wallet ("N items could not
  be decrypted") with retry (re-pull) — data stays in `badRows` for diagnostics.

## Phase 6 — Sharing, invitations, revocation

- [ ] **6.1 Invite with key.** Backend: `MemberRequest` gains optional
  `encryptedWalletKey`; `MemberService.inviteMember` stores it (`keyState =
  PROVIDED`) or sets `AWAITING_KEY` when absent/invitee has no publicKey; reject
  EDITOR/VIEWER invites to encrypted wallets without wrap only if invitee HAS a key
  (else pending). Tests: both branches, plaintext wallets unaffected (null keyState).
- [ ] **6.2 Invite UI.** Members modal: for encrypted wallets fetch invitee publicKey,
  unwrap SKW from keyring, seal, attach; show invitee fingerprint (§9.1) with short
  explainer tooltip; V1 invitee → "will need to upgrade their account" notice.
- [ ] **6.3 Accept flow.** Invitee accept path (existing `/accept`): after accept, on
  first wallet open unwrap SKW (5.4 already covers); AWAITING_KEY accepted invites
  show the waiting state. Backend test: accept with keyState AWAITING_KEY allowed;
  reads return no content until granted (RBAC unchanged — the block is cryptographic).
- [ ] **6.4 Key-grant UX (owner).** On wallet open, owner client checks
  `/key-requests`; if pending → prompt listing members (with fingerprints) → seal SKW
  to each → `/key-grants`. Covers both AWAITING_KEY (new V2 user) and PENDING_REWRAP
  (post-reset, §9.4).
- [ ] **6.5 Revocation.** Backend: `removeMember` (and LEFT/REJECTED transitions in
  `MemberService.setStatus`) null `encryptedWalletKey`, keyState null. Frontend
  member-removal copy for encrypted wallets states the §9.3 caveat ("already-synced
  data stays on their device; rotate the wallet key to protect future data" — rotation
  button lands in Phase 7). Tests: wrap nulled on remove/leave/reject.

## Phase 7 — Plaintext→encrypted migration (+ key rotation)

- [ ] **7.1 Begin/finish endpoints.** New `service/WalletEncryptionService` +
  endpoints (owner-gated): `POST /api/wallets/{id}/encryption/begin {wraps[]}` — all
  ACCEPTED members must be V2 (else 409 listing offenders), sets `encrypting=true`,
  stores wraps; `GET /api/wallets/{id}/encryption/pending?type&limit` — rows with
  `encBlob IS NULL`; `POST /api/wallets/{id}/encryption/finish` — verifies zero
  pending across all three tables, flips `encrypted=true, encrypting=false` (§11).
  While `encrypting`: legacy mutations 409 (3.8 covers), e2ee upserts allowed (4.1
  covers), subscription cron skips the wallet. Tests: full state machine, finish with
  leftovers 409, cron skip, non-owner 403, demo 403.
- [ ] **7.2 Migration wizard (frontend).** Owner-only modal from wallet settings:
  preflight member check → consequences screen (MCP loss, recovery responsibility;
  DeleteModal friction level 1 — hold) → generate SKW + wraps → begin → batch-encrypt
  loop with progress bar (resumable: re-entering the wizard on a wallet with
  `encrypting=true` reuses existing wraps — owner re-unwraps own SKW — and continues
  from pending rows; subscriptions also produce `encTxTemplateBlob`) → finish → swap
  to e2ee path (5.4). Acceptance: kill the tab mid-migration, reopen, complete;
  wallet identical content-wise after migration.
- [ ] **7.3 Subscription cron for encrypted wallets.** `SubscriptionService.
  executeSubscription` branch per §10.2: copy `encTxTemplateBlob`, null sensitive
  columns, set `subscriptionExecutionDate`, skip live-rate branch, append TWO
  change-log rows (transaction UPSERT + subscription UPSERT) in the same tx with the
  wallet append lock. Tests: encrypted-wallet materialization (blob copied verbatim,
  plaintext nulls, both log rows, executedTimes/nextExecutionDate advanced),
  plaintext-wallet regression suite untouched, PAUSED/completion logic unchanged.
- [ ] **7.4 Key rotation (owner action).** Reuse 7.1/7.2 machinery per §9.3/§11.6:
  `rotating` flag, client re-encrypts all rows under SKW′, re-wraps to remaining
  members, single "Rotate wallet key" button in members UI with honest copy. Backend
  tests: rotation state machine; revoked member's wrap absent afterwards. (May ship
  as a fast-follow if schedule demands — it blocks nothing else.)

## Phase 8 — MCP handling

- [ ] **8.1 Encrypted-wallet refusal.** `mcp-server/mcp_server.py` per §12: add
  `encrypted` to `get_wallets` `allowed_keys`; new `_ensure_not_encrypted(ctx,
  wallet_id)` helper (single wallet GET, RuntimeError with the exact §12 message);
  call it at the top of every content tool (get/add/update/delete transaction, tag,
  subscription tools, `get_wallet_statistics`, `get_financial_timeseries`).
  Member/invite/wallet-CRUD tools untouched. Acceptance: manual run against a local
  encrypted wallet — every content tool returns the refusal message, `get_wallets`
  shows the flag; plaintext wallets unaffected.

## Phase 9 — Passkey (WebAuthn PRF) unlock method

- [ ] **9.1 Enrollment.** Settings → Security "Add a passkey unlock": WebAuthn
  `create()` with `prf` extension (feature-detect; hide on unsupported browsers) →
  PRF output + HKDF (`"financewebapp/e2ee/passkey-wrap/v1"`) → wrap PriK → store via
  new `POST /api/users/me/keys/wraps {method: PASSKEY, wrappedPrivateKey,
  methodParams: {credentialId, prfSalt}}` (+ `DELETE .../wraps/PASSKEY`). Backend:
  small additions to `UserKeyService`/controller; wraps table already supports it
  (1.1). Backend tests: add/remove wrap, uniqueness per method.
- [ ] **9.2 Unlock at login.** Login screen (V2 users with a PASSKEY wrap — expose
  wrap methods in login-params? No: after JWT auth, offer "Unlock with passkey"
  instead of password-derived unlock when the key bundle lists a PASSKEY wrap; also
  covers the reload-without-device-key case). `get()` with PRF → derive → unwrap
  PriK → keyring. Note: passkey unlocks PriK only; server auth still needs the
  password-derived authHash (passkey-only *sign-in* is a separate future project —
  state this in the UI copy).

## Phase 10 — Explanatory animated page

- [ ] **10.1 Build `/how-it-works/encryption`** per plan §15: public route in
  `App.tsx`, linked from the landing page; five scroll sections (hero, key ladder,
  sharing animation, "what the server sees" split pane, responsibility/limitations);
  React 19 + Framer Motion + Tailwind 4; `style.md` compliance checklist (§15 lists
  the constraints: primitives, `app-*` tokens, no glow, squared radii, English,
  `prefers-reduced-motion` fallback). Copy must not overclaim — cross-check every
  sentence against plan §14. Acceptance: `npm run lint && npm run build` green;
  manual review on mobile + desktop, light/dark (page may pin dark like auth screens
  if it reuses `AnimateBackground` — decide during build with the standing
  "consult on subjective UI" rule).

## Cross-cutting wrap-up (after each phase, verify)

- [ ] **W.1** `./gradlew check` green (Spotless + 90 % coverage) on every backend
  phase; `npm run lint && npm run build` green on every frontend phase.
- [ ] **W.2** Run `graphify update .` after landing each phase (repo convention).
- [ ] **W.3** End-to-end smoke after Phase 7: two browsers/two users — create
  encrypted wallet, CRUD offline+online, share, conflict, resolve, migrate a legacy
  wallet, password change, recovery-code reset — while watching the DB to confirm
  only ciphertext/keys-as-wraps ever land in `transactions`, `subscriptions`, `tags`,
  `wallet_change_log`, `user_key_wraps`, `wallet_access` for encrypted wallets.
- [ ] **W.4** Documentation: README section + in-app copy for the §14 limitations;
  update `CLAUDE.md` architecture notes (new `e2ee` plane, change log, key tables).
