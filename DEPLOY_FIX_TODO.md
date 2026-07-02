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

1. ✅ **`react-hooks/set-state-in-effect` — RISOLTO (14 → 0).** 7 effetti rifattorizzati (lazy-init / derived-state-in-render / prev-prop pattern) e 7 `eslint-disable` motivati su effetti legittimi (misura DOM, sync `<input>` non-controllato, fetch async, cache stateful, derivazione date). Regola riportabile a `error` in `eslint.config.js`.
2. **`no-explicit-any` (~92)** — tipizzare progressivamente, partendo da `catch (err)` → `unknown` + narrowing e dai payload API.
3. **`react-refresh/only-export-components` (7)** — separare hook/costanti dai file dei Context.
4. **`react-hooks/exhaustive-deps` (6)** — completare le dependency array.

> ⚠️ Nota: quando queste regole verranno risanate, riportarle a `error` in `eslint.config.js`.

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
