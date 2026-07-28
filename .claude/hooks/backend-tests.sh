#!/usr/bin/env bash
# Stop hook: riesegue la suite di test del backend SOLO se in questo turno è stato
# modificato un file sotto backend/ (marker creato dal hook PostToolUse backend-mark.sh).
# In caso di fallimento esce con codice 2 per "risvegliare" Claude (asyncRewake)
# e passargli l'output degli errori.
set -uo pipefail

: "${CLAUDE_PROJECT_DIR:=$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "${CLAUDE_PROJECT_DIR:-}" ] || exit 0

marker="$CLAUDE_PROJECT_DIR/.claude/.backend-dirty"
[ -f "$marker" ] || exit 0     # backend non toccato in questo turno -> niente da fare
rm -f "$marker"                # consuma il marker: il prossimo turno riparte pulito

cd "$CLAUDE_PROJECT_DIR/backend" 2>/dev/null || exit 0

# This hook runs as a fresh non-login shell, so it never sources ~/.bashrc — if JAVA_HOME
# isn't already exported, fall back to autodetecting a JDK (JetBrains/IDE-managed or system).
if [ -z "${JAVA_HOME:-}" ] && ! command -v java >/dev/null 2>&1; then
  for candidate in "$HOME"/.jdks/*/ /usr/lib/jvm/*/; do
    if [ -x "${candidate}bin/java" ]; then
      JAVA_HOME="${candidate%/}"
      export JAVA_HOME
      break
    fi
  done
fi

out="$(./gradlew test --console=plain 2>&1)"
status=$?

if [ "$status" -ne 0 ]; then
  echo "I test del backend sono FALLITI (./gradlew test) dopo le tue modifiche di questo turno."
  echo "Correggi i test rossi e assicurati di aver aggiunto/aggiornato i test per le modifiche fatte, poi rilancia."
  echo "---- ultime righe dell'output ----"
  echo "$out" | tail -n 40
  exit 2
fi

exit 0
