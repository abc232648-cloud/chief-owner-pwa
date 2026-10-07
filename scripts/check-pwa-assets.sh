#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "CHIEF Mobile - PWA Static Asset Integrity Validation"
echo "============================================================"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="${PROJECT_ROOT}/public"

FAILED=0

check_file() {
  local asset_path="$1"
  local clean_path="${asset_path#/}"
  local full_path="${PUBLIC_DIR}/${clean_path}"

  if [ ! -f "${full_path}" ]; then
    echo "ERROR: Missing required PWA asset: ${asset_path} (looked at ${full_path})"
    FAILED=1
  else
    echo "OK: ${asset_path} exists ($(wc -c < "${full_path}") bytes)"
  fi
}

echo "1. Checking manifest.webmanifest icons..."
MANIFEST="${PUBLIC_DIR}/manifest.webmanifest"
if [ ! -f "${MANIFEST}" ]; then
  echo "ERROR: manifest.webmanifest not found at ${MANIFEST}"
  exit 1
fi

# Extract icon src entries from manifest.webmanifest
ICON_SRCS=$(grep -o '"src": *"[^"]*"' "${MANIFEST}" | sed -E 's/"src": *"([^"]*)"/\1/')
for src in ${ICON_SRCS}; do
  check_file "${src}"
done

echo ""
echo "2. Checking index.html Apple Touch Icon..."
INDEX_HTML="${PROJECT_ROOT}/index.html"
if [ ! -f "${INDEX_HTML}" ]; then
  echo "ERROR: index.html not found at ${INDEX_HTML}"
  exit 1
fi

APPLE_ICON=$(grep -o 'rel="apple-touch-icon" href="[^"]*"' "${INDEX_HTML}" | sed -E 's/.*href="([^"]*)".*/\1/')
if [ -n "${APPLE_ICON}" ]; then
  check_file "${APPLE_ICON}"
else
  echo "ERROR: No apple-touch-icon link tag found in index.html"
  FAILED=1
fi

echo ""
echo "3. Checking sw.js precached static assets..."
SW_JS="${PUBLIC_DIR}/sw.js"
if [ ! -f "${SW_JS}" ]; then
  echo "ERROR: sw.js not found at ${SW_JS}"
  exit 1
fi

# For precache list items that map to files in public/
PRECACHE_FILES=(
  "/manifest.webmanifest"
  "/icon.svg"
  "/pwa-192x192.png"
  "/pwa-512x512.png"
  "/pwa-512x512-maskable.png"
  "/apple-touch-icon.png"
)

for asset in "${PRECACHE_FILES[@]}"; do
  check_file "${asset}"
done

echo "============================================================"
if [ "${FAILED}" -ne 0 ]; then
  echo "FAILED: PWA static asset integrity check failed."
  exit 1
else
  echo "PASSED: All PWA static assets exist and are verified."
  echo "============================================================"
  exit 0
fi
