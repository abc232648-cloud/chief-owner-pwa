#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "CHIEF Mobile - Frontend Secret Safety Sanity Check"
echo "============================================================"

FAILED=0

# 1. Verify no live .env files are tracked (only .env.example allowed)
FORBIDDEN_ENV_FILES=(".env" ".env.local" ".env.production" ".env.development")
for env_file in "${FORBIDDEN_ENV_FILES[@]}"; do
  if [ -f "$env_file" ]; then
    echo "::error::Committed environment file found: $env_file. Only .env.example may be committed."
    FAILED=1
  fi
done

# 2. Check for assigned provider API keys/secrets across repo
# Strict regex patterns matching variable assignments prevent false positives from documentation.
PATTERNS=(
  'GEMINI_API_KEY[[:space:]]*=[[:space:]]*[A-Za-z0-9_-]{8,}'
  'VITE_GEMINI_API_KEY[[:space:]]*=[[:space:]]*[A-Za-z0-9_-]{8,}'
  'OPENAI_API_KEY[[:space:]]*=[[:space:]]*sk-[A-Za-z0-9_-]{8,}'
  'ANTHROPIC_API_KEY[[:space:]]*=[[:space:]]*sk-ant-[A-Za-z0-9_-]{8,}'
  'AI_STUDIO_KEY[[:space:]]*=[[:space:]]*[A-Za-z0-9_-]{8,}'
)

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -rnE --exclude-dir={node_modules,dist,.git} "$pattern" . 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    while IFS= read -r match_line; do
      FILE=$(echo "$match_line" | cut -d: -f1)
      LINE=$(echo "$match_line" | cut -d: -f2)
      echo "::error::Forbidden provider secret pattern detected in $FILE on line $LINE (value masked)"
      FAILED=1
    done <<< "$MATCHES"
  fi
done

if [ "$FAILED" -ne 0 ]; then
  echo "FAILED: Potential provider secrets detected in codebase."
  exit 1
fi

echo "PASSED: No forbidden provider secrets or committed env files found."
echo "============================================================"
