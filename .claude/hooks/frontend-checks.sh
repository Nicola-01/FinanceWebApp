#!/usr/bin/env bash
# Stop hook: riesegue i controlli del frontend SOLO se in questo turno è stato
# modificato un file sotto frontend/ (marker creato dal hook PostToolUse frontend-mark.sh).
# Esegue gli stessi controlli della CI (.github/workflows/deploy.yml, job build-frontend),
# più i test cablati anche in pipeline: lint (ESLint + Prettier) -> test (Vitest) ->
# build (tsc -b && vite build). Ordine fail-fast per costo crescente, come la CI.
# In caso di fallimento esce con codice 2 per "risvegliare" Claude (asyncRewake)
# e passargli l'output degli errori.
set -uo pipefail

: "${CLAUDE_PROJECT_DIR:=$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "${CLAUDE_PROJECT_DIR:-}" ] || exit 0

marker="$CLAUDE_PROJECT_DIR/.claude/.frontend-dirty"
[ -f "$marker" ] || exit 0     # frontend non toccato in questo turno -> niente da fare
rm -f "$marker"                # consuma il marker: il prossimo turno riparte pulito

cd "$CLAUDE_PROJECT_DIR/frontend" 2>/dev/null || exit 0

fail() {
  step="$1"; out="$2"
  echo "I controlli del frontend sono FALLITI ($step) dopo le tue modifiche di questo turno."
  echo "Correggi gli errori (e aggiorna/aggiungi i test se serve), poi rilancia."
  echo "---- ultime righe dell'output ($step) ----"
  printf '%s\n' "$out" | tail -n 40
  exit 2
}

out="$(npm run lint 2>&1)" || fail "npm run lint" "$out"
out="$(npm test 2>&1)"     || fail "npm test" "$out"
out="$(npm run build 2>&1)" || fail "npm run build" "$out"

exit 0
