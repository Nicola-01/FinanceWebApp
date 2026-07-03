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
