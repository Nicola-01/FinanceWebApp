# Toast Notification Audit + Fix TODO

Audit of every `triggerToast(message, success)` call site in the frontend, plus a
prioritized TODO of what to fix, how, and why.

- **API:** `triggerToast(message: string, success: boolean)` — `src/components/ui/ToastNotification.tsx`.
  Renders a transient, top-of-screen toast that auto-dismisses after ~3s. `success=true` →
  green, `success=false` → red. Called **directly** everywhere (no wrapper/alias/re-export).
- **Rendering:** `src/components/ui/ToastHost.tsx` (restyled to the `app-*` tokens + neutral
  shadow; see the style guide `frontend/style.md`).
- **Scope:** ~95 live call sites across 28 files, + 19 calls in 3 **dead** files.
- **Verdicts:** `APPROPRIATE` (keep) · `QUESTIONABLE` (wrong pattern / weak UX) · `UNNECESSARY`
  (redundant or unreachable).
- **Status:** this document is analysis + plan only. No toast behaviour has been changed yet.

> **Guiding principle.** A toast is for a **transient, non-critical, non-actionable
> confirmation** of a discrete action. It is the *wrong* tool for: form-field validation,
> blocking/critical errors, whole-view load failures, and anything the user must act on
> (those need inline errors, persistent banners, or error states with a retry).

---

## Verdict summary

| Bucket | Count | Keep? |
|---|---|---|
| Mutation success confirmations (create/update/delete/revoke/pause…) | ~40 | ✅ keep |
| API-catch error notices (funnel through `getApiErrorTitle/Detail`) | ~35 | ✅ keep |
| Clipboard-copy confirmations | 2 | ✅ keep |
| Form-field **validation** shown as a toast | ~10 | ⚠️ convert to inline |
| Mount-time **view-load failures** shown as a toast | ~11 | ⚠️ convert to error+retry |
| Blocking / reactive-effect / "nothing to export" toasts | ~6 | ⚠️ rework |
| **Unreachable** validation toasts (submit already disabled) | 5 | ❌ delete |
| Dead-file toast calls (files never imported) | 19 | ❌ delete files |

The large majority (mutation confirmations, API errors, clipboard) are **correct** and stay.
The problems cluster in three buckets: (1) an offline false-success **bug**, (2)
validation-as-toast, (3) view-load-failure-as-toast.

---

## TODO — what to fix, how, why

Ordered by impact. Check off as done. Each item: **What → How → Why**.

### P0 — Correctness bug

- [ ] **Offline queue makes success toasts lie.**
  - **Where:** `src/api/axiosConfig.ts` (~L174–209); affects every green "…successfully!"
    toast app-wide.
  - **What:** When offline, `POST/PUT/DELETE` are pushed to a Dexie `syncQueue` and the
    interceptor **resolves with a mock 200** (`response.isOfflineQueueMock === true`). Callers
    think the write succeeded, so *every* success toast fires even though nothing reached the
    server. No component listens to the already-dispatched `offline-sync-queued` /
    `offline-sync-complete` events (verified: `dispatchEvent` exists, zero `addEventListener`),
    and there is no offline banner — so the false toast is the **only** feedback.
  - **How:** Gate success toasts on `!response.isOfflineQueueMock`, OR reword to a queued
    message (e.g. *"Saved — will sync when you're back online"*, neutral tone). Add a real
    offline/sync indicator that consumes the `offline-sync-*` events so the user knows a
    replay is pending/complete.
  - **Why:** A confirmation that claims persistence when nothing was persisted is actively
    misleading and can cause data-loss surprises on failed replay. Highest-value fix.

### P1 — Wrong pattern (UX correctness)

- [ ] **Convert form-field validation from toasts to inline errors.**
  - **Where:** `ForgotPassword.tsx:49`, `CreateTagModal.tsx:65`, `CreateWalletModal.tsx:77`,
    `SubscriptionModal.tsx:136/138/139`, `CreateInviteForm.tsx:33`, `OAuthConsent.tsx:173/179`,
    `TokensSection.tsx:176/181`.
  - **What:** Client-side validation of a *visible* field is announced with a 3s toast.
  - **How:** Mark the field `invalid` (the `Input` primitive already supports `invalid`) and
    render the message beneath it — mirror `LoginForm.tsx`, which already does inline
    `require.username/password` + shake and never toasts on validation.
  - **Why:** A toast auto-dismisses before a keyboard/SR user can act, doesn't point at the
    offending field, and doesn't persist while they fix it. The codebase is currently
    internally inconsistent (LoginForm inline vs the rest toasting).

- [ ] **Replace mount-time view-load failures with an inline error + retry state.**
  - **Where (primary views):** `UserDashboard.tsx:56`, `AdminDashboard.tsx:69`,
    `WalletProvider.tsx:166`, `Backups.tsx:150`, `SystemTab.tsx:424`, `TokensSection.tsx:85`.
  - **Where (secondary, lower priority):** `ShareSettingsSection.tsx:40`,
    `OAuthConsent.tsx:98/135`, `AccountSection.tsx:114`, `TokensSection.tsx:130`.
  - **What:** A 3s toast fires on mount, vanishes, and leaves an empty screen with no recovery.
  - **How:** Render an inline error panel with a **Retry** button for primary views; a toast is
    tolerable for secondary widgets (e.g. a wallet dropdown) but the main dashboard/admin/tokens
    views should not rely on a disappearing toast.
  - **Why:** The most important failures get the weakest, most ephemeral feedback and no path
    to recover.

- [ ] **Blocking error must be a persistent page-error, not a toast.**
  - **Where:** `OAuthConsent.tsx:70` ("Invalid OAuth request — missing required parameters").
  - **What:** Early-`return`s and the consent flow cannot proceed, but the only feedback is a
    toast; the page is left stuck.
  - **How:** Use a persistent inline error state — the file already has this pattern
    (`hasReplayError`); reuse it.
  - **Why:** Critical, unrecoverable state should not be communicated by something that fades.

- [ ] **Move reactive-effect FX errors inline.**
  - **Where:** `ExchangeRateSection.tsx:114/118`.
  - **What:** Two near-duplicate red toasts fire from a `useEffect` on currency/toggle change
    (not on a user submit); can re-fire on every dependency change if the FX API is down.
  - **How:** Show the error inline next to the rate field; collapse the two messages
    (null-result vs thrown) into one.
  - **Why:** Selecting a currency shouldn't spam red toasts; effect-driven errors belong in
    the affected control, not a global toast.

- [ ] **"Nothing to export" is not an error.**
  - **Where:** `DataTab.tsx:78/107/125` (currently `success:false`, red).
  - **What:** An empty dataset is being shown as a red error.
  - **How:** Disable the export control when the collection is empty (preferred), or use a
    neutral/info tone instead of red.
  - **Why:** Red = failure. Flagging an expected empty state as an error is misleading.

- [ ] **Don't toast success right before a hard navigation.**
  - **Where:** `DeleteAccountSection.tsx:44` — toasts "Your account has been deleted." then
    `window.location.href = "/login"`.
  - **What:** The hard redirect tears down the page (and the toast host), so the user never
    sees the confirmation.
  - **How:** Surface the confirmation on the destination (login) screen, e.g. via route state.
    (Contrast: `ResetPassword:90` / `Register:106` use client-side `navigate()`, which keeps
    the toast host mounted — those are fine.)
  - **Why:** A confirmation nobody can see is dead code with a UX cost.

### P2 — Redundant / dead code

- [ ] **Delete unreachable validation toasts (submit already disabled).**
  - **Where:** `TransactionModal.tsx:92/94`, `Register.tsx:87/95`, `ResetPassword.tsx:80`.
  - **What:** The submit button is already `disabled` by the *same* predicate (`canSave` /
    `isFormValid`), and `Register`/`ResetPassword` also render a live `PasswordRequirements`
    component — so the toast branch is effectively unreachable and duplicates existing inline
    feedback.
  - **How:** Remove the toast branch (keep the disabled-button guard).
  - **Why:** Dead code + duplicated feedback.

- [ ] **Delete the 3 dead files (19 toast calls, never imported).**
  - **Where:** `modals/pat/PatModal.tsx` (superseded by `settings/sections/TokensSection.tsx`),
    `register/Register_old.tsx` (superseded by `register/Register.tsx`),
    `modals/wallet/ShareWalletModal.tsx` (superseded by
    `dashboard/settings/ShareSettingsSection.tsx`).
  - **How:** Confirm they're only referenced by their own tests, then delete the files (and
    those tests).
  - **Why:** Retired code that still shows up in greps and audits. **Confirm retirement before
    deleting.**

- [ ] **Standardize success feedback across equivalent flows.**
  - **What:** Some mutations toast on success, siblings don't: `TransactionModal` create/update
    is **silent** while `SubscriptionModal` toasts; `WalletProvider.handleUpdateTag` (L224) is
    silent while add/delete toast; `ShareSettingsSection.handleChangeRole` and
    `SystemTab.handleToggleEnabled` are silent.
  - **How:** Pick one convention (recommend: toast on every user-initiated mutation success)
    and apply it uniformly.
  - **Why:** Inconsistent feedback feels buggy and unpredictable.

- [ ] **De-duplicate the tag-created toast copy.**
  - **Where:** `CreateTagModal.tsx:77` "Parent Tag created!" vs `WalletProvider.tsx:187`
    "Tag created successfully!" — two POST-`/tags` paths, divergent wording.
  - **How:** Consolidate to one message (and ideally one code path).
  - **Why:** Same domain event, two strings.

- [ ] **Fix the "WalletCard" copy leak.**
  - **Where:** `CreateWalletModal.tsx:77` "WalletCard name is required", `:88` "WalletCard
    created successfully!".
  - **How:** "WalletCard" → "Wallet".
  - **Why:** Internal component/type name leaking into user-facing text.

- [ ] **(Optional) Reconsider silent invitations mount-load.**
  - **Where:** `useInvitations.ts:25` — `catch { setInvites([]) }`, no toast, unlike other
    mount-loads.
  - **How:** Leave as-is (the quieter choice is arguably better) or align once the mount-load
    pattern above is standardized.
  - **Why:** Noted only for consistency; low priority.

> **Out of scope but noticed:** several *code comments* (not toast strings) are in Italian —
> `UserDashboard.tsx`, `AdminDashboard.tsx`, `TransactionsTable.tsx:96` — which violates the
> repo's English-only rule. All toast **strings** are already English (compliant).

---

## Appendix — full live call-site table

Legend: `success` ✓ = green/true · ✗ = red/false · dyn = derived from a failure count.

### Auth & onboarding
| file:line | trigger | message | ✓/✗ | verdict |
|---|---|---|---|---|
| auth/Login.tsx:42 | demo-account POST catch | server msg / "Could not create demo account." | ✗ | APPROPRIATE |
| auth/LoginForm.tsx:96 | login POST catch (+ inline shake/field errors) | server msg / "Connection Error." | ✗ | APPROPRIATE |
| LandingPage/LandingPage.tsx:43 | demo-account POST catch | server msg / "Could not create demo account." | ✗ | APPROPRIATE |
| auth/ForgotPassword.tsx:49 | email-format validation | "Please enter a valid email address." | ✗ | QUESTIONABLE |
| auth/ForgotPassword.tsx:59 | reset email sent | "Reset email sent successfully!" | ✓ | APPROPRIATE |
| auth/ForgotPassword.tsx:63 | send failed catch | server msg / "Failed to send reset email." | ✗ | APPROPRIATE |
| auth/ForgotPassword.tsx:82 | resend success | "Reset email resent successfully!" | ✓ | APPROPRIATE |
| auth/ForgotPassword.tsx:84 | resend failed catch | server msg / "Failed to resend reset email." | ✗ | APPROPRIATE |
| auth/ResetPassword.tsx:80 | password-reqs validation (submit disabled) | "Please meet all password requirements." | ✗ | UNNECESSARY |
| auth/ResetPassword.tsx:90 | reset succeeded | "Password reset successfully! You can now log in." | ✓ | APPROPRIATE |
| auth/ResetPassword.tsx:95 | reset failed catch | server msg / "Error resetting password." | ✗ | APPROPRIATE |
| register/Register.tsx:87 | username-length validation (submit disabled) | "Username must be at least 3 characters long." | ✗ | UNNECESSARY |
| register/Register.tsx:95 | password-reqs validation (submit disabled) | "Please meet all password requirements." | ✗ | UNNECESSARY |
| register/Register.tsx:106 | registration succeeded | "Registration successful! You can now log in." | ✓ | APPROPRIATE |
| register/Register.tsx:111 | registration failed catch | server msg / "Error during registration." | ✗ | APPROPRIATE |

### OAuth consent
| file:line | trigger | message | ✓/✗ | verdict |
|---|---|---|---|---|
| auth/OAuthConsent.tsx:70 | missing OAuth params — blocks flow | "Invalid OAuth request — missing required parameters" | ✗ | QUESTIONABLE |
| auth/OAuthConsent.tsx:98 | token list load failed (mount) | "Failed to load tokens" | ✗ | QUESTIONABLE |
| auth/OAuthConsent.tsx:135 | wallet load failed | "Failed to load wallets" | ✗ | QUESTIONABLE |
| auth/OAuthConsent.tsx:161 | authorize-with-existing catch | server msg / "Authorization failed" | ✗ | APPROPRIATE |
| auth/OAuthConsent.tsx:173 | empty token-name validation | "Please enter a token name" | ✗ | QUESTIONABLE |
| auth/OAuthConsent.tsx:179 | no-wallet validation | "Select at least one wallet" | ✗ | QUESTIONABLE |
| auth/OAuthConsent.tsx:204 | create-and-authorize catch | server msg / "Failed to create token" | ✗ | APPROPRIATE |

### Modals (wallet / tag / subscription / transaction)
| file:line | trigger | message | ✓/✗ | verdict |
|---|---|---|---|---|
| modals/tags/CreateTagModal.tsx:65 | name-length validation | "Name must be at least 2 characters" | ✗ | QUESTIONABLE |
| modals/tags/CreateTagModal.tsx:77 | tag created | "Parent Tag created!" | ✓ | APPROPRIATE |
| modals/tags/CreateTagModal.tsx:81 | create failed catch | server msg / "Error creating tag" | ✗ | APPROPRIATE |
| modals/wallet/CreateWalletModal.tsx:77 | name validation (+"WalletCard" bug) | "WalletCard name is required" | ✗ | QUESTIONABLE |
| modals/wallet/CreateWalletModal.tsx:88 | wallet created (+"WalletCard" bug) | "WalletCard created successfully!" | ✓ | APPROPRIATE |
| modals/wallet/CreateWalletModal.tsx:92 | create failed catch | server msg / "Error creating wallet" | ✗ | APPROPRIATE |
| modals/subscription/SubscriptionDetailsModal.tsx:52 | subscription deleted | "Subscription deleted successfully" | ✓ | APPROPRIATE |
| modals/subscription/SubscriptionDetailsModal.tsx:56 | delete failed catch | server msg / "Error deleting." | ✗ | APPROPRIATE |
| modals/subscription/SubscriptionDetailsModal.tsx:91 | subscription stopped at date | "Subscription stopped at {date}" | ✓ | APPROPRIATE |
| modals/subscription/SubscriptionDetailsModal.tsx:95 | stop failed catch | server msg / "Error stopping subscription." | ✗ | APPROPRIATE |
| modals/subscription/SubscriptionModal.tsx:136 | amount validation | "Please enter a valid amount." | ✗ | QUESTIONABLE |
| modals/subscription/SubscriptionModal.tsx:138 | category validation | "Please select a category." | ✗ | QUESTIONABLE |
| modals/subscription/SubscriptionModal.tsx:139 | type validation | "Please select income or expense." | ✗ | QUESTIONABLE |
| modals/subscription/SubscriptionModal.tsx:175 | subscription updated | "Subscription updated successfully!" | ✓ | APPROPRIATE |
| modals/subscription/SubscriptionModal.tsx:178 | subscription created | "Subscription created successfully!" | ✓ | APPROPRIATE |
| modals/subscription/SubscriptionModal.tsx:185 | save failed catch | server msg / "Error {creating/updating} subscription" | ✗ | APPROPRIATE |
| modals/TransactionModal/TransactionModal.tsx:92 | amount validation (Save disabled by `canSave`) | "Please enter a valid amount." | ✗ | UNNECESSARY |
| modals/TransactionModal/TransactionModal.tsx:94 | category validation (button disabled) | "Please select a category." | ✗ | UNNECESSARY |
| modals/TransactionModal/TransactionModal.tsx:125 | save failed catch (no success toast) | server msg / "Error {creating/updating} transaction" | ✗ | APPROPRIATE |
| modals/TransactionModal/ExchangeRateSection.tsx:114 | FX rate null — from a `useEffect` | "Could not retrieve exchange rate." | ✗ | QUESTIONABLE |
| modals/TransactionModal/ExchangeRateSection.tsx:118 | FX fetch threw (same effect) | "Error fetching exchange rate." | ✗ | QUESTIONABLE |

### Dashboard / wallet
| file:line | trigger | message | ✓/✗ | verdict |
|---|---|---|---|---|
| dashboard/transaction/TransactionsTable.tsx:99 | delete tx catch (delete silent-success) | server msg / "Error deleting transaction" | ✗ | APPROPRIATE |
| dashboard/wallet/useInvitations.ts:41 | invitation accepted | "Invitation accepted!" | ✓ | APPROPRIATE |
| dashboard/wallet/useInvitations.ts:44 | accept failed catch | server msg / "Could not accept invitation" | ✗ | APPROPRIATE |
| dashboard/wallet/useInvitations.ts:57 | invitation rejected | "Invitation rejected" | ✓ | APPROPRIATE |
| dashboard/wallet/useInvitations.ts:59 | reject failed catch | server msg / "Could not reject invitation" | ✗ | APPROPRIATE |
| dashboard/settings/ShareSettingsSection.tsx:40 | member load failed (mount) | "Error loading wallet members." | ✗ | QUESTIONABLE |
| dashboard/settings/ShareSettingsSection.tsx:63 | invitation sent | "Invitation sent to {id}!" | ✓ | APPROPRIATE |
| dashboard/settings/ShareSettingsSection.tsx:67 | invite failed catch | server msg / "Error sending invite" | ✗ | APPROPRIATE |
| dashboard/settings/ShareSettingsSection.tsx:88 | member removed | "{name} removed successfully." | ✓ | APPROPRIATE |
| dashboard/settings/ShareSettingsSection.tsx:91 | remove failed catch | "Error removing member." | ✗ | APPROPRIATE |
| dashboard/settings/ShareSettingsSection.tsx:107 | role change failed (no success toast) | "Error updating role." | ✗ | APPROPRIATE |
| dashboard/UserDashboard.tsx:56 | initial data load failed (mount) | "Error loading data" | ✗ | QUESTIONABLE |
| dashboard/UserDashboard.tsx:113 | wallet deleted / left | "Deleted!" (or caller msg) | ✓ | APPROPRIATE |
| dashboard/UserDashboard.tsx:115 | delete failed catch | server msg / "Error deleting." | ✗ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:166 | wallet data load failed | "Error loading data for {name}" | ✗ | QUESTIONABLE |
| dashboard/wallet/WalletProvider.tsx:187 | tag created (dup, different wording) | "Tag created successfully!" | ✓ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:190 | create tag failed catch | server msg / "Error creating tag" | ✗ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:224 | update tag failed (no success toast) | server msg / "Error updating tag" | ✗ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:238 | tag deleted | "Tag deleted!" | ✓ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:241 | delete tag failed catch | server msg / "Error deleting tag" | ✗ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:253 | wallet updated | "Wallet updated successfully!" | ✓ | APPROPRIATE |
| dashboard/wallet/WalletProvider.tsx:257 | update wallet failed catch | server msg / "Error updating wallet" | ✗ | APPROPRIATE |

### Admin
| file:line | trigger | message | ✓/✗ | verdict |
|---|---|---|---|---|
| admin/AdminDashboard.tsx:69 | dashboard data load failed (mount) | server msg / "Error loading dashboard data" | ✗ | QUESTIONABLE |
| admin/AdminDashboard.tsx:86 | user deleted | "Deleted!" | ✓ | APPROPRIATE |
| admin/AdminDashboard.tsx:88 | delete failed catch | server msg / "Error deleting." | ✗ | APPROPRIATE |
| admin/AdminDashboard.tsx:106 | invite revoked (after `window.confirm`) | "Invite revoked!" | ✓ | APPROPRIATE |
| admin/AdminDashboard.tsx:108 | revoke failed catch | server msg / "Error revoking invite." | ✗ | APPROPRIATE |
| admin/CreateInviteForm.tsx:33 | email validation | "Please enter a valid email address." | ✗ | QUESTIONABLE |
| admin/CreateInviteForm.tsx:43 | invite sent | "Invite sent successfully!" | ✓ | APPROPRIATE |
| admin/CreateInviteForm.tsx:48 | send failed catch | server msg / "Failed to send invite" | ✗ | APPROPRIATE |
| admin/InvitesTable.tsx:49 | invite link copied | "Invite link copied to clipboard" | ✓ | APPROPRIATE |
| admin/SystemTab.tsx:187 | schedule updated | "Schedule updated" | ✓ | APPROPRIATE |
| admin/SystemTab.tsx:190 | schedule update failed catch | server msg / "Could not update schedule" | ✗ | APPROPRIATE |
| admin/SystemTab.tsx:202 | job enable/disable failed (no success toast) | server msg / "Could not update job" | ✗ | APPROPRIATE |
| admin/SystemTab.tsx:212 | job run-now succeeded | "{job} ran" | ✓ | APPROPRIATE |
| admin/SystemTab.tsx:215 | run failed catch | server msg / "Run failed" | ✗ | APPROPRIATE |
| admin/SystemTab.tsx:424 | jobs load failed (mount) | server msg / "Could not load jobs" | ✗ | QUESTIONABLE |
| admin/Backups.tsx:150 | backup list load failed (mount) | server msg / "Could not load backup list" | ✗ | QUESTIONABLE |
| admin/Backups.tsx:166 | backup ran | "Backup completed successfully!" | ✓ | APPROPRIATE |
| admin/Backups.tsx:169 | backup failed catch | server msg / "Error during backup" | ✗ | APPROPRIATE |
| admin/Backups.tsx:189 | file uploaded | "File uploaded successfully!" | ✓ | APPROPRIATE |
| admin/Backups.tsx:192 | upload failed catch | server msg / "Error during upload" | ✗ | APPROPRIATE |
| admin/Backups.tsx:218 | single download failed catch | server msg / "Backup not found" | ✗ | APPROPRIATE |
| admin/Backups.tsx:260 | bulk download finished | "Downloaded N…" / "…M failed" | dyn | APPROPRIATE |
| admin/Backups.tsx:281 | restore completed | "Restore completed!" | ✓ | APPROPRIATE |
| admin/Backups.tsx:284 | backup deleted | "Backup deleted" | ✓ | APPROPRIATE |
| admin/Backups.tsx:298 | bulk delete finished | "Deleted N…" / "…M failed" | dyn | APPROPRIATE |
| admin/Backups.tsx:309 | restore/delete failed catch | server msg / "Error during restore\|deleting backup" | ✗ | APPROPRIATE |

### Settings (Account / Security / Tokens / Delete / Data)
| file:line | trigger | message | ✓/✗ | verdict |
|---|---|---|---|---|
| settings/sections/SecuritySection.tsx:109 | password updated | "Password updated successfully!" | ✓ | APPROPRIATE |
| settings/sections/SecuritySection.tsx:114 | change-password failed catch | server msg / "Error updating password" | ✗ | APPROPRIATE |
| settings/sections/AccountSection.tsx:114 | profile load failed (mount) | server msg / "Failed to load profile" | ✗ | QUESTIONABLE |
| settings/sections/AccountSection.tsx:140 | username updated | "Username updated" | ✓ | APPROPRIATE |
| settings/sections/AccountSection.tsx:142 | username update failed catch | server msg / "Failed to update username" | ✗ | APPROPRIATE |
| settings/sections/AccountSection.tsx:178 | email-change codes sent | "Verification codes sent" | ✓ | APPROPRIATE |
| settings/sections/AccountSection.tsx:180 | send-codes failed catch | server msg / "Failed to send verification codes" | ✗ | APPROPRIATE |
| settings/sections/AccountSection.tsx:202 | email updated | "Email updated" | ✓ | APPROPRIATE |
| settings/sections/AccountSection.tsx:204 | email confirm failed catch | server msg / "Failed to update email" | ✗ | APPROPRIATE |
| settings/sections/AccountSection.tsx:216 | cancel email-change cleanup failed | server msg / "Failed to cancel email change" | ✗ | QUESTIONABLE |
| settings/sections/DeleteAccountSection.tsx:44 | account deleted, then `window.location.href` | "Your account has been deleted." | ✓ | QUESTIONABLE |
| settings/sections/DeleteAccountSection.tsx:53 | delete failed catch | server msg / "Could not delete account" | ✗ | APPROPRIATE |
| settings/sections/TokensSection.tsx:85 | token load failed (mount) | server msg / "Failed to load tokens" | ✗ | QUESTIONABLE |
| settings/sections/TokensSection.tsx:130 | wallet load failed | "Failed to load wallets" | ✗ | QUESTIONABLE |
| settings/sections/TokensSection.tsx:176 | empty token-name validation | "Please enter a token name" | ✗ | QUESTIONABLE |
| settings/sections/TokensSection.tsx:181 | no-wallet validation | "Select at least one wallet" | ✗ | QUESTIONABLE |
| settings/sections/TokensSection.tsx:198 | permissions updated | "Token permissions updated!" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:206 | token created | "Token created successfully!" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:209 | save failed catch | server msg / "Failed to save token" | ✗ | APPROPRIATE |
| settings/sections/TokensSection.tsx:220 | token revoked | "Access revoked" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:222 | revoke failed catch | server msg / "Failed to revoke token" | ✗ | APPROPRIATE |
| settings/sections/TokensSection.tsx:235 | token paused/resumed | "Token paused" / "Token resumed" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:237 | pause/resume failed catch | server msg / "Failed to update token" | ✗ | APPROPRIATE |
| settings/sections/TokensSection.tsx:264 | bulk delete done | "Token deleted" / "N tokens deleted" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:271 | bulk delete failed catch | server msg / "Failed to delete tokens" | ✗ | APPROPRIATE |
| settings/sections/TokensSection.tsx:286 | bulk pause/resume done | "N tokens paused/resumed" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:293 | bulk pause failed catch | server msg / "Failed to update tokens" | ✗ | APPROPRIATE |
| settings/sections/TokensSection.tsx:303 | token copied | "Token copied to clipboard!" | ✓ | APPROPRIATE |
| settings/sections/TokensSection.tsx:306 | clipboard write failed | "Failed to copy" | ✗ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:78 | export clicked, empty dataset | "No transactions to export" | ✗ | QUESTIONABLE |
| dashboard/settings/DataTab.tsx:102 | transactions CSV exported | "Transactions exported successfully" | ✓ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:107 | empty tags export | "No tags to export" | ✗ | QUESTIONABLE |
| dashboard/settings/DataTab.tsx:120 | tags CSV exported | "Tags exported successfully" | ✓ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:125 | empty subscriptions export | "No subscriptions to export" | ✗ | QUESTIONABLE |
| dashboard/settings/DataTab.tsx:152 | subscriptions CSV exported | "Subscriptions exported successfully" | ✓ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:182 | transactions imported | "Imported N transactions" | ✓ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:186 | tags imported | "Imported N tags" | ✓ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:193 | subscriptions imported | "Imported N subscriptions" | ✓ | APPROPRIATE |
| dashboard/settings/DataTab.tsx:199 | import failed catch | server msg / "Import failed" | ✗ | APPROPRIATE |

### Dead files (never imported — delete; not audited in depth)
| file | toast calls |
|---|---|
| modals/pat/PatModal.tsx | superseded by settings/sections/TokensSection.tsx |
| register/Register_old.tsx | superseded by register/Register.tsx |
| modals/wallet/ShareWalletModal.tsx | superseded by dashboard/settings/ShareSettingsSection.tsx |
