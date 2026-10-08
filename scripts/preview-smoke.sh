#!/usr/bin/env bash
set -euo pipefail

HOST="127.0.0.1"
PORT="4173"
ORIGIN="http://${HOST}:${PORT}"
BASE_URL="${ORIGIN}/owner"
LOG_FILE="${TMPDIR:-/tmp}/chief-preview.log"
HEADER_FILE="${TMPDIR:-/tmp}/chief-preview-headers.txt"
BODY_FILE="${TMPDIR:-/tmp}/chief-preview-body.html"
BROWSER_DOM="${TMPDIR:-/tmp}/chief-browser-dom.html"

npm run preview -- --host "${HOST}" --port "${PORT}" >"${LOG_FILE}" 2>&1 &
PREVIEW_PID=$!
cleanup() { kill "${PREVIEW_PID}" >/dev/null 2>&1 || true; }
trap cleanup EXIT

READY=0
for _ in $(seq 1 30); do
  if curl -fsS -D "${HEADER_FILE}" -o "${BODY_FILE}" "${BASE_URL}/"; then READY=1; break; fi
  sleep 1
done
if [ "${READY}" -ne 1 ]; then echo "ERROR: Vite preview did not become reachable."; cat "${LOG_FILE}" || true; exit 1; fi

grep -q "CHIEF Operational Command" "${BODY_FILE}"
grep -qi '^x-content-type-options: nosniff' "${HEADER_FILE}"
grep -qi '^x-frame-options: DENY' "${HEADER_FILE}"
grep -qi '^referrer-policy: no-referrer' "${HEADER_FILE}"
grep -qi '^permissions-policy:' "${HEADER_FILE}"

curl -fsS "${BASE_URL}/manifest.webmanifest" | grep -q '"scope": "/owner/"'
curl -fsS "${BASE_URL}/sw.js" | grep -q 'chief-owner-static-'
curl -fsS -o /dev/null "${BASE_URL}/pwa-192x192.png"
curl -fsS -o /dev/null "${BASE_URL}/pwa-512x512.png"

# HashRouter routes remain within /owner/ and must return the same shell.
for route in '#/agents' '#/inbox' '#/more'; do
  curl -fsS "${BASE_URL}/${route}" | grep -q "CHIEF Operational Command"
done

BROWSER_BIN=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "${candidate}" >/dev/null 2>&1; then BROWSER_BIN="$(command -v "${candidate}")"; break; fi
done
if [ -z "${BROWSER_BIN}" ]; then echo "ERROR: No Chrome/Chromium browser found on the CI runner."; exit 1; fi

"${BROWSER_BIN}" \
  --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --virtual-time-budget=2500 --dump-dom "${BASE_URL}/" >"${BROWSER_DOM}" 2>/dev/null

python3 - "${BROWSER_DOM}" <<'PY'
import pathlib
import re
import sys
html = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
match = re.search(r'<div\s+id="root"[^>]*>(.*?)</div>', html, re.S)
if not match or not match.group(1).strip():
    raise SystemExit('ERROR: Headless browser loaded the document but React did not render into #root.')
if 'CHIEF Operational Command' not in html:
    raise SystemExit('ERROR: Rendered browser DOM is missing the Chief application identity.')
PY

echo "CHIEF Owner /owner/ preview HTTP + headless browser smoke checks passed."
