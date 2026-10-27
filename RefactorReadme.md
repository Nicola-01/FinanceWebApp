# Frontend restructure — notte del 2026-10-27

Branch: `refactor/frontend-restructure` (da `main` aggiornato + merge di `release/v3.7.2`).
**Niente push.** Piano di riferimento: `.claude/TODO/frontend-restructure.md`.

## Cosa è stato fatto

| Fase | Stato | Note |
|---|---|---|
| 1 — Codice morto | ✅ | 1.1–1.9 + sweep con `knip` (solo lettura, non aggiunto alle dipendenze) |
| 2 — Spostamenti/rinomine | ✅ | 2.1–2.9, tutti con `git mv` |
| 3 — Commenti in inglese | ✅ | nessun commento italiano rimasto in `frontend/src` |
| 4 — Basi condivise | ✅ | 4.1–4.6 in sequenza, 4.7–4.12 in parallelo (worktree). Gate sul branch unito: 145 file / 983 test |
| 5 — Split per area | ✅ | 9 subagent in parallelo (5A–5I). Gate sul branch unito: 191 file / 1171 test. Saltati con motivo: 5C.2, 5D.5, 5F.3 (obsoleto), 5G.3, 5H.3, 5I.9 |
| 4 (resto) | ✅ | Fatto `modals/pat/walletPerms.ts` (dedup permessi PAT). **Saltati di proposito** `useCopyToClipboard`, `IconButton`, `BulkActionBar`, `SectionHeader`, `Skeleton`, `StatChip`: le copie hanno classi diverse o un solo chiamante, un primitivo avrebbe cambiato l'aspetto o passato solo className. Se vuoi unificarli serve una scelta visiva tua (iniziativa "adozione primitivi" di ui-redesign) |
| 6 — Wizard + axiosConfig | ✅ | 6.1–6.5, 6.7 fatti (alcune parti saltate con motivo nel piano); 6.6 saltato. `StagedSubscriptionRow` 369 → 152 righe, ora con test. **Test flaky di `CreateWalletWizard` risolto** (mock di `fetchTagSources` nel test) |
| 7 — Follow-up | ⛔ | Non fatta: il piano la segna fuori scope salvo tua decisione |

**Gate finale sul branch** (2 esecuzioni consecutive): lint ok · **198 file / 1202 test** passati (prima del refactor: 133 / 955) · build ok.
**Totale:** 102 commit (più i merge), `frontend/src` +17.4k / −12.9k righe, di cui +4.6k nei test.
`graphify update .` eseguito e committato.

### File più grossi prima → dopo
| File | Prima | Dopo |
|---|---|---|
| `CategoryManagerDrawer.tsx` | 687 | 199 |
| `TokensSection.tsx` | 573 | ~230 |
| `SystemTab.tsx` | 486 | 81 |
| `DataTab.tsx` | 454 | 198 |
| `WidgetGrid.tsx` | 437 | 134 |
| `AmountInput.tsx` | 397 | ~100 |
| `WalletProvider.tsx` | 390 | 143 |
| `CsvFormatModal.tsx` | 398 | 245 |
| `SecuritySection.tsx` | 270 | 25 |

**Nessun test visivo nel browser** è stato fatto: l'invarianza si basa su markup copiato
verbatim + test esistenti (tutti passati senza modifiche) + nuovi test sulle parti estratte.
Ti consiglio un giro manuale su: drag&drop categorie e widget, date picker mobile (`<dialog>`),
grafici statistiche, flusso CSV import, OAuth consent, schermate auth.

## Decisioni per te (non le ho prese io)

### Dipendenze npm inutilizzate (F22) — non rimosse
- `react-date-range` — zero import
- `@types/react-color` — l'app usa `@uiw/react-color`
- `autoprefixer`, `postcss` — nessuna config postcss
- `ts-morph` — usato solo da `frontend/refactor.ts` (vecchio codemod one-off, F21: cancellabile?)

### Convenzioni
- **F19** — ~45 `export default X` ridondanti accanto agli export nominati: toglierli?
- **F20** — tipi esportati che nessuno importa (props/varianti dei componenti UI).
- **F23** — `TokenListItem`: la vecchia modalità `onClick`/`disabled`/`showCopy`/`onCopy` è usata solo dai suoi test.
- **F24** — altri file di piano citano ancora i vecchi percorsi (`.claude/TODO/{i18n,ui-redesign,interactive-onboarding}.md`, `DEPLOY_FIX_TODO.md`, `frontend/TOAST_AUDIT_TODO.md`).
- **F25** — `{/*<CalendarIcon …/>*/}` commentato in `components/datePicker/CustomDatePicker.tsx`.
- **4.12** — il piano chiedeva un `index.ts` barrel per `utils/tabLayout/`; non creato (7 importer, aggiornati direttamente).

### Possibili bug trovati (comportamento preservato, non corretto)
- `getDaysLeftText` (subscriptionHelper): il 31 gennaio, una scadenza al 28 febbraio mostra "1 month left" invece di "28 days left" (regole date-fns di fine mese). I nuovi test fissano il comportamento attuale.
- `getDaysLeftColor`: rami ridondanti (per le spese sia `>=4` che `>=2` → `text-app-yellow`).
- `CumulativeChart`/`MonthlySnapshotChart` hard-codano il fallback zoom `[{start:0,end:100}]` = `recentMonthsZoom(0)`.
- **Offline sync** (5E): `useWalletMutations` aggiorna tag/wallet sullo stato server grezzo, non sull'overlay → modificare/cancellare un tag *creato offline* manda `updatedAt: null`. Comportamento preesistente, da verificare col design offline.
- `CategoryTrendChart` e `CategoryHeatmapChart` mostrano Income/Expenses in ordine opposto (preservato con prop `expenseFirst`): allinearli?
- `AmountMathToolbar` (pulsante "="): classi legacy `theme-*` + glow colorato `shadow-[0_0_15px_…]` → viola style.md.
- `useAmountInput`: `hadSign ? 1 : 1` (sempre 1, inutile; tenuto per invarianza).
- Locale hard-coded: `formatDateHeader` (`en-GB`), `formatMonthLabel` (`en-US`), `UserRow` (`en-UK`) — da risolvere con il piano i18n.
- `IconAction` (settings/account) ha una prop `danger` mai usata.

### Wizard (Fase 6)
- **`MOCK_SOURCE_WALLETS`** (tua decisione, già nel TODO del wizard): il wizard passa sempre il vero `fetchTagSources()`, quindi il mock e il parametro di default in `TagsStep` si attivano solo se `TagsStep` è renderizzato senza `sourceWallets`. Cancellarli è sicuro in produzione, ma potrebbe toccare test di `TagsStep`.
- **F18 ancora aperto — probabile bug:** `toSubscriptionRequest` manda come `startDate` il giorno **UTC**, non quello locale (dopo mezzanotte in Italia nelle prime ore → giorno sbagliato). Fix di una riga: `toLocalIsoDate(new Date())`.
- `parseLocalIsoDate` per date non `YYYY-MM-DD` (es. CSV malformato) fa fallback a `new Date(s)` invece di "Invalid Date" come la vecchia copia nel wizard. Le date ISO valide sono identiche.
- `useOutsideClick` accetta un solo ref; per coppie trigger+popover (`BasicsStep`) un'estensione a più ref sarebbe più pulita.
- Il payload PAT (`walletPermissions: selected.map(...)`) è ancora duplicato tra `useTokenDialog` e `useOAuthAuthorize`; il tipo `"none" | "read" | "write"` è scritto 4 volte.

### Piccole differenze di comportamento introdotte (volute, invisibili)
- 5D: gli export CSV ora liberano il blob URL (`URL.revokeObjectURL`) come già faceva il download dei sample.
- 5F.2: `TransactionModal` in modifica leggeva `tx.tag.name` (crash se il tag manca) → ora `tag?.name || ""` come `SubscriptionModal`.
- 5F.8: `SubscriptionModal` non è più annidato dentro `TransactionView` ma fratello del dettaglio (stesso portal su `<body>`).
- 5E.1: il filtro transazioni è una funzione pura in `useMemo` invece che dentro l'hook, per non cambiare l'ordine degli effect.

### Test flaky (preesistente) — risolto
`CreateWalletWizard.test.tsx` a volte generava `EnvironmentTeardownError` sotto carico: il test chiamava il
vero `fetchTagSources`, la richiesta finiva nella cache offline e Dexie (IndexedDB assente in jsdom) loggava
dopo la fine del test. Risolto in `c9bc4ee` mockando `sourceWallets` nel test; codice app invariato.

## Cosa NON ho fatto
- **Niente push**, niente PR. Il branch è solo locale: `refactor/frontend-restructure`.
- Nessun test visivo nel browser (vedi sopra le schermate da controllare a mano).
- Non ho toccato dipendenze npm, `frontend/refactor.ts`, `MOCK_SOURCE_WALLETS`, né i bug segnalati sopra.
- Il file vuoto `db_backup_2026-10-27_03-00.sql` (0 byte, creato alle 02:59) nella root **non è mio**: probabilmente il job di backup locale; non committato.
- Le tue modifiche non committate sono ancora lì intatte (vedi sotto).

## Prossimi passi suggeriti
1. Giro manuale nel browser (`npm run dev`) sulle schermate elencate.
2. Decidere i punti sopra (dipendenze, F19 default export, MOCK, F18).
3. Merge del branch in una release.
4. Poi, se vuoi, il piano i18n: ora `utils/format.ts` esiste già (task 4.1), quindi l'i18n parte da lì.

## Le tue modifiche non committate
Lasciate intatte nel working tree: `useNotifications.ts` (+ test), `.claude/TODO/walletEncryptionTODO.md`,
`.claude/TODO/open-banking-followups.md`, `OpenBankingReadme.md`.
Nota: in Fase 3 prettier ha riformattato anche `useNotifications.*` — controlla.
