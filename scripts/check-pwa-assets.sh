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
  local clean_path="${asset_path#%BASE_URL%}"
  clean_path="${clean_path#/owner/}"
  clean_path="${clean_path#/}"
  local full_path="${PUBLIC_DIR}/${clean_path}"
  if [ ! -f "${full_path}" ]; then
    echo "ERROR: Missing required PWA asset: ${asset_path} (looked at ${full_path})"
    FAILED=1
  else
    echo "OK: ${asset_path} exists ($(wc -c < "${full_path}") bytes)"
  fi
}

MANIFEST="${PUBLIC_DIR}/manifest.webmanifest"
if [ ! -f "${MANIFEST}" ]; then echo "ERROR: manifest.webmanifest not found"; exit 1; fi

ICON_SRCS=$(grep -o '"src": *"[^"]*"' "${MANIFEST}" | sed -E 's/"src": *"([^"]*)"/\1/')
for src in ${ICON_SRCS}; do
  case "${src}" in /owner/*) ;; *) echo "ERROR: Owner manifest asset escaped /owner/: ${src}"; FAILED=1 ;; esac
  check_file "${src}"
done

INDEX_HTML="${PROJECT_ROOT}/index.html"
APPLE_ICON=$(grep -o 'rel="apple-touch-icon" href="[^"]*"' "${INDEX_HTML}" | sed -E 's/.*href="([^"]*)".*/\1/')
if [ -n "${APPLE_ICON}" ]; then
  [ "${APPLE_ICON}" = "%BASE_URL%apple-touch-icon.png" ] || { echo "ERROR: Apple icon is not base-safe: ${APPLE_ICON}"; FAILED=1; }
  check_file "${APPLE_ICON}"
else
  echo "ERROR: No apple-touch-icon link tag found in index.html"; FAILED=1
fi

PRECACHE_FILES=("/manifest.webmanifest" "/icon.svg" "/pwa-192x192.png" "/pwa-512x512.png" "/pwa-512x512-maskable.png" "/apple-touch-icon.png")
for asset in "${PRECACHE_FILES[@]}"; do check_file "${asset}"; done

echo "============================================================"
if [ "${FAILED}" -ne 0 ]; then
  echo "FAILED: PWA static asset integrity check failed."; exit 1
fi
echo "PASSED: Owner-scoped PWA assets exist and are verified."
