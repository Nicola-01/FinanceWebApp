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

## 4. Sezione **Account** — `frontend/src/settings/sections/AccountSection.tsx`  ✨ nuovo · ⛔
- [ ] Card "Current account": username (da JWT, ok) · email + member-since + role → richiedono `GET /users/me` (Fase-2) → placeholder disabilitato.
- [ ] Cambio **username**: `Input` + Save → disabilitato "Coming soon" (serve `PUT` username).
- [ ] Cambio **email**: email attuale + nuova email → **doppia verifica OTP** (2 campi codice: vecchia + nuova) → disabilitato "Coming soon".

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

## Fase-2 — BACKEND (documentato, NON implementare ora)  ⛔
- [ ] `GET /users/me` (username, email, createdAt, role, stato MFA) — per mostrare l'email/account.
- [ ] `PUT` username (check unicità).
- [ ] Cambio email doppia-verifica: request (OTP a vecchia + nuova) + confirm (valida entrambi) + update; entità/store OTP con scadenza (riusa infra mail esistente).
- [ ] MFA: **Passkey/WebAuthn** (register/authenticate, storage credenziali) → **TOTP** (secret + QR + backup codes) → **Email OTP**; campi su `User` + modifica login per 2° fattore.
- [ ] PAT: campi `source`(MANUAL|OAUTH)/`clientId`/`clientName`/`scope` persistiti al consent + filtro server-side.

## Rinviato (non in questo piano)
- [ ] **Inviti** → spostare nell'area **wallets** (con badge "pending"). Da progettare a parte. `InvitationsModal` resta in codebase.

---

## Ordine di build (quando l'utente dice "vai")
1. [ ] Shell + route + nav scroll-spy (sezioni vuote).
2. [ ] Security: cambio password ✅ + Sign out everywhere ✅ + redirect forzato (§ 7).
3. [ ] Tokens & Connections ✅ (riuso `Pat*View`).
4. [ ] Account + MFA (UI disabilitata ⛔).
5. [ ] About ✅.
6. [ ] Svuota `AppHeader` + ritira i modal (§ 1, § 9).
7. [ ] Pass visivo concordato con l'utente.

## File toccati / creati
- 🔧 `header/AppHeader.tsx`, `App.tsx`, `utils/ProtectedRoute.tsx`
- ✨ `settings/SettingsPage.tsx`, `settings/SettingsNav.tsx`, `settings/useScrollSpy.ts`, `settings/sections/{Account,Security,Tokens,About}Section.tsx`
