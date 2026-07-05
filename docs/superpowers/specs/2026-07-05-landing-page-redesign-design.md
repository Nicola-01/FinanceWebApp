# Landing Page Redesign — Design Spec

**Date:** 2026-07-05
**Scope:** Full rewrite of the public landing page (`frontend/src/components/LandingPage/*`).
**Nature:** Frontend-only. No backend changes. No changes to `/login`, `/ToDo`, or the wallet wizard.

---

## 1. Goal & framing

Completely redo the landing page as a **hybrid** page: product-grade polish and
benefit-led messaging, but keeping the honest voice of a **solo-built, open-source,
continuously-improving** personal-finance project.

**Core message (the problem it solves):** you always have small expenses; on their own
they feel harmless, but *added up over a month they are not small at all*. The app turns
every little transaction into a picture you can act on.

**Differentiators to sell (value-adds over other apps):**

- Multi-currency wallets with automatic conversion (ECB rates via Frankfurter).
- Hierarchical tags (parent → sub-tag, each with colour + icon).
- Rich analytics: **nested donut** chart + **Sankey** cash-flow diagram.
- **Subscription engine** — cron-based complex recurrence, calendar + timeline.
- **Wallet collaboration** — share with Owner / Editor / Viewer roles.
- **MCP server / LLM integration** — connect an LLM (e.g. Claude) to your finances
  (~25 tools): query spending, add transactions by chatting. *(New on the landing.)*
- Offline-first PWA (installable, works offline).
- **Coming soon:** European Open Banking (PSD2 / EnableBanking) — automatic bank import.

---

## 2. Decisions (locked with the user)

| Topic | Decision |
|---|---|
| Voice | **Hybrid** (product polish + honest open-source personal project) |
| Rebuild approach | **Clean rebuild following `frontend/style.md`** (binding) |
| App mockups | **Faithful to the real app** (reuse real chart components; rebuild the hero mockup so it mirrors the real dashboard) |
| Open Banking | **Dedicated "Coming soon" section** |
| Theme | **Theme-aware** (light/dark), **+ theme toggle in the navbar** |
| MCP/LLM block | **Included** (new) |
| "The problem" band | **Included** (new) |
| Language | **English** UI copy + comments (project rule) |

---

## 3. Style-guide compliance (`frontend/style.md`)

- **All CTAs use the `Button` primitive** (`variant="primary"` = brand gradient,
  **squared** `--r-cta`, `ripple`). No pill (`rounded-full`) CTAs, no hand-rolled
  `<button>`/`<input>`. Secondary actions = `Button variant="secondary"`/`"ghost"`.
- **Tokens only:** `app-*` set + `--brand-1` / `--brand-2` / `--grad-brand`. **Zero**
  `theme-*` / `--color-*`. Radii from the `--r-*` scale.
- **Numbers** in `font-app-mono` + `tabular-nums`.
- **Depth = neutral shadows. No coloured glow / halos.**
- **Animated spheres kept & expanded** (signature).
- Accent outside a wallet = **brand gradient**.

---

## 4. Page architecture (section order — confirmed)

1. **Navbar** — logo + wordmark · links (Features · Roadmap · GitHub) · **theme toggle** ·
   right CTA (conditional, see §7).
2. **Hero** — problem-led headline + sub + CTAs + **faithful dashboard mockup**.
3. **The problem** (band) — visualises "small expenses add up".
4. **Features** — value-add blocks (multi-currency, tags + tx preview, nested donut [real],
   Sankey [real], subscription engine, collaboration).
5. **MCP / LLM** — connect an LLM to your finances.
6. **Open Banking — Coming soon** — PSD2 / EnableBanking, automatic bank import.
7. **Continuous improvement / Roadmap** — "always improving" + link to `/ToDo`.
8. **Final CTA** — demo/login (conditional) + GitHub link.
9. **Footer** — open source + GitHub link + attributions.

---

## 5. Section-by-section content

### 5.1 Navbar
- Left: `/icon.svg` + wordmark "FinanceWebApp" (static, **no animated gradient**).
- Center (desktop): Features (scroll), Roadmap (`/ToDo`), GitHub (external, new tab).
- Right: **theme toggle** (sun/moon) + conditional CTA (§7). Mobile: hamburger menu
  mirroring the links + CTA.

### 5.2 Hero
- Eyebrow: `Open-source personal finance`.
- H1 (gradient accent on the last clause): **"Your small expenses aren't small."**
- Sub: "A coffee here, a subscription there — on their own they're nothing. Together
  they're your month. FinanceWebApp turns every little transaction into a picture you can
  actually act on. Built solo, in the open, always improving."
- CTAs: primary (conditional, §7) + secondary "See the features" (scroll) / GitHub.
- **Mockup:** rebuilt to faithfully mirror the real dashboard (wallet cards column that
  echoes `WalletCard`, a transactions list that echoes the real transaction rows). This is
  the "first snippet that was slightly off" — corrected.

### 5.3 The problem (band)
Short full-width band. A row of micro-expense chips (coffee ☕ €3.50, subscription 🎬
€12.99, parking 🅿️ €2.00, croissant 🥐 €1.80, taxi 🚕 €9.00, …) with a small "+" rhythm,
resolving into one large monthly total (mono, tabular) — e.g. **`€ 217 / month`**.
Caption: "Small, one by one. Not so small, added up." Purely presentational static data.

### 5.4 Features
Alternating left/right blocks (keep the current strong visual language, minus glow/pills):

1. **Multi-currency wallets** — unlimited wallets, per-wallet base currency, automatic ECB
   conversion (Frankfurter link preserved). Mockup: two faithful wallet cards.
2. **Hierarchical tags + transactions** — parent/sub tags with colour+icon; income green /
   expense red. Mockup: faithful transaction rows.
3. **Nested donut** — **real `TransactionPieChart`** with the **outer-ring colour fix**
   (see §8). Inner ring = parent, outer = sub-tags.
4. **Sankey cash-flow** — **real `CashFlowSankey`**.
5. **Subscription engine** — cron recurrence, calendar + timeline (card block).
6. **Wallet collaboration** — Owner/Editor/Viewer roles (card block).

**Offline-first PWA** gets a compact mention (a small badge/line within the Features
section, e.g. paired with the collaboration card) rather than its own full block — it is a
supporting quality, not a headline differentiator.

### 5.5 MCP / LLM (new)
Explains the MCP server: connect an LLM (e.g. Claude) to your finances via ~25 tools —
"How much did I spend on restaurants in March?", add transactions by chatting. It performs
no authorization of its own; the backend enforces per-wallet permissions (kept accurate to
the architecture). Visual: a small chat-style snippet (question → answer), sober glass.

### 5.6 Open Banking — Coming soon (new, dedicated)
Badge **"Coming soon"**. Copy: connect your real bank accounts across Europe (PSD2 /
Open Banking via **EnableBanking**) for automatic transaction import — no more manual
entry. Sober glass card, muted/disabled visual treatment to read as future work.

### 5.7 Continuous improvement / Roadmap
"Built in the open and always improving." Link to the roadmap (`/ToDo`). (Reworked
`ToDoSection`.)

### 5.8 Final CTA
Conditional headline/CTA (§7) + a secondary "View on GitHub" link. No register/sign-up
wording. Neutral depth, no glow.

### 5.9 Footer
- "An open-source project." + GitHub link → **https://github.com/Nicola-01/FinanceWebApp**.
- Attribution: exchange rates by Frankfurter / European Central Bank.
- Copyright line.

---

## 6. Background spheres (theme-aware)
- Grow from **2 → 4–5 spheres**, **repositioned** and spread down the scroll (not clumped
  at the top): violet + magenta + a soft blue/pink, varied size, staggered animations, high
  blur, low opacity, behind content (`-z`).
- **Theme handling:** dark keeps `mix-blend: screen` (current look). **Light mode:** switch
  blend/opacity/tint so spheres remain visible on the off-white background (screen would
  make them vanish) — computed from `resolvedTheme`.
- Rename `BackgroundBlobs.tsx` → `BackgroundSpheres.tsx`.

---

## 7. Demo / login conditional logic

Centralised in `LandingPage.tsx`:

```
demoEnabled = import.meta.env.VITE_DEMO_ENABLED === "true"
isLoggedIn  = !!getUserAuth()
```

Primary CTA (everywhere — hero, navbar, final CTA):

| State | Label | Action |
|---|---|---|
| logged in | "Go to dashboard" | `/dashboard` |
| demo enabled | "Launch the demo" | `POST /auth/demo` then `/dashboard` (existing flow) |
| else | "Log in" | `/login` |

Rules:
- **Demo enabled → no login/register anywhere**; all copy references trying the demo.
- **Demo disabled → the entry point is Login** (`/login`), **never** register/sign-up.
- The existing demo bootstrap (`handleTryDemo`) is preserved.

---

## 8. Donut outer-ring colour fix

Root cause: the landing demo data uses `colorHex: "var(--color-app-red)"` (a CSS var).
`TransactionPieChart` runs `hexToRgba(colorHex, 0.6)` on outer-ring sub-tags →
`parseInt("va",16)` = `NaN` → `rgba(NaN,…)` → no colour. Also `--color-*` is legacy.

**Fix (isolated to the landing):** move demo transactions to a new
`landingDemoData.ts` using **real hex** colours (e.g. `#f87171`, `#fbbf24`, `#34d399`,
`#60a5fa`, `#a78bfa`, `#f472b6`). No change to the shared `TransactionPieChart` component.

---

## 9. Files

`frontend/src/components/LandingPage/`:

| File | Action |
|---|---|
| `LandingPage.tsx` | Rewrite — orchestrator, demo/login logic, theme-aware wrapper, spheres |
| `Navbar.tsx` | Rewrite — `Button` CTA, theme toggle, GitHub link, conditional |
| `Hero.tsx` | Rewrite — new copy + faithful mockup |
| `ProblemBand.tsx` | **New** — "the problem" band |
| `Features.tsx` | Rewrite — blocks, real charts, `Button`, tokens |
| `McpSection.tsx` | **New** — MCP/LLM block |
| `OpenBankingSection.tsx` | **New** — coming-soon |
| `RoadmapSection.tsx` | Rewrite of `ToDoSection.tsx` (rename) |
| `CTASection.tsx` | Rewrite — `Button`, conditional, GitHub |
| `Footer.tsx` | Rewrite — open source + GitHub + attributions |
| `BackgroundSpheres.tsx` | Rewrite of `BackgroundBlobs.tsx` (rename) — 4–5 theme-aware spheres |
| `DemoSection.tsx` | Removed / absorbed into hero + final CTA |
| `landingDemoData.ts` | **New** — demo tx with real hex colours |

Charts wrapped in a MUI `ThemeProvider` whose `mode` follows `useTheme().resolvedTheme`.

---

## 10. Testing & verification
- **Add** a light `LandingPage` smoke test: renders key sections; **demo-enabled shows the
  demo CTA and no login**; **demo-disabled shows the Log in CTA**; GitHub link present with
  the correct href.
- Existing FE suite must stay green.
- `npm run lint` + `npm run build` must pass (CI gates).
- Manually verify at `/about` in **both light and dark** (spheres visible, charts themed,
  donut outer ring coloured) and with `VITE_DEMO_ENABLED` **true and false**.
- The pre-existing failing **wizard** tests (`TagsStep` / `StagedTagTree`) are unrelated WIP
  and **out of scope** — left untouched.

---

## 11. Out of scope
- Backend / API changes (none).
- The `/login` page, the `/ToDo` roadmap page content, the wallet-creation wizard.
- Any new backend endpoint for Open Banking (it stays a "coming soon" marketing section).
