# Wallet slug leggibile nell'URL

**Data:** 2026-07-03
**Ambito:** frontend

## Obiettivo

Mostrare nell'URL della dashboard il **nome del wallet** al posto dell'UUID grezzo,
mantenendo l'unicità (un utente può avere più wallet con lo stesso nome) per
consentire di salvare il link come preferito.

Formato slug: `slugify(nome)-<ultimi 5 caratteri dell'uuid>`.

Esempio: wallet "La Mia Carta €" con id `...-...-...-...-...a4f9c`
→ `/dashboard/la-mia-carta-a4f9c`

## Stato attuale (analisi)

- La route è `/dashboard/:walletId?` in `src/App.tsx`.
- Il parametro `walletId` viene consumato **solo** in `src/dashboard/UserDashboard.tsx`.
  Le chiamate API usano `selectedWallet.id` (dall'oggetto wallet), **non** il
  parametro URL. Quindi il parametro serve unicamente a selezionare il wallet
  dalla lista già caricata.
- I link vengono costruiti in 3 `navigate` dentro `UserDashboard.tsx`:
  - riga ~48: redirect iniziale quando manca il param
  - riga ~73: redirect quando il wallet selezionato sparisce (es. cancellato)
  - riga ~92: `handleChangeWallet` (cambio wallet dalla `WalletsBar`)
- Il matching attuale: `wallets.find((w) => w.id === walletId)`.
- `WalletsBar` e `WalletContext` non usano il parametro URL: ricevono l'oggetto
  wallet / l'id derivato dalla lista, quindi non vanno modificati.

L'impatto è perciò confinato a `UserDashboard.tsx` più un nuovo helper.

## Design

### 1. Helper `src/utils/walletSlug.ts` (nuovo)

```ts
// slugify: minuscolo, accenti rimossi, non-alfanumerici -> singolo trattino, trim.
// Fallback "wallet" se il nome pulito è vuoto.
export function slugify(name: string): string { ... }

// walletSlug: slug canonico completo per un wallet.
export function walletSlug(wallet: { id: string; name: string }): string {
  return `${slugify(wallet.name)}-${wallet.id.slice(-5)}`;
}
```

Regole di `slugify`:
- `toLowerCase()`
- `normalize("NFD")` + rimozione diacritici (`/[̀-ͯ]/g`): "Però" → "pero"
- ogni sequenza di caratteri non `[a-z0-9]` → singolo `-`
- rimozione trattini iniziali/finali
- se il risultato è stringa vuota → `"wallet"`

### 2. Risoluzione slug → wallet (in `UserDashboard.tsx`)

Sulla lista `wallets` già caricata, dato il parametro `walletId` (ora uno slug):

1. **Match esatto sull'id**: `wallets.find(w => w.id === param)` — retrocompatibilità
   con i vecchi link `/dashboard/<uuid-completo>` già salvati come preferiti.
2. Altrimenti **match sul suffisso**:
   `const suffix = param.split("-").pop(); wallets.find(w => w.id.slice(-5) === suffix)`.
   (L'ultimo segmento dello slug è sempre il suffisso dell'id, perché è appeso
   dopo un `-` alla parte-nome già slugificata.)
3. Nessun match → comportamento attuale invariato (redirect al primo wallet /
   schermata "No wallets found").

In caso di collisione residua (due wallet con stesso slug **e** stessi ultimi 5
caratteri di UUID — praticamente impossibile) si seleziona il primo match.
Nessuna logica extra (YAGNI).

### 3. Costruzione dei link

Le 3 `navigate` in `UserDashboard.tsx` usano `walletSlug(wallet)` invece dell'id
grezzo. `selectedWalletId` passato a `WalletsBar` resta l'`id` del wallet
risolto (la barra confronta per id, non per slug), quindi non cambia.

### 4. Canonicalizzazione

Se il wallet viene risolto ma il parametro URL **non** è già lo slug canonico
(caso: vecchio link full-UUID, oppure nome del wallet cambiato dopo il salvataggio
del preferito), riscrivere l'URL con `navigate(walletSlug(wallet), { replace: true })`.
Così l'address bar mostra sempre il nome aggiornato senza aggiungere voci alla
cronologia.

## Fuori ambito

- Nessuna modifica al backend.
- Nessuna modifica alla definizione della route (`/dashboard/:walletId?` resta;
  cambia solo il contenuto del parametro).
- Nessuna modifica a `WalletsBar`, `WalletContext`, `WalletDashboard`.

## Testing

- Vitest per `walletSlug.ts` (accanto al sorgente):
  - `slugify`: spazi/maiuscole/accenti/simboli, nome vuoto o solo-simboli → `"wallet"`,
    trattini multipli collassati, trim.
  - `walletSlug`: formato `nome-suffisso`, suffisso = ultimi 5 char dell'id.
- I test frontend non sono in CI (gate solo lint/build), ma i test vanno comunque
  scritti e fatti passare localmente. Verificare `npm run lint` e `npm run build`.

## File toccati

- `src/utils/walletSlug.ts` — **nuovo** (helper).
- `src/utils/walletSlug.test.ts` — **nuovo** (test).
- `src/dashboard/UserDashboard.tsx` — usa `walletSlug()`, risoluzione e canonicalizzazione.
