# Kickoff prompt — SETTINGS redesign (copy into a new session)

## Obiettivo di questa sessione: la sezione SETTINGS (redesign quasi TOTALE)
La tab Settings ha MOLTI sotto-elementi e sono TUTTI da rifare quasi da zero (modifiche
pesanti, non semplice migrazione token). Vanno ridisegnati e modificati TUTTI gli elementi.
Le scelte grafiche si definiscono PIAN PIANO, un elemento per volta.

Prima leggi per contesto:
- `.claude/TODO/ui-redesign.md`        → sezione "## 7. Settings" (+ le regole cross-cutting)
- `frontend/style.md`                  → style guide (token app-*, primitive, do/don't)
- `.claude/TODO/statistics-redesign.md`→ come è stata condotta la sezione precedente (metodo)

## File coinvolti (TUTTI da rifare) — `frontend/src/`
Backbone condivisa:
- `components/settings/SettingsCard.tsx`  → **shell/card condivisa** usata da OGNI sezione
  (title/subtitle/icon, action button opzionale con loading/disabled, variante `danger`,
  `headerCentered`, `description`). 10 `theme-*`, action button hand-rolled. È la base del look:
  probabilmente va ridisegnata (o estratta come primitiva `Card`) PER PRIMA perché tutto la usa.

Tab e sezioni (`dashboard/settings/`):
- `SettingsTab.tsx`         → composizione tab + card **General Settings** (IconPickerButton per
  icona/colore + `<input>` nome hand-rolled, con label commentate morte) + **Danger Zone**
  (Delete Wallet se OWNER / Quit Wallet altrimenti).
- `DataTab.tsx`            → **Data Management**: export Transactions.csv / Tags.csv, import CSV
  (placeholder, "backend needed"). 2 `<button>` export hand-rolled + `<input type=file>`.
  Nota: usa `text-app-sky` (verificare che il token esista).
- `ShareSettingsSection.tsx`→ carica i membri via API `/invitations/:walletId`, li raggruppa
  (owners/editors/viewers/pending) e rende InviteSection (solo OWNER) + card **Wallet Members**
  con i MemberCategory. Ha `theme-text-subtle` (loading) e `theme-text-warning-muted` (pending).
  Commenti in ITALIANO da tradurre. `window.confirm` per la rimozione membro.
- `InviteSection.tsx`      → **Invite People** (solo OWNER): `<input>` username/email hand-rolled
  (`type=search`) + `Selector` ruolo (Viewer/Editor) + azione Send Invite (accent = wallet.color).
  Usa `theme-bg-primary-light`/`theme-bg-warning-light`/`theme-text-warning`. Commenti IT.
- `MemberCategory.tsx`     → gruppo titolato (title/icon/iconColor) di MemberRow.
- `MemberRow.tsx`          → riga singolo membro (avatar/nome, ruolo, cambio ruolo, rimozione).
  6 `theme-*`, 2 `<button>` hand-rolled.

## Come procedere (IMPORTANTE — è il flusso richiesto)
1. **PRIMA: analisi.** Leggi TUTTI i file sopra. Mappa struttura/gerarchia, il modello RBAC
   (OWNER/EDITOR/VIEWER), cosa fa ogni elemento e le sue dipendenze (IconPickerButton,
   WalletContext: `handleUpdateWallet`/`onWalletDelete`, API invitations, DeleteModal/ConfirmModal,
   ResponsiveOverlay). Riassumi in chat cosa c'è e cosa proponi di rifare.
2. **/brainstorming** prima di scrivere codice. Convergi su: ordine degli elementi + eventuale
   estrazione di una primitiva `Card` condivisa dal `SettingsCard`.
3. **Poi si definisce la grafica ELEMENTO PER ELEMENTO.** Per OGNI elemento, nell'ordine:
   a. **PROPONI il design grafico IN CHAT** — mockup ASCII / descrizione visiva strutturata, così
      lo posso VISUALIZZARE prima di implementare (mostra layout, gerarchia, stati, varianti RBAC).
   b. **CHIEDIMI conferma** sulla grafica di QUEL elemento (offri 1-2 varianti se ha senso).
   c. **Implementa** solo quell'elemento.
   d. **Verifica verde** (comando sotto).
   e. **Passa al successivo.**
4. Un elemento per volta, sempre con il mio OK. Niente sweeping changes senza sign-off.
5. Scrivi/mantieni `.claude/TODO/settings-redesign.md` con la checklist degli elementi + decisioni.

## Vincoli fermi
- Redesign pesante (quasi tutto rifatto) MA **preserva il comportamento**: RBAC e gating dei ruoli,
  save/delete/quit wallet, invite/remove/change-role, export CSV, import placeholder, toast.
- **English only** (copy UI e commenti). Traduci i commenti italiani esistenti.
- Usa i **token app-*** (niente `theme-*`/`--color-*`). Accent dentro il wallet = `wallet.color`.
- **Riusa/estendi le primitive** in `components/ui/` (Button, Input, SearchInput, CustomSelect,
  Toggle, Selector, ResponsiveOverlay, …): sostituisci TUTTI i `<button>`/`<input>` hand-rolled.
  Se manca una primitiva (es. `Card`), creala in `components/ui/` (non inline).
- Valuta di sostituire `window.confirm` (rimozione membro) con `ConfirmModal`/`DeleteModal`
  (coerenza col resto del redesign) — chiedimi prima.
- **NON killare il dev server** (gira `npm run dev` su :5173 tra i turni).
- **Branch:** siamo su `feat/redesign`. Chiedimi il branch base PRIMA di committare; commit solo se
  te lo chiedo; il merge lo faccio io. Mai commit diretto su main/release.
- **MUI license:** DECISA → si tiene l'hack CSS del watermark; NON toccarlo (comunque Settings non
  usa chart).
- Sto rifattorizzando in parallelo altri file nell'IDE: potrei toccare file aperti senza segnalarlo;
  se un check fallisce su un file fuori scope, verifica se è mio prima di "aggiustarlo".

## Verifica sempre verde (dopo ogni elemento)
```
cd frontend && npm run lint && npx tsc -b && npm run build
```

## Contesto: lavori recenti già FATTI
- **Statistics tab** appena completata (summary row `StatisticsSummary` + migrazione token +
  theming chart con tinte soft; l'utente preferisce le tinte soft 400 alle 500 semantiche).
- Primitive disponibili + `ResponsiveOverlay` (drawer desktop / full-screen mobile),
  `ConfirmModal`/`DeleteModal`, `CategoryManagerDrawer` (pattern drawer ad albero) come reference.
