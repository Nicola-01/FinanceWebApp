#!/usr/bin/env bash
# PostToolUse (Write|Edit): se il file appena scritto/modificato sta sotto backend/,
# marca il turno corrente come "backend toccato" creando un file marker.
# Lo Stop hook userà questo marker per decidere se rieseguire i test.
set -uo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)"
[ -n "$file" ] || exit 0

# Interessano solo le modifiche sotto backend/
case "$file" in
  */backend/*|backend/*) : ;;
  *) exit 0 ;;
esac

: "${CLAUDE_PROJECT_DIR:=$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "${CLAUDE_PROJECT_DIR:-}" ] || exit 0

touch "$CLAUDE_PROJECT_DIR/.claude/.backend-dirty" 2>/dev/null || true
exit 0
