# Wallet Slug URL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrare nell'URL della dashboard uno slug leggibile `nome-del-wallet-<ultimi5uuid>` al posto dell'UUID grezzo, mantenendo l'unicità e la retrocompatibilità con i vecchi link.

**Architecture:** Un nuovo helper `walletSlug.ts` genera lo slug canonico. `UserDashboard.tsx` costruisce i link con l'helper, risolve lo slug → wallet sulla lista già in memoria (match esatto per retrocompatibilità, poi per suffisso), e riscrive l'URL nella forma canonica. Nessuna modifica a backend, route, `WalletsBar` o `WalletContext`.

**Tech Stack:** React 19 + TypeScript, react-router-dom, Vitest + Testing Library.

## Global Constraints

- Frontend gira da `frontend/`. Comandi: `npm test` (Vitest run-once), `npm run lint`, `npm run build`.
- I test frontend NON sono in CI (gate solo lint/build), ma vanno scritti e fatti passare localmente.
- Stile test esistente: `import { describe, it, expect } from "vitest";` — file `*.test.ts` accanto al sorgente.
- La route resta `/dashboard/:walletId?`; cambia solo il contenuto del parametro (ora uno slug).
- Suffisso UUID = ultimi 5 caratteri della stringa id (`id.slice(-5)`).
- Slugify: minuscolo, accenti rimossi, non-alfanumerici → singolo `-`, trim dei `-`, fallback `"wallet"` se vuoto.

---

### Task 1: Helper `walletSlug` con test

**Files:**
- Create: `frontend/src/utils/walletSlug.ts`
- Test: `frontend/src/utils/walletSlug.test.ts`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `slugify(name: string): string`
  - `walletSlug(wallet: { id: string; name: string }): string` → `` `${slugify(wallet.name)}-${wallet.id.slice(-5)}` ``

- [ ] **Step 1: Write the failing test**

File `frontend/src/utils/walletSlug.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { slugify, walletSlug } from "./walletSlug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("La Mia Carta")).toBe("la-mia-carta");
  });

  it("strips accents/diacritics", () => {
    expect(slugify("Però Città")).toBe("pero-citta");
  });

  it("collapses non-alphanumerics into a single hyphen and trims", () => {
    expect(slugify("  Carta   €$ Prepagata!! ")).toBe("carta-prepagata");
  });

  it("falls back to 'wallet' when the cleaned name is empty", () => {
    expect(slugify("€€€")).toBe("wallet");
    expect(slugify("   ")).toBe("wallet");
  });
});

describe("walletSlug", () => {
  it("joins slugified name with the last 5 chars of the id", () => {
    expect(
      walletSlug({ id: "123e4567-e89b-12d3-a456-42661417a4f9c", name: "La Mia Carta €" }),
    ).toBe("la-mia-carta-a4f9c");
  });

  it("uses the 'wallet' fallback for symbol-only names", () => {
    expect(walletSlug({ id: "aaaaabbbbbcccccddddda4f9c", name: "€€€" })).toBe(
      "wallet-a4f9c",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/utils/walletSlug.test.ts`
Expected: FAIL — modulo `./walletSlug` non trovato / export mancanti.

- [ ] **Step 3: Write minimal implementation**

File `frontend/src/utils/walletSlug.ts`:

```ts
/**
 * Converte un nome wallet in uno slug URL-safe:
 * minuscolo, accenti rimossi, sequenze non-alfanumeriche -> singolo trattino,
 * trim dei trattini. Fallback "wallet" se il risultato è vuoto.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove i diacritici
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "wallet";
}

/** Slug canonico di un wallet: `nome-<ultimi5uuid>`. */
export function walletSlug(wallet: { id: string; name: string }): string {
  return `${slugify(wallet.name)}-${wallet.id.slice(-5)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- src/utils/walletSlug.test.ts`
Expected: PASS (6 test verdi).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/walletSlug.ts frontend/src/utils/walletSlug.test.ts
git commit -m "feat(frontend): helper walletSlug per URL leggibili"
```

---

### Task 2: Usare lo slug in `UserDashboard.tsx`

**Files:**
- Modify: `frontend/src/dashboard/UserDashboard.tsx`

**Interfaces:**
- Consumes: `walletSlug` da `../utils/walletSlug` (Task 1).
- Produces: niente di riusato da altri task (task finale).

Questo task non ha unit-test dedicati (logica di routing su componente con
`useParams`/`useNavigate`); la verifica è manuale + `lint`/`build`. Le modifiche
sono piccole e localizzate.

- [ ] **Step 1: Importare l'helper**

In cima al file, dopo gli import esistenti, aggiungere:

```ts
import { walletSlug } from "../utils/walletSlug";
```

- [ ] **Step 2: Risoluzione slug → wallet (retrocompat + suffisso)**

Sostituire la riga:

```ts
  const selectedWallet = wallets.find((w) => w.id === walletId) || null;
```

con:

```ts
  // Risolve lo slug URL (`nome-<ultimi5uuid>`) verso un wallet della lista.
  // 1) match esatto sull'id -> retrocompatibilità con vecchi link full-UUID.
  // 2) match sul suffisso -> ultimo segmento dello slug == ultimi 5 char dell'id.
  const resolveWallet = (param: string | undefined): Wallet | null => {
    if (!param) return null;
    const exact = wallets.find((w) => w.id === param);
    if (exact) return exact;
    const suffix = param.split("-").pop();
    return wallets.find((w) => w.id.slice(-5) === suffix) || null;
  };

  const selectedWallet = resolveWallet(walletId);
```

- [ ] **Step 3: Link canonici nelle 3 `navigate`**

Nel redirect iniziale (`fetchData`), sostituire:

```ts
        navigate(`/dashboard/${targetId}`, { replace: true });
```

con:

```ts
        const target = fetchedWallets.find((w) => w.id === targetId);
        if (target)
          navigate(`/dashboard/${walletSlug(target)}`, { replace: true });
```

Nell'effetto di gestione cancellazione, sostituire:

```ts
      navigate(`/dashboard/${wallets[0].id}`, { replace: true });
```

con:

```ts
      navigate(`/dashboard/${walletSlug(wallets[0])}`, { replace: true });
```

In `handleChangeWallet(id)`, sostituire il corpo:

```ts
  function handleChangeWallet(id: string) {
    navigate(`/dashboard/${id}`);
  }
```

con:

```ts
  function handleChangeWallet(id: string) {
    const w = wallets.find((wallet) => wallet.id === id);
    navigate(`/dashboard/${w ? walletSlug(w) : id}`);
  }
```

- [ ] **Step 4: Canonicalizzazione dell'URL**

Aggiornare l'effetto che gestisce la sparizione del wallet selezionato (quello
con dipendenze `[walletId, wallets, loading, navigate]`) affinché gestisca anche
la riscrittura verso lo slug canonico. Sostituire l'intero effetto:

```ts
  // Deletion handling: se il wallet selezionato sparisce, naviga al primo disponibile
  useEffect(() => {
    if (
      !loading &&
      wallets.length > 0 &&
      walletId &&
      !wallets.find((w) => w.id === walletId)
    ) {
      navigate(`/dashboard/${wallets[0].id}`, { replace: true });
    }
  }, [walletId, wallets, loading, navigate]);
```

con:

```ts
  // Gestisce due casi sul cambio di walletId/lista:
  // - il wallet risolto ha uno slug diverso dal param (vecchio UUID o nome
  //   cambiato) -> riscrive l'URL nella forma canonica (replace).
  // - il param non risolve alcun wallet (es. cancellato) -> naviga al primo.
  useEffect(() => {
    if (loading || wallets.length === 0 || !walletId) return;
    const current = resolveWallet(walletId);
    if (current) {
      const canonical = walletSlug(current);
      if (walletId !== canonical)
        navigate(`/dashboard/${canonical}`, { replace: true });
    } else {
      navigate(`/dashboard/${walletSlug(wallets[0])}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId, wallets, loading, navigate]);
```

(Nota: `resolveWallet` è una closure ricreata a ogni render ma stabile in
comportamento; disabilitiamo `exhaustive-deps` come già fatto per l'effetto di
mount, per non ri-triggerare inutilmente.)

- [ ] **Step 5: Verifica lint + build**

Run:
```bash
cd frontend && npm run lint && npm run build
```
Expected: nessun errore ESLint, build TypeScript OK.

- [ ] **Step 6: Verifica manuale**

Run: `cd frontend && npm run dev`, poi nel browser:
- aprire `/dashboard` → redirect a `/dashboard/<nome>-<5char>`.
- cliccare un altro wallet nella `WalletsBar` → URL aggiornato allo slug corrispondente, dashboard corretta.
- aprire manualmente un vecchio link `/dashboard/<uuid-completo>` → risolve il wallet giusto e riscrive l'URL allo slug.
- rinominare un wallet e riaprire un vecchio slug → risolve per suffisso e riscrive col nuovo nome.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/dashboard/UserDashboard.tsx
git commit -m "feat(frontend): URL dashboard con slug leggibile del wallet"
```

---

## Self-Review

- **Spec coverage:** helper+slugify (Task 1); costruzione link, risoluzione con retrocompat+suffisso, canonicalizzazione (Task 2); fuori-ambito rispettato (nessun tocco a backend/route/WalletsBar/WalletContext). ✓
- **Placeholder scan:** nessun TBD/TODO; tutto il codice è mostrato. ✓
- **Type consistency:** `slugify`/`walletSlug` firme identiche fra Task 1 e Task 2; `resolveWallet` definita e usata coerentemente in Task 2; `Wallet` è già importato in `UserDashboard.tsx`. ✓
```