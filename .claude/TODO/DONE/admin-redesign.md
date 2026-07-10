# Admin Section Redesign — TODO

Living plan for the **Admin dashboard** restyle + two functional features (backup delete,
scheduled-job control panel). Split out of `ui-redesign.md` §8. Design rules are binding:
[`frontend/style.md`](../../frontend/style.md) — warm brand gradient (outside a wallet), Plus
Jakarta Sans + JetBrains Mono, sober squared radii, glass, **no colored glow**, no animated
wordmark, primitives in `src/components/ui/`.

> **Language rule:** all UI copy **and** code comments in **English**.
> **Method:** one increment at a time; sign off on taste before sweeping. `npm run lint` +
> `npm run build` after each FE increment; `./gradlew test` + new tests after each BE change.

**Legend:** `[x]` done · `[~]` in progress · `[ ]` todo.

---

## Decisions (locked via /grilling, 2026-07-03)

| # | Decision | Choice |
|---|---|---|
| 1 | Cron feature depth | **Full control panel** — editable schedules · enable/disable · run history · next-run countdown |
| 2 | Tab structure | **3 tabs: Users · Backups · System**. Demo-cleanup job shown/enabled only when `DEMO_ENABLED` |
| 3 | Users layout | **Stacked, restyled** — stat strip · slim invite bar · collapsible pending · directory |
| 4 | Backups layout | **Snapshot table + toolbar** — per-row download / restore / delete |
| 5 | Schedule editor | **Presets + pickers** (Hourly / Daily / Weekly + time + day chips), **no raw cron** |
| 6 | Restore guard | **Hold-to-confirm** (~3s). Delete-a-backup = simple confirm |

Cross-cutting: prominent shared tab-selector (brand-gradient active pill); **consistent page
header** on every tab (title + description + actions slot — fixes "backups has a description,
users doesn't"); sober glass + `font-app-mono` numbers; primitives everywhere; delete dead
`AdminHeader.tsx`.

---

## Increment 1 — Admin shell + Users tab  ·  *frontend only, zero risk*  ·  ✅ built, awaiting sign-off

- [x] **Tab switcher** — moved out of the header into a dedicated **`AdminTabs`** underline bar
  below it (icon + label, brand-gradient active underline), mirroring the dashboard `WalletTabs`.
  Removed the `tabs`/`AppHeaderTab` API from `AppHeader` (was admin-only). System tab added in Inc. 3.
- [x] **`AdminPageHeader`** (`admin/AdminPageHeader.tsx`): title + description + actions slot.
- [x] **Stat strip** (`AdminStats` + `StatCard`): sober glass row, `font-app-mono` numbers, tiny
  brand-tint icon chip; added 4th metric **Pending Invites**.
- [x] **Slim invite bar** (`CreateInviteForm`): `Input` (email) + `Input` (note) + `Button` (send),
  primitives, `theme-*` gone.
- [x] **Pending invitations** (`InvitesTable`): wrapped in `Collapse size="sm"` + count badge;
  all 17 `theme-*` migrated.
- [x] **User Directory** (`UserDirectory` + `UserRow`): `SearchInput` primitive; `theme-*` gone;
  numeric cols in `font-app-mono`; sort + `DeleteModal` flow kept.
- [x] Deleted dead **`AdminHeader.tsx`**.
- [x] `npm run lint` + `npm run build` green. → **sign-off on visual language.**
- [x] Extended `Collapse` with `size` + `badge` props (was unused elsewhere; zero-risk).

## Increment 2 — Backups tab + delete backend  ·  *frontend + small backend*  ·  ✅ built, awaiting sign-off

- [x] **BE:** `BackupService.deleteBackup(key)` (R2 + local, path-traversal guard) +
  `DELETE /api/admin/backup/{key}`. Tests: 4 service (`BackupServiceTest`) + 1 controller.
  Full suite + Spotless + 90% jacoco gate green.
- [x] **FE:** snapshot **table + toolbar** (`Backups.tsx` rewrite): toolbar Upload + Run backup;
  scrollable newest-first table (Snapshot · Size · Age · Actions), per-row download / restore /
  delete; summary line (count · newest · size). `theme-*` gone.
- [x] **`ConfirmModal`** (new, reusable, `modals/common/`): `hold` mode (press-and-hold, tone
  warning) for restore + `simple` mode (tone danger) for delete-backup. On the shared `ModalDialog`
  shell, no coloured glow. Replaces the old `window.confirm`s.
- [x] Native `<select>` dropdowns removed (row actions replace them).
- [x] lint + build + `./gradlew check` green.

Note: the old **Refresh** button was dropped — the list auto-refreshes after every backup / upload /
restore / delete, so a manual refresh is redundant. Say if you want it back.

- [x] **Bulk select + bulk download/delete** (follow-up): tri-state select-all header + per-row
  `Checkbox` primitive; a brand-tinted bulk bar ("N selected · Download · Delete · clear") appears
  when rows are selected. Bulk download loops the download endpoint; bulk delete confirms once
  (simple modal) then loops the tested `DELETE` (removes from R2). Pure frontend — no new backend.
  Toolbar buttons enlarged (`sm→md`) + merged with the summary into one integrated bar; table
  gained semantic header icons, a per-row database chip, a green **LATEST** pill and age colour-coding.
- [x] **Bulk bar always visible** (info hint + disabled actions when nothing selected — no layout jump).
- [x] **Viewport-dynamic table height**: flex height-chain (`AdminDashboard main` → page → table) so on
  `xl` the snapshot list fills to a small bottom gap and scrolls *internally* (page doesn't scroll);
  caps at `65vh` below `xl`. Users page given `xl` internal scroll so it can't clip under the fixed `main`.

## Increment 3 — System tab + cron backend  ·  *big backend, last*  ·  ✅ built, awaiting sign-off

- [x] **BE entities:** `ScheduledJobConfig` (jobKey, enabled, frequency, hour, minute, daysOfWeek)
  + `JobRun` (jobKey, startedAt, finishedAt, status, message, durationMs, manual). Enums
  `JobFrequency`/`JobRunStatus`. Repos for both.
- [x] **BE scheduling:** `ManagedJob` interface — the 3 cron jobs refactored to implement it (removed
  hardcoded `@Scheduled`). `ScheduledJobService` owns a `ThreadPoolTaskScheduler` (`SchedulingConfig`
  bean), seeds default configs on `@PostConstruct`, computes a Spring 6-field cron from the structured
  schedule (no parsing), (re)schedules live via `CronTrigger`, wraps each run into a `JobRun`, respects
  `enabled`, prunes history beyond 50/job. Demo-cleanup gated by `application.demo.enabled` via
  `available()` (hidden + unscheduled when off).
- [x] **BE endpoints** (`AdminJobController`): `GET /api/admin/jobs`, `PUT …/{key}/schedule`,
  `PUT …/{key}/enabled`, `POST …/{key}/run`. DTOs + validation. Tests: `ScheduledJobServiceTest`
  (14) + `AdminJobControllerTest` (5) + updated 3 cron-job tests. Full suite + Spotless + 90% gate green.
- [x] **FE:** **System** tab (route + gear nav entry). `SystemTab` renders a `JobCard` per job:
  icon + name + live next-run **countdown** + enable `Toggle`; **presets+pickers** editor
  (`CustomSelect` freq + HH:MM, day chips for Weekly) with dirty-tracked Save; **Run now**; **recent
  runs** history (mono, green/red status, duration, manual badge). Demo card hidden unless enabled.
- [x] lint + build + `./gradlew check` green.

Note: the Backups-tab "Run backup" still calls the direct `POST /admin/backup` (doesn't record a
`JobRun`); the System-tab backup **Run now** records history. Left as-is; unify later if wanted.

---

## Target layouts (ASCII)

```
Header:  🐱 Admin Panel   [ Users │ Backups │ System ]   admin ▾
                              ▓▓▓▓  ← active = brand gradient pill

① Users
  Users                                      [ + Invite User ]
  Manage registered users and pending invitations.
  ┌ 2 USERS │ 2 WALLETS │ 341 TRANSACTIONS │ 1 PENDING ┐  ← glass strip, mono
  ┌ 📧 email… │ note… │ Send ▸ ┐                          ← slim invite bar
  ▸ Pending invitations · 1     (collapsible)
  ┌ User Directory ───────────[ 🔍 search ]─┐
  │ gatto  28 Jun 26  1  339            🗑   │
  └─────────────────────────────────────────┘

② Backups
  Backups                 [ ↻ ] [ ⬆ Upload ] [ ▶ Run backup ]
  Snapshot, restore and transfer the DB via Cloudflare R2.
  ┌ ☁ 162 snapshots · newest 3 Jul 03:00 · 2.1 MB ┐
  ┌ Snapshot ─── Size ── Age ──── Actions ─┐
  │ 3 Jul 03:00  2.1 MB  2h ago   ⬇ ↩ 🗑   │  ↩ = hold-to-confirm
  └────────────────────────────────────────┘

③ System
  ┌ 💾 Database Backup ──────── next run in 08:12:44 ┐
  │ Frequency [Daily▾] at [03▾]:[00▾]  Enabled [●─]  │
  │ Recent: 3 Jul ✓ 2.1MB 1.4s        [ Run now ▸ ]  │
  └──────────────────────────────────────────────────┘
  🔁 Subscription Execution · 🧹 Demo Cleanup (only if DEMO_ENABLED)
  Weekly → adds [M][T][W][T][F][S][S] day chips
```

---

## New / reusable pieces produced here

- `AdminPageHeader` — shared tab header (title + description + actions).
- `HoldToConfirm` (or a `confirmStrength` option on a confirm modal) — hold-to-confirm button;
  reusable for the Category-delete idea flagged in `ui-redesign.md` §5.
- Backend: `ScheduledJobConfig`, `JobRun`, a `DynamicScheduling` config + job-run recording wrapper.

## Backend endpoints (new)

- `DELETE /api/admin/backup/{key}` — delete one snapshot (Inc. 2).
- `GET /api/admin/jobs` · `PUT /api/admin/jobs/{key}/schedule` · `PUT /api/admin/jobs/{key}/enabled`
  · `POST /api/admin/jobs/{key}/run` (Inc. 3).

_Last updated: 2026-07-03. Increments run cheapest/safest first; each ends with a sign-off._
