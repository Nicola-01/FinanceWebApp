# Frontend Style Guide — FinanceWebApp

Binding guide for building UI in `frontend/`. It comes out of the "de-vibecode" redesign:
drop the AI look (neon/glow, animated wordmarks, inconsistent radii, ~60 hand-rolled
buttons) in favour of a **warm, premium, consistent** product.

> **Language rule:** all user-facing UI copy **and** all code comments are written in
> **English**. The app ships in English.

> **Golden rule:** a new component does NOT reinvent buttons, inputs, selects, etc.
> **Reuse the shared primitives in `src/components/ui/`.** If a primitive doesn't exist,
> create it there (not inline inside a feature component).

---

## 1. Shared primitives — `src/components/ui/`

Before writing markup, check whether a primitive already exists. Currently:

| Component | File | Used for |
|---|---|---|
| `Button` | `Button.tsx` | **Every** button / CTA. |
| `Input` | `Input.tsx` | **Every** text field (box with icon / slot). |
| `SearchInput` | `SearchInput.tsx` | **Every** search field: magnifier + clear (×), `plain`/`boxed` variants, accent focus ring. |
| `Toggle` | `Toggle.tsx` | **Every** on/off: sliding switch or a button that switches. |
| `AmountInput` | `AmountInput.tsx` | Currency amount inputs. |
| `CustomSelect` | `CustomSelect.tsx` | Dropdowns / selects. |
| `Selector` | `Selector.tsx` | Segmented / option selector. |
| `Collapse` | `Collapse.tsx` | Collapsible sections. |
| `TagBadge` | `TagBadge.tsx` | Tag badges. |
| `FloatingActionButton` | `FloatingActionButton.tsx` | FAB. |
| `ToastHost` / `ToastNotification` | — | Toasts (`triggerToast(msg, ok)`). |
| `PWAPrompt` | `PWAPrompt.tsx` | PWA install prompt. |

Do **NOT** hand-write `<button className="...">` or `<input className="...">` in features.
Use `Button` / `Input`. If you need a new variant, **extend the primitive**.

### `Button`

```tsx
import Button from "../components/ui/Button";

<Button variant="primary" size="lg" fullWidth ripple onClick={save}>
  Save
</Button>
```

Props (plus every native `<button>` attribute):

| Prop | Values | Default | Notes |
|---|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `danger` | `primary` | `primary` = brand gradient. |
| `size` | `sm` \| `md` \| `lg` | `md` | Radii from the single scale. |
| `fullWidth` | `boolean` | `false` | `w-full`. |
| `ripple` | `boolean` | `false` | Ripple on press (the same one as `WalletCard`). Enable it on CTAs / tactile actions. |
| `rippleColor` | `string` | auto | Override ripple colour. For wallet accents pass `` `${wallet.color}55` ``. |

The ripple uses the global `custom-ripple` keyframe (in `index.css`). Respects `disabled`.
Visible focus is already included (`focus-visible:ring`). `primary`, `secondary` and
`danger` grow a **neutral shadow on hover** (a lift) — no coloured glow.

### `Input`

```tsx
import { Input } from "../components/ui/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

<Input
  ref={usernameRef}
  placeholder="Username"
  aria-label="Username"
  invalid={!!errors.username}
  leadingIcon={<FontAwesomeIcon icon={faUser} />}
  rightSlot={<button type="button" onClick={toggle}>…</button>}
/>
```

Props (plus every native `<input>` attribute, `forwardRef` to the input):

| Prop | Type | Notes |
|---|---|---|
| `leadingIcon` | `ReactNode` | Icon on the left (`app-muted`). |
| `rightSlot` | `ReactNode` | Node on the right (e.g. a password toggle). |
| `invalid` | `boolean` | Red error border. |

It's **theme-aware**: on the always-dark auth screens it inherits the forced dark tokens.

### `Toggle`

```tsx
import Toggle from "../components/ui/Toggle";

// sliding switch
<Toggle checked={on} onChange={setOn} label="Notifications" />

// button that switches (active = brand gradient)
<Toggle variant="button" checked={on} onChange={setOn} label="Monthly" />
```

| Prop | Values | Default | Notes |
|---|---|---|---|
| `checked` / `onChange` | `boolean` / `(next)=>void` | — | Controlled. |
| `variant` | `switch` \| `button` | `switch` | `switch` = sliding pill; `button` = a button that switches its active state. |
| `size` | `sm` \| `md` | `md` | `switch` only. |
| `label` | `ReactNode` | — | `switch`: text beside it · `button`: the button content. |
| `disabled` | `boolean` | `false` | |

`role="switch"` + `aria-checked` included. ON state = brand gradient.

---

## 2. Design tokens — `src/theme-tokens.css`

Always use the tokens, never magic values scattered around.

```
--brand-1: #8b5cf6;  /* violet  */
--brand-2: #e0339a;  /* magenta */
--grad-brand: linear-gradient(120deg, var(--brand-1), var(--brand-2));

--r-card: 16px;  /* cards / panels    */
--r-cta:  12px;  /* buttons (squared, NOT pill) */
--r-input:10px;  /* inputs / selects  */
--r-sm:   8px;   /* small buttons / chips */
```

In Tailwind: `rounded-[var(--r-card)]`, `bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)]`.

**Fonts** (self-hosted, offline-first — no Google `@import`):
- Text and titles → **Plus Jakarta Sans** (`--font-sans`, applied globally on `body`).
- **Numbers / tabular data** → **JetBrains Mono**: use the `.font-app-mono` utility or
  `font-mono` + `tabular-nums`. (A finance app's numbers must line up in columns.)

---

## 3. Colours & theme — tokens, not random hex

**`app-*`** set (theme-aware, has a `.dark` override) — **use these**:

`bg-app-bg` · `bg-app-surface` · `bg-app-card` · `bg-app-input` · `bg-app-hover` ·
`text-app-text` · `text-app-muted` · `border-app-border` · and the accents
`app-green / app-red / app-blue / app-purple / …` (semantic: green = income, red = expense).

> ⚠️ **Do NOT use** the legacy **`theme-*` / `--color-*`** set (e.g. `theme-text-default`,
> `theme-bg-success-light`): it's generated by `refactor.ts`, has **no `.dark` override** and
> in light mode causes white-on-white text. It's being phased out. Prefer `app-*` + the new
> tokens. Don't edit/regenerate `theme-colors.css` by hand.

### Per-wallet accent
Inside a wallet the accent **is `wallet.color`** (a hex on the `Wallet` entity), applied via
`style={{ … }}` to border / text / selection-glow / ripple (see `WalletCard.tsx`,
`WalletTabs.tsx`). Outside a wallet (login, landing, admin, global settings) the accent is
the **brand gradient** (`--grad-brand`).

---

## 4. "De-vibecode" aesthetic rules

**DO**
- Gradients on CTAs (brand outside a wallet, `wallet.color` inside).
- Saturated palette for semantic accents.
- **Soft, defined glass**: medium blur, a slightly opaque surface, a `1px` border
  (`border-white/10` on auth), a **neutral shadow** for depth.
- Animated background spheres (`Sphere` / `AnimateBackground`) — they're the signature,
  **don't remove them**.
- Ripple on tactile buttons (`<Button ripple>`).

**DON'T**
- **Coloured glow / halos** (`box-shadow: 0 0 Npx <colour>`). Depth comes from neutral
  shadows, not neon bloom. At most one subtle glow on `:selected`.
- **Animated-gradient wordmark / text** in a loop (no `animate-gradient-x` on the logo).
- **Improvised radii / shadows**: use the `--r-*` scale and the primitives.
- **Pill** buttons for primary CTAs (the choice is **squared-soft**, `--r-cta`).
- Hand-written `<button>` / `<input>` when a primitive exists.

---

## 5. Auth screens = always dark

Login, register, forgot/reset password, OAuth consent and admin have a **hardcoded dark
background** (`AnimateBackground.tsx`). The light/dark toggle only affects **the dashboard**.

Login, register, forgot and reset share the **`AuthLayout.tsx`** shell: it renders the
animated background **once** and only swaps the form via `<Outlet/>`, so navigating between
auth pages does **not** remount/restart the background. That layout already carries the
**`dark`** class (so `app-*` tokens resolve dark). → An auth page must **NOT** render its own
`<AnimateBackground/>` or full-screen wrapper: it renders **only the card** (`relative z-10 …`).

---

## 6. Quality & CI

After every frontend change:

```bash
npm run lint     # ESLint + Prettier — must pass (CI gate)
npm run build    # tsc -b && vite build — must pass (CI gate)
```

Offline-first PWA with an **aggressive** Workbox service worker: after changes, restart the
dev server and **clear cache/SW** (or use an incognito window), otherwise you see the old
version.

**Charts:** charts use `@mui/x-charts-pro` and there's a CSS hack in `index.css` that hides
the licence watermark — **don't touch it** (licensing decision still open).

---

## 7. Checklist for a new UI component

- [ ] Reusing the `src/components/ui/` primitives (Button, Input, Toggle, CustomSelect, …)?
- [ ] Colours from `app-*` tokens (no legacy `theme-*`, no scattered hex)?
- [ ] Radii from the `--r-*` scale? Squared buttons, not pills?
- [ ] Numbers in `font-app-mono` + `tabular-nums`?
- [ ] Depth via a neutral shadow, **no coloured glow**?
- [ ] Accent = `wallet.color` (inside a wallet) or `--grad-brand` (outside)?
- [ ] If auth: rendered inside `AuthLayout` (card only, no own background)?
- [ ] All UI copy and comments in English?
- [ ] `npm run lint` and `npm run build` green?


---

## 8. UI v2 "Wallet card" (beta — dual UI during the migration)

Plan: `.claude/TODO/ui-redesign-v2.md` · rationale + mockups: `.claude/TODO/ui-redesign-v2-style.md`,
`docs/redesign-demos/d-wallet-card.html` (dark), `d-light.html` (light), `d-accent.html`.
Until the cut-over (Phase 11) **§2–§5 above still apply to v1**; this section applies to v2.

### How the dual UI works
- `utils/uiVersion.ts` stores `"v1" | "v2"` per device and mirrors it on `<html data-ui>`;
  components read it with `hooks/useUiVersion.ts`. Toggle: `/settings` → Appearance.
- **Tokens restyle shared primitives for free**: `theme-tokens.css` remaps the same
  `--bg-*`/`--text-*` vars under `:root[data-ui="v2"]` (light) and `:root.dark[data-ui="v2"]`.
  Prefer restyling through tokens over forking a component.
- Where the **structure** changes, build the v2 component next to the old one and switch in
  one place: `ui === "v2" ? <New /> : <Old />`, marked `// ui-v2-switch`. Never fork a hook.

### Tokens (Tailwind classes; v1 falls back to the nearest old colour)
| Class | v2 dark | v2 light | Use |
|---|---|---|---|
| `bg-app-bg` | `#141312` | `#f4f3f1` | page |
| `bg-app-card` / `bg-app-surface` | `#1d1c1a` | `#ffffff` | sidebar, boxes, tiles |
| `bg-app-raised` (= `app-input`, `app-hover`) | `#262421` | `#eeece8` | active segment, inputs in boxes, bar tracks |
| `border-app-border` | `#2e2c29` | `#e4e1dc` | hairlines between rows |
| `text-app-text` / `-muted` / `-faint` | `#efece6` / `#9a958c` / `#6b665e` | `#1c1a17` / `#6b665e` / `#9a958c` | text levels |
| `text-app-income` | `#7fcf95` | `#2f8f55` | income amounts, "On track" (**only** income is green) |
| `app-expense-mark` | `#ec8a76` | `#ec8a76` | expense **marks** in charts/bars, never text |
| `app-warn` / `app-danger` | `#f0b85a` / `#ff8a7a` | `#a86a0c` / `#c4412f` | due soon / overdue, over budget, destructive |
| `bg-wallet` + `text-on-wallet` | wallet colour / `onColor()` | same | the one solid wallet surface (card, primary CTA, mini-cards, active-tab icon) |

- `--wallet`/`--on-wallet` default to the **inverted neutral** (text colour fill, page colour
  text) — that is the accent outside a wallet (login, global settings, admin). A wallet root
  sets them from `wallet.color` + `onColor(wallet.color)` (`utils/color.ts`).
- Light only: white boxes get a 1px hairline — `shadow-[var(--box-ring)]` (transparent in dark, so it can be combined: `shadow-[inset_3px_0_0_var(--color-app-warn),var(--box-ring)]`).
  Category glyphs in light: `color-mix(in srgb, <cat> 70%, #000)` so yellow/cyan stay legible.
- Radius: `--r-hero` 20 (wallet card) · `--r-card` 18 · `--r-input`/`--r-cta` 12 · `--r-sm` 8 ·
  icon tile 11 · pills full. Spacing: page 40px desktop / 16px mobile, 14px between boxes,
  32px between sections.
- Fonts (self-hosted, `assets/fonts/`): **Instrument Sans** = `font-sans` (UI, tabular
  numbers by default); **Bricolage Grotesque** = `font-display` (titles, wallet name, big
  numbers; `tracking-[-0.02em]`). No monospace for amounts in v2.

### Do / don't
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

### Components (spec → primitive in `components/ui/`)
| Pattern | Spec | Primitive (in `components/ui/`) |
|---|---|---|
| **Wallet card** | solid `--wallet`, text `--on-wallet`, name (display 30), meta (13, 70% opacity), "Net this month" + big net, month switcher as translucent pill (`color-mix(on-wallet 10%)`), fox emblem bottom-right rotated −8° and clipped | `WalletHeroCard` |
| **Wallet mini-card** (sidebar) | 58px tall, solid wallet colour, name + currency; active = 2px `--text` outline offset 3px; no opacity dimming | `WalletMiniCard` (replaces current `WalletCard` look) |
| **Stat tile** | surface box, icon tile + label + display number + 13px sub | `StatTile` |
| **Tabs** | segmented control on `--surface`, active segment `--raised`, icon of active tab in `--wallet` | restyle `WalletTabs` / `Selector` |
| **Category icon** | 40×40, radius 11, bg `color-mix(cat 18%)`, glyph in category colour | `CategoryIcon` (replaces chip-style `TagBadge` in rows) |
| **List row** | icon · title (600) + sub (13 muted) · amount right (600, income green); hover = surface bg; title falls back to leaf category when the transaction has no name | restyle `TransactionRow` |
| **Day group header** | muted 13px date left, day total right | — |
| **Primary CTA** | solid `--wallet` / `--on-wallet` inside a wallet; outside a wallet: the inverted neutral (D8) — `bg-wallet text-on-wallet` gives both | `Button variant="primary"` |
| **Secondary / ghost** | `--surface` bg, muted text, icon + label gap 8 | `Button variant="secondary"` |
| **Status pill** | `color-mix(status 16%)` bg, status text, icon + label | `StatusPill` |
| **Progress bar** | 10px track `--raised`, fill = status colour, radius 5 | `ProgressBar` |
| **Split bar** | 14px, 2px gaps, segments in entity colour, legend with % below | `SplitBar` |
| **Empty state** | fox (96px, −6°), display title 20, one-line explanation, CTA that names the action | `EmptyState` |
| **Needs-attention row** | surface box with 3px inset left bar in `--warn` | — |

### Charts (MUI X-Charts stays — restyle via `statistics/chartTheme.ts`)
- Income mark `--income`, expense mark `--expense-mark`, balance line `--text` at 60%.
- 4px rounded bar tops, 2px gap between paired bars, recessive grid (`--line`), axis
  labels `--faint` 12px, no axis lines.
- Donuts: 18px ring, 2px gaps between segments, total in display face at the centre.
- Legend always present for ≥2 series; tooltip on hover; a table view stays available.
- Category colours come from the user's tags — don't recolour them.

### Copy
Sentence case, plain verbs. CTAs name the action ("New subscription", "Delete Demo Wallet");
empty states say what to do next; relative dates for due items ("in 3 days", "11 days overdue").
