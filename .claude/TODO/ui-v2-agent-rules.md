# UI v2 — rules for implementation subagents

Frontend: `/home/nicola/Desktop/FinanceWebApp/frontend` (React 19 / TS / Tailwind 4). Read
`frontend/style.md` §8 (lines ~225-310) before starting.

## Dual UI
- `const [ui] = useUiVersion();` from `src/hooks/useUiVersion.ts` (returns a tuple). v1 output
  must stay as it is; existing tests pass unchanged. Mark each fork `// ui-v2-switch`.
- Restyle by swapping class strings; if the structure changes, build a `XxxV2` component next to
  the old one and switch in one place. Never fork a hook; never change props, logic, a11y.

## Look (token classes only, no hex)
- Page `bg-app-bg`; boxes `bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]` (no border,
  blur, glass, gradient, glow, `brand-1/2`); raised `bg-app-raised` (inputs, active segment, hover).
- Floating layers (menus, popovers, dialogs): `shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)]`.
- Text `text-app-text` / `-muted` / `-faint`; income `text-app-income` (only income is green;
  expenses are normal text); status `text-app-warn` / `text-app-danger`; expense marks in charts/bars
  `app-expense-mark`. Accent = `bg-wallet text-on-wallet` (CSS vars set by the wallet root).
- Needs-attention: `shadow-[inset_3px_0_0_var(--color-app-warn),var(--box-ring)]`.
- Titles `font-display` (`tracking-[-0.02em]`); sentence case; no uppercase / tracking-widest;
  `tabular-nums`, no monospace. Radii: card 18, input/cta 12 (`--r-input`), sm 8.
- Section header: `font-display text-[19px] font-semibold` + optional `text-[13px] text-app-muted` aside.

## Reuse (never hand-roll)
`src/components/ui/`: Button, Input, SearchInput, Toggle, Checkbox, Badge, Card, Menu, CategoryIcon
(icon, color, size "md"|"sm"), StatTile, StatusPill, ProgressBar, SplitBar, EmptyState,
WalletHeroCard. Amounts: `formatAmount(v, { signed })` in `src/utils/format.ts`. Overlays: only
`ModalDialog` / `ResponsiveOverlay` / `WizardShell`.

## Code
- English only (copy + comments); relative imports (no alias); comments only for non-obvious why.
- New pure logic → `.ts` module + Vitest test. Tests in `src/__tests__/<same path>`; enable v2 with
  `setUiVersion("v2")` from `src/utils/uiVersion.ts`, reset to "v1" in `afterEach`.
- Only edit the files your task allows. If something else must change, STOP and report.
- Other agents work in parallel on other folders: ignore failures that are only in their files and
  mention them.

## Verify, then report
`npx vitest run <your test dirs>` → `npx tsc -b` → `npx eslint <your dirs>` → `npx prettier --write
<touched files>`. Report: files changed, one line per file, results, doubts. Never commit.
