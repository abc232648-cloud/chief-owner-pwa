#!/usr/bin/env bash
set -euo pipefail

HOST="127.0.0.1"
PORT="4173"
BASE_URL="http://${HOST}:${PORT}"
LOG_FILE="${TMPDIR:-/tmp}/chief-preview.log"
HEADER_FILE="${TMPDIR:-/tmp}/chief-preview-headers.txt"
BODY_FILE="${TMPDIR:-/tmp}/chief-preview-body.html"

npm run preview -- --host "${HOST}" --port "${PORT}" >"${LOG_FILE}" 2>&1 &
PREVIEW_PID=$!
cleanup() {
  kill "${PREVIEW_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

READY=0
for _ in $(seq 1 30); do
  if curl -fsS -D "${HEADER_FILE}" -o "${BODY_FILE}" "${BASE_URL}/"; then
    READY=1
    break
  fi
  sleep 1
done

if [ "${READY}" -ne 1 ]; then
  echo "ERROR: Vite preview did not become reachable."
  cat "${LOG_FILE}" || true
  exit 1
fi

grep -q "CHIEF Operational Command" "${BODY_FILE}"
grep -qi '^x-content-type-options: nosniff' "${HEADER_FILE}"
grep -qi '^x-frame-options: DENY' "${HEADER_FILE}"
grep -qi '^referrer-policy: no-referrer' "${HEADER_FILE}"
grep -qi '^permissions-policy:' "${HEADER_FILE}"

curl -fsS "${BASE_URL}/manifest.webmanifest" | grep -q '"name"'
curl -fsS "${BASE_URL}/sw.js" | grep -q 'chief-static-'
curl -fsS -o /dev/null "${BASE_URL}/pwa-192x192.png"
curl -fsS -o /dev/null "${BASE_URL}/pwa-512x512.png"

# Vite SPA fallback must return the app shell for client routes.
curl -fsS "${BASE_URL}/agents" | grep -q "CHIEF Operational Command"
curl -fsS "${BASE_URL}/inbox" | grep -q "CHIEF Operational Command"
curl -fsS "${BASE_URL}/more" | grep -q "CHIEF Operational Command"

echo "CHIEF preview HTTP smoke check passed."
