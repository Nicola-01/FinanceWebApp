# 🚑 Deploy Fix — Pipeline CI/CD bloccata dal lint del frontend

> Analisi e piano di remediation per `deployerror.log`.
> Strategia scelta: **Ibrido** — fix a mano di tutti i bug reali/meccanici, degrado a `warning` delle regole nuove/rumorose introdotte dal bump delle dipendenze.

---

## 1. Causa radice

La pipeline (`.github/workflows/deploy.yml`, job **`build-frontend` → step _Lint (ESLint + Prettier)_**) esegue `npm run lint` (`eslint .`) che termina con **exit code 1**:

```
✖ 157 problems (151 errors, 6 warnings)
Error: Process completed with exit code 1.
```

Il job `deploy` dipende da `build-frontend == success`, quindi **l'intero deploy è bloccato**.

**Perché adesso?** La config `frontend/eslint.config.js` estende `reactHooks.configs.flat.recommended` da **`eslint-plugin-react-hooks@^7`**, che abilita le nuove regole basate sul **React Compiler**
(`set-state-in-effect`, `static-components`, `purity`, `immutability`, `refs`), sommate a `typescript-eslint` recommended (`no-explicit-any`). Il codice esistente le viola in 151 punti su 62 file. Non è un problema di infrastruttura CI: è il **quality gate del lint** che ora è molto più severo.

I 6 `react-hooks/exhaustive-deps` sono **warning** e **non** bloccano `eslint .`.

### Distribuzione errori (riprodotta localmente, identica al log)

| # | Regola | Categoria |
|---|--------|-----------|
| 102 | `@typescript-eslint/no-explicit-any` | tipizzazione (rumore da bump) |
| 13 | `@typescript-eslint/no-unused-vars` | meccanico |
| 11 | `react-hooks/set-state-in-effect` | React Compiler (rumore da bump) |
| 7 | `react-refresh/only-export-components` | fast-refresh (rumore da bump) |
| 3 | `react-hooks/immutability` | **bug logico reale** |
| 2 | `react-hooks/static-components` | **bug reale** (state reset) |
| 2 | `react-hooks/purity` | **bug reale** (`Date.now` in render) |
| 2 | `@typescript-eslint/no-empty-object-type` | tipizzazione |
| 2 | `no-useless-escape` | meccanico |
| 2 | `no-empty-pattern` | meccanico |
| 1 | `no-empty` | meccanico |
| 1 | `react-hooks/rules-of-hooks` | **bug reale** (hook condizionale) |
| 1 | `@typescript-eslint/no-unused-expressions` | meccanico |
| 1 | `react-hooks/refs` | falso positivo (safe) |
| 1 | `@typescript-eslint/ban-ts-comment` | meccanico |

---

## 2. Strategia (Ibrido)

- **Degrado a `warn`** (in `eslint.config.js`) le 3 regole ad alto volume che sono debito tecnico stilistico, non bug bloccanti → sblocca subito la CI e rende il debito **visibile ma tracciato**:
  `@typescript-eslint/no-explicit-any` (102), `react-hooks/set-state-in-effect` (11), `react-refresh/only-export-components` (7) → **−120 errori**.
- **Fixo a mano** i restanti **31 errori** (bug logici reali + puliture meccaniche).

Rete di sicurezza: il frontend **non ha test runner** → verifica con `npm run lint` (0 errori) **e** `npm run build` (`tsc -b`).

---

> ✅ **STATO: RISOLTO.** `npm run lint` → exit 0 (0 errori, 127 warning). `npm run build` (`tsc -b && vite build`) → exit 0. Deploy sbloccato.

## 3. TODO

### A. Config ESLint — sblocco (degrado regole rumorose)
- [x] `eslint.config.js`: aggiungere blocco `rules` con `no-explicit-any`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components` → `"warn"`.

### B. Bug logici reali (React Compiler)
- [x] **`App.tsx`** (`static-components` ×2): spostare `RootRedirect` e `AdminRoute` **fuori** dal componente `App` (a livello di modulo) — altrimenti vengono ricreati a ogni render e resettano lo stato.
- [x] **`admin/AdminDashboard.tsx`** (`immutability`): `loadData` usato nell'`useEffect` prima di essere dichiarato → avvolgere in `useCallback` e spostarlo sopra l'effetto.
- [x] **`components/ui/AmountInput.tsx`** (`immutability`): `adjustTextSize` usato nel primo `useEffect` prima di essere dichiarato → spostare la definizione sopra l'effetto.
- [x] **`dashboard/statistics/CumulativeChart.tsx`** (`immutability`): riassegnazione di `cumIncome`/`cumExpense` dentro `.map` → convertire in ciclo `for` nello scope del `useMemo`.
- [x] **`admin/InvitesTable.tsx`** (`purity` ×2): `Date.now()` chiamato in render → sostituire il tick counter con stato `now` aggiornato dall'intervallo.
- [x] **`components/ui/TagBadge.tsx`** (`rules-of-hooks`): `useWalletContext()` chiamato dopo un `return` condizionale → spostare l'hook prima dell'early-return.
- [x] **`modals/subscription/SubscriptionDetailsModal.tsx`** (`refs`): accesso a ref dentro closure `onClick` (safe) segnalato come falso positivo → `eslint-disable-next-line react-hooks/refs` motivato.

### C. Puliture meccaniche
- [x] **`assets/Sphere.tsx`** (`no-empty-object-type` ×2): tipizzare `style` come `React.CSSProperties` e `transition` come `Transition` (framer-motion).
- [x] **`components/ui/AmountInput.tsx`** (`no-useless-escape` ×2): regex `/[\+\-\*/%()]/` → `/[+\-*/%()]/`.
- [x] **`modals/auth/LogoutModal.tsx`** + **`modals/common/DeleteModal.tsx`** (`no-empty-pattern` ×2): `forwardRef(({}, ref)` → `(_props, ref)`.
- [x] **`components/selectors/CurrencySelector.tsx`** (`no-empty` + `no-unused-vars` ×2): `catch (e) {}` → `catch { /* … */ }`.
- [x] **`dashboard/subscription/SubscriptionCalendar.tsx`** (`no-unused-expressions`): `onEditSubscription && onEditSubscription(...)` → `if (onEditSubscription) …`.
- [x] **`modals/wallet/CreateWalletModal.tsx`** (`ban-ts-comment`): `@ts-ignore` → `@ts-expect-error` (o rimozione se non serve).
- [x] **`no-unused-vars` residui** (`catch` senza binding / elisione / param inutile) in:
  `PWAPrompt.tsx`, `ToastNotification.tsx`, `AboutAppModal.tsx`, `UserDashboard.tsx`,
  `ShareSettingsSection.tsx` (×3), `InvitationsModal.tsx`, `PatModal.tsx`, `CategoryCharts.tsx`.

### D. Verifica
- [x] `npm run lint` → **0 errori** (warning ammessi).
- [x] `npm run build` (`tsc -b && vite build`) → OK.

---

## 4. Debito tecnico tracciato (warning, da smaltire in futuro)

Backlog residuo (warning non bloccanti):

1. ✅ **`react-hooks/set-state-in-effect` — RISOLTO (14 → 0), regola a `"error"`.** 7 effetti rifattorizzati (lazy-init / derived-state-in-render / prev-prop pattern) e **4** `eslint-disable` motivati su effetti legittimi (misura DOM, sync `<input>` non-controllato, fetch async). NB: 2 disable in `CustomDatePicker` (case `today` + auto-close) sono risultati **inutilizzati** — la regola non li segnalava più — e sono stati rimossi (vedi §7).
2. ✅ **`no-explicit-any` — RISOLTO (90 → 0).** Regola riportata a `"error"` in `eslint.config.js`. Dettaglio in §5.
3. ✅ **`react-refresh/only-export-components` — RISOLTO (7 → 0).** Regola riportata a `"error"` in `eslint.config.js`. Dettaglio in §6.
4. ✅ **`react-hooks/exhaustive-deps` — RISOLTO (6 → 0), regola a `"error"`.** 2 fix reali + 4 disable motivati (effetti mount/id-scoped). Dettaglio in §7.

> ✅ Tutte le regole del backlog sono risanate e **bloccanti** (`error`) in `eslint.config.js`
> (`no-explicit-any`, `react-refresh/only-export-components`, `set-state-in-effect`, `exhaustive-deps`).
> Lint pulito: **0 errori, 0 warning**.

### Dettaglio risoluzione `set-state-in-effect`

**Rifattorizzati (effetto era un code-smell):**
- `hooks/useMobileMath.ts` — `useState` lazy init per `isMobile`.
- `components/ToDoPage/ToDoPage.tsx` — `useState(() => !!getUserAuth())`, effetto rimosso.
- `utils/PWAContext.tsx` — lazy init di `installPrompt`.
- `dashboard/settings/MemberRow.tsx` — prev-prop pattern (setState in render).
- `components/DataPicker/CalendarContainer.tsx` — prev-prop pattern.
- `modals/TransactionModal/TagPicker/TagPicker.tsx` — prev-prop pattern.
- `modals/TransactionModal/TagPicker/TagPickerAddForm.tsx` — prev-prop pattern.

**Refactor "vero" successivo (con test a copertura):**
- `dashboard/subscription/SubscriptionCalendar.tsx` — era una **memoization travestita da effetto**. Estratta la logica in `buildYearsMap()` (funzione pura in `utils/subscriptionHelper.ts`) e sostituito stato+effetto+cache con un `useMemo`. Coperta da `utils/subscriptionHelper.test.ts` (6 test). **`disable` rimosso.**

**`eslint-disable` motivato (effetto legittimo, falso positivo del React Compiler — confermato da analisi puntuale):**
- `components/icon/IconPickerButton.tsx` — misura DOM (`getBoundingClientRect`): pattern documentato da React (`useLayoutEffect`).
- `components/ui/AmountInput.tsx` (×2) — sync con `<input>` **non-controllato** (sistema esterno).
- `admin/AdminDashboard.tsx` — fetch async al mount (gli setState avvengono dopo `await`).
- `components/DataPicker/CustomDatePicker.tsx` (×2) — derivazione intervallo che **legge il tempo corrente** (`new Date()`): farlo in render violerebbe `react-hooks/purity`.

> **Test runner introdotto** (prima assente): **Vitest + Testing Library** (`vitest.config.ts`, `src/test/setup.ts`, script `npm test`). I file `*.test.*` sono esclusi dal build di produzione (`tsconfig.app.json`).

---

## 5. Epic: eliminare `no-explicit-any` (90 → 0)

Obiettivo: tipizzare tutte le ~90 occorrenze di `@typescript-eslint/no-explicit-any`, poi **riportare la regola a `error`** in `eslint.config.js`. Verifica per ogni sub-task: `npm run lint` (0 errori) + `npm run build` + `npm test`.

Distribuzione per categoria: `catch/error` 37 · `as-any cast` 31 · `prop/var` 11 · `callback/handler` 7 · `collection` 3 · `hook state` 1.

### ST-1 — Gestione errori `catch` (37) 🥇
`catch (err: any)` → `catch (err: unknown)` + `getApiErrorTitle(err, fallback)` (helper già in `utils/apiError.ts`).
- [x] `dashboard/wallet/WalletContext.tsx` (5)
- [x] `auth/OAuthConsent.tsx` (3), `modals/pat/PatModal.tsx` (3)
- [x] `auth/ForgotPassword.tsx` (2), `auth/ResetPassword.tsx` (2), `modals/subscription/SubscriptionDetailsModal.tsx` (2), `register/Register.tsx` (2), `register/Register_old.tsx` (2)
- [x] 1 ciascuno: `AdminDashboard`, `auth/Login`, `auth/LoginForm`, `LandingPage`, `PWAPrompt`, `UserDashboard`, `ShareSettingsSection`, `TransactionsTable`, `TransactionModal`, `ChangePasswordModal`, `ProfileModal`, `SubscriptionModal`, `CreateTagModal`, `CreateWalletModal`, `ShareWalletModal`, `syncService`

### ST-2 — Cast ridondanti su oggetti di dominio (~15) ✅ facile
`(tx as any).originalCurrency` / `(sub as any).*`: i campi multi-valuta (`originalAmount`, `originalCurrency`, `exchangeValue`) **esistono già** su `Transaction`/`Subscription` → rimuovere il cast.
- [x] `modals/TransactionModal/TransactionView.tsx` (6), `modals/subscription/SubscriptionView.tsx` (6)
- [x] `modals/TransactionModal/TransactionModal.tsx` (3), `modals/subscription/SubscriptionModal.tsx` (1, riga 80)

### ST-3 — Globali `window` / PWA install prompt (~8)
Definire `BeforeInstallPromptEvent` + augment di `Window` (`_pwaInstallPrompt`); tipizzare `installPrompt`.
- [x] `utils/PWAContext.tsx` (5), `main.tsx` (2)

### ST-4 — Props/handler tipizzati `any` (~12)
`icon: any` → `IconDefinition`; `onTransactionClick?: (tx: any)` → `(tx: Transaction)`; `tag: Tag | any` → `Tag`; `onClick?/onCancel?: (e: any)` → evento React.
- [x] `components/ui/TagBadge.tsx` (3), `dashboard/settings/MemberCategory.tsx`, `dashboard/settings/MemberRow.tsx`, `dashboard/wallet/WalletTabs.tsx`
- [x] `onTransactionClick`: `SubscriptionCalendar`, `SubscriptionList`, `CalendarDayDetailModal`; `modals/common/ModalDialog.tsx`

### ST-5 — Cast generici `Selector`/`AmountInput` in `SubscriptionModal` (~6)
`val as any` / `setType as any` per le union `frequencyType`/`duration`/`status`/`type` → tipizzare il generico del componente `Selector`.
- [x] `modals/subscription/SubscriptionModal.tsx` (righe 235, 247, 248, 301, 322, 370)

### ST-6 — Collezioni & residui (~12)
`any[]` / `Record<…, any>` e cast vari.
- [x] `utils/offlineDb.ts` (3), `utils/syncService.ts` (as-any), `dashboard/tag/CategoryCharts.tsx` (3), `modals/auth/ProfileModal.tsx` (payload), `api/axiosConfig.ts` (augment `InternalAxiosRequestConfig.isSyncRequest`), `auth/LoginForm.tsx` (`location.state`), `components/selectors/CurrencySelector.tsx`, `dashboard/subscription/SubscriptionList.tsx` (pastTransactions/grouped), `modals/subscription/SubscriptionDetailsModal.tsx` (`actions[]`)

### ST-7 — Chiusura
- [x] Verificato conteggio `no-explicit-any` = 0 → riportare la regola a `"error"` in `eslint.config.js`.

> ✅ **EPIC COMPLETATO (90 → 0).** `npm run lint` (con la regola a `error`) → exit 0 · `npm run build` → exit 0 · `npm test` → 6/6.
>
> **Artefatti condivisi introdotti:**
> - `utils/apiError.ts` — helper per `catch (err: unknown)`: `getApiErrorTitle`, `getApiErrorDetail`, `getApiErrorStatus`, `isReplayError`, `isAbortError`.
> - `types/pwa.ts` — `BeforeInstallPromptEvent` + augment di `Window._pwaInstallPrompt`.
> - `types/axios.ts` — augment di `AxiosRequestConfig.isSyncRequest`.
>
> **Esecuzione:** ST-1 (37 `catch`) parallelizzato su 4 subagent per gruppi di file disgiunti; ST-2…ST-6 a mano con verifica `tsc` continua.

---

## 6. `react-refresh/only-export-components` (7 → 0)

Fast Refresh richiede che un file `.tsx` esporti **solo componenti**: hook/funzioni/costanti/Context
mescolati a un componente rompono l'hot-reload. **Strategia a minima-churn:** l'export ad alto
fan-out resta nel file originale (import dei consumer invariati), si sposta l'export a basso fan-out.

- [x] **Context** — l'hook `useXxx` (molti consumer) resta nel file originale, il **Provider** (1 consumer) esce in un file dedicato. Il file originale, senza più componenti, esporta liberamente Context + hook.
  - `utils/ThemeContext.tsx` (hook, 9 consumer) → nuovo `utils/ThemeProvider.tsx`; import in `App.tsx`.
  - `utils/PWAContext.tsx` → nuovo `utils/PWAProvider.tsx`; import in `App.tsx`.
  - `modals/common/DeleteModalContext.tsx` → nuovo `modals/common/DeleteModalProvider.tsx`; import in `App.tsx`.
  - `dashboard/wallet/WalletContext.tsx` (hook, 20 consumer) → nuovo `dashboard/wallet/WalletProvider.tsx`; import in `WalletDashboard.tsx`.
- [x] **`components/ui/ToastNotification.tsx`** — `triggerToast` (28 consumer) + bus di eventi restano nel file (declassato a modulo non-componente); il componente esce in `components/ui/ToastHost.tsx` (registrazione via `registerToastHandler`). Solo `App.tsx` aggiornato.
- [x] **`components/auth/PasswordRequirements.tsx`** — funzioni pure `getPasswordRequirements`/`isPasswordValid` spostate in `components/auth/passwordRequirements.ts`; componente lasciato solo. 3 consumer aggiornati.
- [x] **`dashboard/wallet/WalletContext.tsx`** — la costante `VALID_TABS` (+ `TabType`) esportata accanto a Context+hook rialzava la regola (2 warning residui); estratta in `dashboard/wallet/walletTabs.ts`. Consumer: `WalletProvider`, `WalletTabs`.

> ✅ **RISOLTO (7 → 0).** Regola a `"error"` in `eslint.config.js`. `npm run lint` → exit 0 (6 warning residui, tutti `exhaustive-deps`) · `npm run build` → exit 0 · `npm test` → 6/6.
>
> Nessun cambiamento di comportamento a runtime: solo riorganizzazione dei moduli. Per il toast, la separazione componente/bus preserva lo stato condiviso (`toastEvent`) via `registerToastHandler`, che azzera l'handler solo se è ancora il proprio (safe su remount/fast-refresh).

---

## 7. `react-hooks/exhaustive-deps` (6 → 0)

Analizzati caso per caso: **fix reale** dove la dipendenza mancante era un bug/odore,
**disable motivato** dove l'effetto è intenzionalmente mount/id-scoped e includere le
dipendenze cambierebbe il comportamento (refetch spurii, chiusure indesiderate).

**Fix reali (2):**
- [x] **`dashboard/settings/ShareSettingsSection.tsx`** — `fetchMembers` (usato anche in `handleInvite`) avvolto in `useCallback([wallet.id])` e spostato sopra l'effetto (evita la TDZ nella dep array); effetto → `[fetchMembers]`. Ricarica correttamente al cambio wallet.
- [x] **`components/selectors/CurrencySelector.tsx`** — warning *ref-in-cleanup*: `popoverRef.current` copiato in una const locale (`popover`) all'avvio dell'effetto e usato sia in setup sia in cleanup (il nodo è stabile finché montato).

**Disable motivati (4):**
- [x] **`auth/OAuthConsent.tsx`** — init one-shot al mount: valida i parametri OAuth (derivati dall'URL, stabili) e carica token/wallet una volta.
- [x] **`dashboard/UserDashboard.tsx`** — caricamento wallet una tantum al mount; il redirect è gestito da un effetto separato.
- [x] **`components/DataPicker/CustomDatePicker.tsx`** — `isOpen` escluso di proposito: l'auto-close deve reagire solo a una nuova selezione di data, non all'apertura (altrimenti richiuderebbe subito il picker).
- [x] **`dashboard/wallet/WalletProvider.tsx`** — reset+reload solo al cambio `_wallet.id`; non ri-eseguire su altri campi di `_wallet` né sull'identità di `fetchData`.

> ✅ **RISOLTO (6 → 0).** In più: rimossi 2 `eslint-disable react-hooks/set-state-in-effect` in `CustomDatePicker` risultati **inutilizzati** (la regola non li segnalava più) → `set-state-in-effect` riportata a `"error"`.
>
> **Stato finale gate lint:** `npm run lint` → **exit 0, 0 errori, 0 warning** · `npm run build` → exit 0 · `npm test` → 6/6. Tutte le regole del backlog (`no-explicit-any`, `react-refresh/only-export-components`, `set-state-in-effect`, `exhaustive-deps`) sono `error`.
