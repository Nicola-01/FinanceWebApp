# UI Redesign v2 — "Wallet card" design style (DRAFT)

> Status: **promoted to `frontend/style.md` §8 on 2026-11-12** — that is the binding version
> (real token names, decisions D7–D9). This file stays as rationale. Originally: draft, approved in direction (2026-11-12). Phase 0 of
> [`ui-redesign-v2.md`](ui-redesign-v2.md) promotes this into `frontend/style.md`
> (replacing §2–§4 there; the primitives rules in §1 stay).
> Visual reference: `docs/redesign-demos/d-wallet-card.html` (open it; `#subs`, `#cat`,
> `#stats`, `#budget`, `#settings` jump to a tab). The mockup is a **direction, not a
> feature spec**: every existing feature stays unless Nicola says otherwise.

## 1. The idea in one paragraph

Calm, warm-dark product chrome; **the wallet's colour is the personality**, used as a
*solid surface in one place* (the wallet card) instead of glows, borders and tinted text
everywhere. Colour also lives in the **category icons** (tinted tiles). A slightly
characterful display face for titles and big numbers, and the **fox mascot** for empty
states and the card emblem, keep it friendly. Everything else is quiet and neutral.

## 2. Do / don't

| Do | Don't |
|---|---|
| Wallet colour as a **solid fill** on: wallet card, primary CTA, wallet mini-cards, active-tab icon | Wallet colour on borders, text, glows, halos, tab underlines, gradients |
| Category colour on **icon tiles** (18% tint bg + full-colour glyph) and chart marks | Coloured category *chips/badges* with coloured text in every row |
| Sentence case everywhere ("New transaction", "Subscriptions") | ALL CAPS tabs, labels, eyebrows |
| Expenses in normal text colour; **only income is green** | Every expense in red |
| Tabular figures in the UI font (`font-variant-numeric: tabular-nums`) | Monospace for amounts |
| Neutral warm-dark background, flat | Radial glows, purple-tinted backgrounds, `DashboardBackground` blobs |
| Status = icon **+** text + colour (On track / Close to the limit / Over by …) | Status by colour alone |
| Fox in empty states and as card emblem | Fox animated, or used as decoration on full pages |

## 3. Tokens

All colours via CSS variables (Tailwind arbitrary values or `app-*` aliases). Names are
proposals; Phase 0 maps them onto the existing `app-*` set rather than adding a parallel one.

### Dark (default, validated in mockup)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#141312` | page background |
| `--surface` | `#1d1c1a` | sidebar, cards, boxes, inputs-on-bg |
| `--raised` | `#262421` | active segment, inputs inside boxes, track of bars |
| `--line` | `#2e2c29` | hairlines between list rows |
| `--text` | `#efece6` | primary text |
| `--muted` | `#9a958c` | secondary text |
| `--faint` | `#6b665e` | tertiary / axis labels |
| `--income` | `#7fcf95` | income amounts, "On track" |
| `--expense-mark` | `#ec8a76` | expense **marks** in charts / bars (not text) |
| `--warn` | `#f0b85a` | due soon, close to limit |
| `--danger` | `#ff8a7a` | overdue, over budget, destructive |
| `--wallet` | `wallet.color` | set per wallet at runtime |
| `--on-wallet` | computed | `#1d1a10` or `#ffffff` by luminance (> 0.5 → dark) |

### Light — **TO DEFINE in Phase 0** (the app is themed; light must keep working)
Start from: bg `#f4f3f1`, surface `#ffffff`, raised `#eeece8`, line `#e4e1dc`, text `#1c1a17`,
muted `#6b665e`; income `#2f8f55`, warn `#a86a0c`, danger `#c4412f`. Avoid the cream
`#F4F1EA` tell. Mock it (one static page) and get sign-off before coding.

### Radius / spacing
`--r-card: 20px` (wallet card) · `--r-box: 16–18px` (boxes, tiles) · `--r-cta: 12px` ·
`--r-input: 12px` · `--r-sm: 8px` · icon tile `11px` · pills `999px`. Page padding 40px
desktop / 16px mobile; gaps 14px between boxes, 32px between sections.

### Typography (self-hosted woff2 in `src/assets/fonts/`, offline-first — no CDN)
- **Display: Bricolage Grotesque** (500–800, opsz) — page/section titles, the wallet
  name, big numbers (card net 46px, tiles 26px, list summary 21px). Letter-spacing −0.02em.
- **UI: Instrument Sans** (400/500/600) — everything else, 15px base, line-height 1.5.
- Numbers: `tabular-nums` everywhere amounts align.
- Replaces Plus Jakarta Sans + JetBrains Mono (remove their @font-face and files at the end).

## 4. Components (spec → primitive)

| Pattern | Spec | Primitive (in `components/ui/`) |
|---|---|---|
| **Wallet card** | solid `--wallet`, text `--on-wallet`, name (display 30), meta (13, 70% opacity), "Net this month" + big net, month switcher as translucent pill (`color-mix(on-wallet 10%)`), fox emblem bottom-right rotated −8° and clipped | `WalletHeroCard` |
| **Wallet mini-card** (sidebar) | 58px tall, solid wallet colour, name + currency; active = 2px `--text` outline offset 3px; no opacity dimming | `WalletMiniCard` (replaces current `WalletCard` look) |
| **Stat tile** | surface box, icon tile + label + display number + 13px sub | `StatTile` |
| **Tabs** | segmented control on `--surface`, active segment `--raised`, icon of active tab in `--wallet` | restyle `WalletTabs` / `Selector` |
| **Category icon** | 40×40, radius 11, bg `color-mix(cat 18%)`, glyph in category colour | `CategoryIcon` (replaces chip-style `TagBadge` in rows) |
| **List row** | icon · title (600) + sub (13 muted) · amount right (600, income green); hover = surface bg; title falls back to leaf category when the transaction has no name | restyle `TransactionRow` |
| **Day group header** | muted 13px date left, day total right | — |
| **Primary CTA** | solid `--wallet` / `--on-wallet` inside a wallet; outside a wallet: **DECISION** (brand violet vs inverted neutral) | `Button variant="primary"` |
| **Secondary / ghost** | `--surface` bg, muted text, icon + label gap 8 | `Button variant="secondary"` |
| **Status pill** | `color-mix(status 16%)` bg, status text, icon + label | `StatusPill` |
| **Progress bar** | 10px track `--raised`, fill = status colour, radius 5 | `ProgressBar` |
| **Split bar** | 14px, 2px gaps, segments in entity colour, legend with % below | `SplitBar` |
| **Empty state** | fox (96px, −6°), display title 20, one-line explanation, CTA that names the action | `EmptyState` |
| **Needs-attention row** | surface box with 3px inset left bar in `--warn` | — |

## 5. Charts (MUI X-Charts stays — restyle via `statistics/chartTheme.ts`)
- Income mark `--income`, expense mark `--expense-mark`, balance line `--text` at 60%.
- 4px rounded bar tops, 2px gap between paired bars, recessive grid (`--line`), axis
  labels `--faint` 12px, no axis lines.
- Donuts: 18px ring, 2px gaps between segments, total in display face at the centre.
- Legend always present for ≥2 series; tooltip on hover; a table view stays available.
- Category colours come from the user's tags — don't recolour them.

## 6. Copy
Sentence case, plain verbs, English only. CTAs say what happens ("New subscription",
"Link a bank account", "Delete Demo Wallet"). Empty states say what to do next.
Relative dates for due items ("in 3 days", "11 days overdue").

## 7. Still allowed from v1
Primitives-first rule, `ResponsiveOverlay`/`ModalDialog` shells, ripple on CTAs, always-dark
auth screens (re-evaluated in Phase 10).
