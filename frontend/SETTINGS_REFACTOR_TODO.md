# Settings Refactor — TODO

> Refactor: svuotare l'`AppHeader` a soli quick-link e spostare account/security/token in una **pagina dedicata `/settings`**.
> Deciso con l'utente (grilling, 2026-07-04). **Frontend-only ora.** Il backend NON si tocca: le feature che lo richiedono si progettano come UI **visibile ma disabilitata ("Coming soon")** e gli endpoint mancanti sono elencati in **§ Fase-2 (backend)**.
> Stile: seguire `frontend/style.md`, riuso primitive `Card`/`Button`/`Input`/`CustomSelect`/`Toggle`, token `app-*`. **Pass visivo da concordare con l'utente** prima di finalizzare.

---

## Legenda stato
- ✅ **Works today** — collegabile subito (backend già presente)
- ⛔ **Blocked** — solo UI disabilitata ora, serve backend (Fase-2)
- 🗑️ **Retire** — componente da rimuovere dopo la migrazione

---

## Decisioni bloccate
- **Route dedicata** `/settings` sotto `<ProtectedRoute/>` → tutti gli autenticati (USER + ADMIN), sezioni per-ruolo. Stesso `AppHeader`, back al dashboard, deep-link `#sezione`.
- **Layout**: scroll unico + **nav sticky scroll-spy** (desktop colonna sinistra / mobile chip in alto). Sezioni: **Account · Security · Tokens & Connections · About**.
- **Header dropdown** = solo quick-link: Identity · Install PWA · **Settings→/settings** · Theme · **Logout (immediato, single-device, NO modal)**.
- **Logout da tutti i device** → dentro **Security** (`POST /auth/logout-all`, ✅), conferma inline a due click, niente modal.
- **Account**: cambio username + cambio email con **doppia verifica OTP (vecchia + nuova email)** — ⛔.
- **Security**: cambio password ✅ + **Sign out everywhere** ✅ + **MFA** ⛔ (3 carte: **Passkey primario**, poi TOTP, poi Email OTP).
- **Tokens & Connections**: **una sola sezione** su `GET /api/tokens` con badge **Manual/MCP** (euristica `name` che inizia per `OAuth:`) + filtro — ✅. Le "sessioni MCP" sono i token OAuth.
- **Cambio pw forzato** (`mustChangePWD`): al login **redirect a `/settings#security`** con stato bloccante (niente più modal nell'header).

---

## 1. AppHeader — `frontend/src/header/AppHeader.tsx`  🔧 modifica
- [ ] Rimuovi import/ref/mount + voci menu di: `ProfileModal`, `ChangePasswordModal`, `PatModal`, `AboutAppModal`, `InvitationsModal`.
- [ ] Rimuovi il fetch `GET /invitations` + badge inviti (gli inviti si spostano nell'area wallets — vedi § Rinviato).
- [ ] Rimuovi il trigger `mustChangePWD` (si sposta in `ProtectedRoute`, § 7).
- [ ] **Logout**: rimuovi `LogoutModal`; la voce "Logout" esegue subito `POST /auth/logout` → pulisci token (local+session) + `mustChangePWD` → redirect `/login`. **Nessuna conferma.**
- [ ] Aggiungi voce **"Settings"** (`faGear`) → `navigate("/settings")`, visibile a USER **e** ADMIN.
- [ ] Tieni: header identità (username + badge Admin), `Install App (PWA)` (condizionale), `ThemeSelector`.
- Risultato dropdown: *Identity · [Install PWA] · Settings · Theme · Logout*.

## 2. Routing — `frontend/src/App.tsx`  🔧 modifica
- [ ] Aggiungi `<Route path="/settings" element={<SettingsPage/>}/>` **dentro `<ProtectedRoute/>`** (non `AdminRoute`).
- [ ] La pagina legge `location.hash` per lo scroll iniziale alla sezione.

## 3. Shell pagina — `frontend/src/settings/SettingsPage.tsx`  ✨ nuovo
- [ ] `AppHeader page={{ text:"", accent:"Settings" }}` + `DashboardBackground` + back al dashboard.
- [ ] Desktop: 2 colonne → sinistra `SettingsNav` sticky (scroll-spy `IntersectionObserver`), destra colonna di `Card` scrollabile.
- [ ] Mobile: `SettingsNav` = riga di chip sticky in alto.
- [ ] `frontend/src/settings/SettingsNav.tsx` ✨ + `frontend/src/settings/useScrollSpy.ts` ✨. Anchor: `#account #security #tokens #about`.

## 4. Sezione **Account** — `frontend/src/settings/sections/AccountSection.tsx`  ✅ FATTA (2026-07-05, backend incluso)
- [x] Tabella con `GET /api/users/me` (email **mascherata server-side**); role mostrato **solo se ADMIN**; member-since.
- [x] Cambio **username** inline nella tabella → `PUT /api/users/me/username`. Backend ri-emette i token (username = subject JWT); il frontend salva il nuovo access token.
- [x] Cambio **email** inline (mascherata, input vuoto in edit) → `PUT /api/users/me/email` (**senza OTP** per ora).
- [ ] Rimane: verifica OTP doppia sull'email (Fase-2).

## 5. Sezione **Security** — `frontend/src/settings/sections/SecuritySection.tsx`  ✨ nuovo
- [ ] **Cambio password** ✅ — form inline (current/new/confirm) che riusa `PasswordInput` + `PasswordRequirements` + `isPasswordValid`; `POST /auth/change-password`. Serve anche al caso forzato (§ 7).
- [ ] **Sign out from all devices** ✅ — blocco dedicato: bottone → `POST /auth/logout-all` → pulisci token → redirect `/login`. **Conferma inline a due click** (il bottone diventa "Confermi? Esci da tutti i dispositivi"), nessun modal.
- [ ] **MFA** ⛔ — 3 carte-metodo: **Passkey (primaria, enfatizzata)** · Authenticator/TOTP+QR · Email OTP → tutte "Coming soon".

## 6. Sezione **Tokens & Connections** — `frontend/src/settings/sections/TokensSection.tsx`  ✨ nuovo · ✅
- [ ] Lista unica da `GET /api/tokens`; **badge Manual/MCP** (euristica `name.startsWith("OAuth:")`); **filtro** All/Manual/MCP; per MCP mostra il client parsato dal nome + `lastUsedAt`.
- [ ] Colonne: nome/client · prefix · permessi wallet · created · last used · expires. Azioni: **edit permessi** (`PUT /api/tokens/{id}`), **revoke** (`DELETE /api/tokens/{id}`), **New token** (`POST /api/tokens`).
- [ ] **Riuso** `PatListView` / `PatFormView` / `PatShowTokenView` (lista inline; create/edit/show in overlay).
- Nota Fase-2: campo `source`/`clientName` sul PAT per non dipendere dal parsing del nome.

## 7. Sezione **About** — `frontend/src/settings/sections/AboutSection.tsx`  ✨ nuovo · ✅
- [ ] Porta il contenuto statico di `AboutAppModal` (versione/data da `window.__ENV__`) in una `Card`.

## 7b. Sezione **Delete account** — `frontend/src/settings/sections/DeleteAccountSection.tsx`  ✨ nuovo · BE ✅ / FE ✅ (2026-07-05)
- [x] Sezione danger (ultima, header rosso) con `Card tone="danger"`.
- [x] Backend: **FATTO 2026-07-05** (subagente) — `DELETE /api/users/me` {password} in `AccountDeletionService` (transfer/cancella wallet, drop membership, GDPR). Check verde 92.26%.
- [x] **FE collegato**: bottone "Delete account" → reveal inline con **conferma password** → apre lo `DeleteModal` condiviso a **livello 2** (digita username + press-and-hold) il cui confirm chiama `DELETE /api/users/me` {password} → pulizia token (local+session) + redirect `/login`. Riusa `useDeleteModal()`; passa un `User` con `name=username`.

## 8. Cambio password forzato (`mustChangePWD`) — `frontend/src/utils/ProtectedRoute.tsx`  🔧 modifica
- [ ] Sposta il trigger qui: se `localStorage.mustChangePWD` → **redirect `/settings#security`**.
- [ ] `SecuritySection` in modalità forzata: banner bloccante + navigazione impedita finché la password non cambia; poi pulisce il flag. Un solo form password per volontario e forzato.

## 9. Componenti da ritirare (dopo migrazione)  🗑️
- [ ] `modals/auth/ProfileModal.tsx` (era anche rotto: chiama `PUT /users/me` inesistente).
- [ ] `modals/auth/ChangePasswordModal.tsx` (logica assorbita in `SecuritySection`).
- [ ] `modals/auth/LogoutModal.tsx` (logout header immediato + all-devices in Security).
- [ ] `modals/app/AboutAppModal.tsx` (contenuto in `AboutSection`).
- [ ] Wrapper `modals/pat/PatModal.tsx` (i `Pat*View` restano e si riusano).
- [ ] `InvitationsModal` **NON** si tocca (serve per § Rinviato).

---

## Fase-2 — BACKEND  ⛔ (parziale: account FATTO)
- [x] `GET /api/users/me` (username, email mascherata, role, createdAt) — `UserController` + `UserMapper.maskEmail`.
- [x] `PUT /api/users/me/username` (check unicità + ri-emissione token) e `PUT /api/users/me/email` (check unicità, **senza OTP**). Con test + coverage ≥90%.
- [x] Cambio email doppia-verifica OTP — FATTO 2026-07-05 (subagenti BE+FE): `POST /api/users/me/email/change-request` + `change-confirm` + `DELETE .../email/change`; entità `EmailChangeRequest` (codici hashati, 10 min, max 5 tentativi); FE `AccountSection` a step. BE check 92.11%.
- [x] **DELETE account**: `DELETE /api/users/me` {password} — **FATTO 2026-07-05**. `AccountDeletionService`: verifica password (→401), per ogni wallet posseduto transfer all'erede (`invitedAt`→`createdAt`→username case-insensitive, solo membri ACCEPTED) o cancellazione a cascata (sub rimossi a mano); drop membership non-owner; poi PAT + email-change + access + user; pulisce cookie refresh. Test 7 service + 7 controller, coverage 92.26%. **Resta il wiring FE del bottone.**
- [ ] MFA: **Passkey/WebAuthn** (register/authenticate, storage credenziali) → **TOTP** (secret + QR + backup codes) → **Email OTP**; campi su `User` + modifica login per 2° fattore.
- [ ] PAT: campi `source`(MANUAL|OAUTH)/`clientId`/`clientName`/`scope` persistiti al consent + filtro server-side.

## Rinviato (non in questo piano)
- [ ] **Inviti** → spostare nell'area **wallets** (con badge "pending"). Da progettare a parte. `InvitationsModal` resta in codebase.

---

## Ordine di build — STATO (branch `feat/settings-page`, 2026-07-04)
1. [x] Shell + route + nav scroll-spy → `settings/SettingsPage.tsx`, `SettingsNav.tsx`, `useScrollSpy.ts`; route in `App.tsx`.
2. [x] Security: cambio password ✅ + Sign out everywhere ✅ (conferma inline) + redirect forzato in `ProtectedRoute.tsx` (§ 7).
3. [x] Tokens & Connections ✅ — lista unica + badge Manual/MCP + filtro, riuso `PatFormView`/`PatShowTokenView`/`TokenListItem` (nuovo prop `badge`).
4. [x] Account + MFA (UI ⛔ disabilitata "Coming soon").
5. [x] About ✅ (migrato da AboutAppModal in `AboutSection`).
6. [x] Svuotato `AppHeader` (Settings link + logout immediato) + eliminati ProfileModal/ChangePasswordModal/LogoutModal/AboutAppModal. `InvitationsModal` e `PatModal` tenuti (§ 9).
7. [ ] **Pass visivo da concordare con l'utente** (unico step rimasto).

Verifica: `tsc -b` ✅, `eslint` ✅, `npm run build` ✅, test `PatModal` ✅.

## File toccati / creati
- 🔧 `header/AppHeader.tsx`, `App.tsx`, `utils/ProtectedRoute.tsx`
- ✨ `settings/SettingsPage.tsx`, `settings/SettingsNav.tsx`, `settings/useScrollSpy.ts`, `settings/sections/{Account,Security,Tokens,About}Section.tsx`
