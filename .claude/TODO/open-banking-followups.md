# Open Banking — follow-ups (deferred from v1)

Spec: `docs/superpowers/specs/2026-10-27-open-banking-design.md` (non-goal of v1).

- [ ] When importing history on first link, match bank transactions against existing
  **manual** transactions of the wallet (date ± few days, same amount/type) and keep only
  the unmatched ones as new "to categorize" imports. Matched pairs: attach the bank
  `externalId` to the manual transaction (record it in the dedup ledger) instead of
  creating a duplicate. Needs a review step for ambiguous matches.

- [ ] **Card + account double counting.** Linking both a card and the account that pays
  its monthly settlement counts spending twice. Agreed direction: a per-link rule
  ("description contains X"). Open choice: skip matching movements (record them in the
  dedup ledger + "N ignored by rule" counter — one-line change) vs import them as
  internal transfers excluded from balance/charts (touches ~27 frontend aggregation
  files + budgets + PDF reports).
