# Frontend Unit-Test Plan — `frontend/`

> ✅ **COMPLETATO** — 70 file di test, **456 test verdi**, `npm run lint` pulito,
> `npm run build` compila. Tutti i tier S1→S4 chiusi. Bug RBAC in `MemberRow.tsx`
> corretto. **Tutti i 5 finding di sezione 7 risolti** (ricerca collegata, file
> rinominato, `en-GB`, commenti EN + `console.log` rimosso, MonthSelector).
> Nessun commit effettuato (scelta utente).

> **Per l'esecutore (agent o umano):** ogni sotto-sezione è un task indipendente con
> checkbox `- [ ]`. Si eseguono **in ordine di sicurezza decrescente** (S1 → S4). I task
> S1/S2 vanno validati in modo **esaustivo e adversariale**; S3/S4 con copertura del
> comportamento core. Comando di verifica unico: `cd frontend && npm test`.

**Goal:** coprire il codice React di `frontend/` con unit test Vitest completi — casi
normali *e* casi limite/critici — dando priorità e profondità di validazione maggiore alle
aree security-sensitive.

**Architettura di test:** Vitest + React Testing Library + jsdom. Isolamento tramite
`vi.mock` sui moduli (pattern già usato in `walletDataCache.test.ts` /
`WalletProvider.test.tsx`). Nessun backend reale: axios/`api` mockato, storage e
`window.location` stubbati, timer finti dove serve.

**Tech stack rilevante:** `vitest@4`, `@testing-library/react@16`,
`@testing-library/user-event@14`, `@testing-library/jest-dom`, `jsdom@29`, `jwt-decode@4`,
`dexie@4`, `axios@1`.

---

## 1. Analisi dei requisiti

### 1.1 Cosa esiste già

| Area | File | Stato |
|---|---|---|
| Utils puri | `utils/subscriptionHelper.test.ts`, `utils/walletSlug.test.ts` | ✅ esistono |
| Cache dominio | `api/walletDataCache.test.ts` | ✅ esiste (7 casi) |
| Context/Provider | `dashboard/wallet/WalletProvider.test.tsx` | ✅ esiste (3 casi) |

Tutto il resto (**~145 file** tra auth, interceptor axios, PAT/RBAC, modali, UI primitives,
statistiche, DatePicker, admin, landing) è **scoperto**.

### 1.2 Convenzioni del repo da rispettare (da `CLAUDE.md` + `frontend/style.md`)

- **Inglese ovunque nel codice** (stringhe `describe`/`it` e commenti dei test in inglese).
- File di test `*.test.ts[x]` **accanto** al sorgente; esclusi dal build di produzione.
- `src/test/setup.ts` fornisce già: `jest-dom`, `cleanup()` dopo ogni test, stub `matchMedia`.
- CI frontend **non** esegue i test (gate solo lint/build) → i test non devono rompere
  `tsc`/eslint: niente `any` non necessari, import puliti, Prettier-compatibili.

### 1.3 Convenzioni tecniche di mocking (pattern del repo, da riusare)

```ts
// Mock del client HTTP (hoisted) — come in walletDataCache.test.ts
vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
// Router per componenti che usano hook di react-router
import { MemoryRouter } from "react-router-dom";
// Timer finti per debounce / TTL / setTimeout
vi.useFakeTimers(); /* ... */ vi.useRealTimers();
```

Helper trasversali da introdurre (una volta) in `src/test/`:
- **`makeJwt(payload)`** — costruisce un JWT non firmato (`base64url(header).base64url(payload).sig`)
  per testare `authHelper`/interceptor senza libreria di firma (`jwt-decode` non verifica la firma).
- **Storage/location stub** — helper per `localStorage`/`sessionStorage` (jsdom li fornisce, va
  fatto solo `clear()` in `beforeEach`) e per stubbare `window.location.href`
  (`Object.defineProperty(window, "location", { value: { href: "" }, writable: true })`).

### 1.4 Dipendenze/decisioni da risolvere prima di S1/S3

- **Dexie (`offlineDb.ts`, `syncService.ts`):** i consumatori (`axiosConfig`, `syncService`)
  vengono testati **mockando `offlineDb`** (nessun IndexedDB reale). Per testare la *classe*
  `FinanceDb` end-to-end serve `fake-indexeddb` (nuova devDependency). **Default adottato:**
  aggiungere `fake-indexeddb` come devDep e importarne l'auto-setup solo nel test di
  `offlineDb.ts`; altrove si mocka il modulo. (Task S3.15.)
- **MUI X-Charts / X-Charts-Pro** (statistiche): pesanti in jsdom → nei test dei componenti
  statistici si **mocka `@mui/x-charts*`** con stub leggeri e si testa la *data-shaping*
  (props passate), non il rendering SVG.

### 1.5 Politica di profondità di validazione (per tier)

| Tier | Profondità richiesta |
|---|---|
| **S1 – Critical** | Casi normali + **tutti** i limiti + **casi adversariali/negativi espliciti** (injection, bypass, tamper, token leak, replay infinito). Ogni branch coperto. Asserzioni di sicurezza esplicite. |
| **S2 – High** | Casi normali + limiti + negativi sui percorsi credenziali/permessi (storage token, gating owner-only, scoping permessi, replay). |
| **S3 – Medium** | Casi normali + principali limiti (money math, cache, filtri). Branch principali. |
| **S4 – Low** | Smoke di render + interazione core + 1–2 edge per componente. |

---

## 2. Sezioni di test — ordinate per sicurezza (S1 → S4)

## TIER S1 — CRITICAL SECURITY (validazione massima / adversariale)

> Governano autenticazione, autorizzazione, gestione token e superfici di esecuzione codice.
> Un bug qui = auth bypass, token leak, escalation, injection, replay. **Ogni branch va
> coperto + test negativi espliciti.**

### - [x] S1.1 — `utils/mathEvaluator.ts` (superficie injection `new Function`)
**File:** Create `src/utils/mathEvaluator.test.ts`
- **Normali:** `"1+1"→2`, `"2*3"→6`, `"(2+3)*4"→20`, `".5+.5"→1`, `"10-3-2"→5`,
  spazi ignorati `" 1 + 1 "→2`.
- **Percentuali:** `"100%"→1`, `"50%*2"→1`, `"20%+1"→1.2`.
- **Limiti numerici:** `"1/0"→null` (Infinity scartato da `isFinite`), `"0/0"→null` (NaN),
  numero enorme che diventa `Infinity`→`null`, stringa vuota / solo spazi →`null`.
- **SECURITY (deve tornare `null`):** `"alert(1)"`, `"window"`, `"process.exit()"`,
  `"[].constructor"`, `"1;2"`, `"1,2"`, `"`+"`${x}`"+`"` (template), `"'a'"`, `'"a"'`,
  `"1==1"`, `"a=1"`, `"\\"`, `"1&&1"`, `"1|1"`, lettere unicode, `"0x10"` (la `x` è lettera).
- **Assert chiave:** nessun input con caratteri fuori da `[0-9.+\-*/()\s%]` produce mai un
  numero; la funzione non lancia mai (try/catch) e non ha side-effect osservabili.

### - [x] S1.2 — `utils/authHelper.ts` (token retrieval / decode / expiry)
**File:** Create `src/utils/authHelper.test.ts` (usa `makeJwt`)
- `getToken`: **precedenza localStorage** su sessionStorage; entrambi vuoti →`null`.
- `getDecodedToken`: token valido → payload; **token malformato/garbage → `null` senza
  throw**; stringa vuota →`null`.
- `isTokenValid`: `exp` futuro →`true`; `exp` passato →`false`; nessun token →`false`;
  **boundary** `exp === now` (secondi) → false (`>` stretto).
- `getUserAuth`: mappa `sub/userId/role`; `isExpired` con boundary `exp*1000` vs `Date.now()`
  (usa fake timers per fissare `Date.now`); nessun token →`null`.
- **SECURITY:** un JWT con payload arbitrario NON deve essere trattato come "valido" oltre
  la scadenza; verificare che un token con `exp` mancante non crashi e risulti non-valido.

### - [x] S1.3 — `api/axiosConfig.ts` (interceptor request/response)
**File:** Create `src/api/axiosConfig.test.ts`
**Approccio:** mockare `../utils/offlineDb`; stubbare `window.location`,
`navigator.onLine`, storage. Esercitare gli handler via
`api.interceptors.request.handlers[0].fulfilled(config)` e
`api.interceptors.response.handlers[0].fulfilled/rejected`.
- **Request interceptor (token leak prevention):**
  - endpoint **pubblici** (`/auth/login`, `/auth/register`, `/auth/demo`,
    `/auth/forgot-password`, `/auth/reset-password`) → **NESSUN header Authorization** anche
    se un token è in storage. *(caso di sicurezza chiave)*
  - endpoint protetti + token presente → header `Bearer <token>`.
  - endpoint protetti + **nessun token** → nessun header (no crash).
- **Response interceptor — success:** GET con url → scrive in `offlineDb.cache.put`;
  non-GET → non cacha; errore di `cache.put` non propaga.
- **Response interceptor — 401 auto-refresh:**
  - 401 su endpoint normale → chiama `/auth/refresh`, salva nuovo token nello **stesso
    storage** (local se presente in local, altrimenti session), ritenta la richiesta;
    `_retry` impedisce loop.
  - 401 **sull'endpoint `/auth/refresh`** → pulisce `jwtToken`/`mustChangePWD` e redirect
    `window.location.href = "/login"`. *(no refresh-loop)*
  - refresh che fallisce → `processQueue(reject)`, storage pulito, redirect login.
  - richieste concorrenti durante refresh → **accodate** e processate una sola volta
    (single-flight: un solo `POST /auth/refresh`).
- **Offline fallback:** network error su GET con cache → risposta `isOfflineCache:true`;
  GET senza cache → reject; POST/PUT/DELETE offline → `syncQueue.add` + evento
  `offline-sync-queued` + mock response (`isOfflineQueueMock`, POST aggiunge `id` offline);
  richiesta con `isSyncRequest` → **NON** ri-accodata.

### - [x] S1.4 — `utils/syncService.ts` (replay coda mutazioni offline)
**File:** Create `src/utils/syncService.test.ts` (mock `offlineDb` + `api` + `apiError`)
- `navigator.onLine === false` → no-op (nessuna lettura coda).
- coda vuota → no-op.
- replay **in ordine `createdAt`**; su successo `syncQueue.delete(id)`.
- **4xx (≠408/429) → droppa l'item** (delete) per evitare replay infinito. *(sicurezza)*
- **5xx / 408 / 429 → mantiene** l'item in coda.
- flag `isSyncRequest:true` passato ad `api` (evita ri-accodamento).
- a fine ciclo dispatch `offline-sync-complete`.

### - [x] S1.5 — `components/auth/passwordRequirements.ts` (policy password)
**File:** Create `src/components/auth/passwordRequirements.test.ts`
- Ogni regola al **boundary**: 7 vs 8 char; assenza di lowercase/uppercase/cifra/simbolo.
- Regola "match": con `confirmPassword` undefined → `true`; uguali+non vuoti → `true`;
  diversi → `false`; entrambi `""` → `false`.
- `isPasswordValid`: true solo se **tutte** le regole passano; una qualsiasi falsa → false.
- **SECURITY:** password debole nota (`"password"`, `"12345678"`) → `isPasswordValid=false`.

### - [x] S1.6 — `utils/ProtectedRoute.tsx` (gate di rotta lato client)
**File:** Create `src/utils/ProtectedRoute.test.tsx` (mock `./authHelper`, `MemoryRouter`)
- Nessun token → `<Navigate to="/login" replace>` con `state.from` = location corrente e
  **rimozione di `mustChangePWD`** dallo storage; l'`Outlet` protetto **non** viene reso.
- Token presente → rende l'`Outlet` (contenuto figlio visibile).

---

## TIER S2 — HIGH SECURITY (credential flows + RBAC UI)

> Form credenziali, decisioni di storage token, scoping permessi, inviti/ruoli.

### - [x] S2.1 — `auth/LoginForm.tsx`
**File:** Create `src/auth/LoginForm.test.tsx` (mock `api`, `triggerToast`; `MemoryRouter`; user-event)
- Submit con campi vuoti → **nessuna chiamata `api.post`**, stato "shake", messaggi required.
- Login OK con **Remember me ON** → token in **localStorage**; OFF → in **sessionStorage**;
  `mustChangePWD` sempre salvato. *(caso di sicurezza: dove finisce il token)*
- Login fallito → `triggerToast(title,false)`, nessun redirect, token non salvato.
- `returnTo` da `location.state.from.pathname` usato nel `navigate`.

### - [x] S2.2 — `register/Register.tsx`
**File:** Create `src/register/Register.test.tsx`
- Enforcement policy password (usa `PasswordRequirements`), conferma non combaciante blocca
  il submit; errori API mostrati; submit OK naviga/mostra successo. *(ignorare `Register_old.tsx`)*

### - [x] S2.3 — `auth/ResetPassword.tsx` + `auth/ForgotPassword.tsx`
**File:** Create `src/auth/ResetPassword.test.tsx`, `src/auth/ForgotPassword.test.tsx`
- ForgotPassword: email richiesta, chiamata `forgot-password`, stato di conferma, errore.
- ResetPassword: token dal query param, policy password, mismatch conferma bloccante,
  successo/errore, token mancante/invalid gestito.

### - [x] S2.4 — `auth/OAuthConsent.tsx`
**File:** Create `src/auth/OAuthConsent.test.tsx`
- Approve/Deny; gestione `isReplayError` (400 `replay_detected`); rendering scope/client.

### - [x] S2.5 — PAT (creazione/scoping/one-time token)
**File:** Create test per `components/pat/WalletPermissionSelector.test.tsx`,
`modals/pat/PatFormView.test.tsx`, `modals/pat/PatShowTokenView.test.tsx`,
`modals/pat/PatListView.test.tsx`
- `WalletPermissionSelector`: selezione permessi **per-wallet**, default nessun accesso,
  toggle read/write, output della selezione corretto.
- `PatFormView`: validazione nome/scadenza/permessi prima della creazione.
- `PatShowTokenView`: token **mostrato una sola volta**, pulsante copia
  (`navigator.clipboard.writeText` mockato), avviso "non più visibile".
- `PatListView`: lista token, azione revoke con conferma.

### - [x] S2.6 — RBAC UI (share / membri / inviti)
**File:** Create test per `dashboard/settings/ShareSettingsSection.test.tsx`,
`dashboard/settings/MemberRow.test.tsx`, `dashboard/settings/InviteSection.test.tsx`,
`modals/wallet/ShareWalletModal.test.tsx`, `modals/invitations/InvitationsModal.test.tsx`
- Cambio ruolo (OWNER/EDITOR/VIEWER); **azioni owner-only nascoste/disabilitate** per ruoli
  inferiori *(gating)*; invito (email + ruolo); accept/decline invito; rimozione membro con
  conferma. Mock `api` per tutte le mutazioni.

### - [x] S2.7 — `utils/apiError.ts`
**File:** Create `src/utils/apiError.test.ts`
- `getApiErrorTitle`/`getApiErrorDetail`: da `AxiosError` con ProblemDetail → title/detail;
  non-Axios o senza campo → fallback.
- `getApiErrorStatus`: status da AxiosError; `undefined` altrimenti.
- `isReplayError`: `true` solo per **400 + `error:"replay_detected"`**; altri → false.
- `isAbortError`: `true` per `CanceledError`/`AbortError`; false altrimenti.

---

## TIER S3 — MEDIUM (dominio, money math, cache, filtri)

### - [x] S3.1 — `components/ui/AmountInput.tsx` (+ `formatAmountString`, `hasOperators`)
**File:** Create `src/components/ui/AmountInput.test.tsx`
- Segno di default dal `type` (EXPENSE→`-`, INCOME→`+`); virgola→punto; strip caratteri non
  ammessi; **clamp a 2 decimali**; punti multipli ridotti a uno; toggle segno a inizio input.
- Live preview via `evaluateMathExpression` quando ci sono operatori; blocco tasti non ammessi
  (`handleOnKeyDown`); resolve su `Enter`/`=`/blur; `onAmountChange` riceve la **magnitudine**
  senza segno. *(correttezza importi = integrità dati)*

### - [x] S3.2 — `utils/offlineDb.ts` (Dexie reale)
**File:** Create `src/utils/offlineDb.test.ts` — **richiede `fake-indexeddb`** (import
`fake-indexeddb/auto`).
- Schema (`cache` key `url`, `syncQueue` `++id,createdAt`); `cache.put`/`get`;
  `syncQueue.add` con auto-id e `orderBy("createdAt")`.

### - [x] S3.3 — `api/walletDataCache.ts` (estensione)
**File:** Extend `src/api/walletDataCache.test.ts`
- Propagazione `AbortSignal`; isolamento per-wallet (`w1` vs `w2` non si contaminano);
  errore non avvelena la cache (già parzialmente coperto).

### - [x] S3.4 — `dashboard/wallet/WalletProvider.tsx` + `WalletContext.tsx` (estensione)
**File:** Extend `src/dashboard/wallet/WalletProvider.test.tsx`
- Aggiornamenti stato per filtri, e per CRUD di transactions/subscriptions/tags esposti dal
  context; refresh/invalidate su mutazione.

### - [x] S3.5 — Filtri e ricerca
**File:** Create test per `dashboard/transaction/TransactionsFilter.test.tsx`,
`dashboard/transaction/TransactionsSearch.test.tsx`,
`components/TagFilter/TagFilter.test.tsx`
- Applicazione/reset filtri, query di ricerca (debounce se presente), selezione tag
  gerarchici, output del filtro corretto.

### - [x] S3.6 — `utils/subscriptionHelper.ts` (estensione) + altre util pure
**File:** Extend `src/utils/subscriptionHelper.test.ts`; verificare completezza
`utils/walletSlug.test.ts`.
- Coprire eventuali helper esportati non ancora testati; edge date (anno bisestile, fine mese,
  `lastWorkingDayOfMonth`).

### - [x] S3.7 — Logica modali transazione/subscription
**File:** Create test per `modals/TransactionModal/ExchangeRateSection.test.tsx`,
`modals/TransactionModal/RecurringPaymentToggle.test.tsx`,
`modals/TransactionModal/TransactionTypeToggle.test.tsx`,
`modals/subscription/SubscriptionView.test.tsx`
- Calcolo/inserimento exchange rate (auto vs manuale), toggle ricorrenza, toggle tipo,
  validazione campi obbligatori prima del salvataggio.

---

## TIER S4 — LOW (UI primitives / presentational / contesti)

> Smoke di render + interazione core + 1–2 edge ciascuno.

### - [x] S4.1 — UI primitives `components/ui/`
**File:** Create test per `Button.test.tsx`, `Input.test.tsx`, `CustomSelect.test.tsx`,
`Toggle.test.tsx`, `Collapse.test.tsx`, `TagBadge.test.tsx`, `Selector.test.tsx`,
`FloatingActionButton.test.tsx`
- `Button`: varianti/size come classi, `disabled` blocca `onClick`, `ripple`, `fullWidth`.
- `Input`: stato `invalid`, `leadingIcon`/`rightSlot` renderizzati, **ref forwarding**.
- `CustomSelect`/`Toggle`/`Collapse`: apertura/selezione/toggle, `onChange` chiamato,
  stato controllato.

### - [x] S4.2 — Toast system
**File:** Create `components/ui/ToastNotification.test.tsx`, `components/ui/ToastHost.test.tsx`
- `triggerToast` emette evento/aggiorna host; success vs error; auto-dismiss (fake timers).

### - [x] S4.3 — Selectors
**File:** Create test per `components/selectors/ColorSelector.test.tsx`,
`CurrencySelector.test.tsx`, `ThemeSelector.test.tsx`
- Selezione valore, `onChange`, valore iniziale, opzioni da `utils/currencies`.

### - [x] S4.4 — Util pure minori
**File:** Create test per `utils/currencies.test.ts`, `utils/icons.test.ts`,
`hooks/useMobileMath.test.ts`
- Lookup valuta/simbolo, mappa icone, calcolo mobile/keyboard height (mock `matchMedia`/resize).

### - [x] S4.5 — Contesti Theme / PWA
**File:** Create test per `utils/ThemeProvider.test.tsx`, `utils/PWAProvider.test.tsx`
- Provider fornisce valore di default, toggle tema persistito, hook lancia fuori dal provider.

### - [x] S4.6 — DatePicker
**File:** Create `components/DataPicker/CustomDatePicker.test.tsx` (+ subcomponenti se serve)
- Navigazione mese/anno, selezione giorno, `onChange` con data corretta, range limiti.

### - [x] S4.7 — Statistiche (data-shaping, chart mockati)
**File:** Create test per `dashboard/statistics/OverviewTable.test.tsx`,
`ChartRangeSelector.test.tsx`, `DateRangeBanner.test.tsx`
- Mock `@mui/x-charts*`; asserire le **props/dataset** passati ai chart e la selezione range.

### - [x] S4.8 — Landing / ToDo / Admin presentational
**File:** Create smoke test per `components/LandingPage/LandingPage.test.tsx`,
`components/ToDoPage/ToDoList.test.tsx`, `admin/StatCard.test.tsx`, `admin/UserRow.test.tsx`,
`admin/InvitesTable.test.tsx`
- Render senza crash, contenuto chiave presente, callback di interazione principali.

---

## 3. Ordine di esecuzione & tracking

1. **S1 (1.1 → 1.6)** — bloccante, massima validazione. Verificare green dopo ogni file.
2. **S2 (2.1 → 2.7)**.
3. **S3 (3.1 → 3.7)**.
4. **S4 (4.1 → 4.8)**.

Dopo ogni tier: `cd frontend && npm test` deve essere **verde**; correggere i test (non il
codice sorgente, salvo bug reale scoperto — in tal caso segnalarlo, non modificare
silenziosamente il sorgente).

## 4. Self-review (checklist finale)

- [x] Ogni file sorgente non-triviale ha un test corrispondente (o è esplicitamente escluso:
      `main.tsx`, `*.d.ts`, `Register_old.tsx`, asset puramente grafici).
- [x] Tier S1/S2: presenti i casi **negativi/adversariali** elencati (non solo happy path).
- [x] Nessun `any` superfluo; import ordinati; passa `npm run lint` e `tsc -b`.
- [x] `npm test` verde in locale.
- [x] Nessuna stringa/commento in italiano introdotta nei file di test.
