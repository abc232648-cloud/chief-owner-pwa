# Chief Mobile — Production Deployment Security Boundary

This repository builds the Chief Owner Mobile PWA. The application code enforces client-side safety boundaries, but the hosting platform and Chief backend remain separate trust boundaries.

## Required production hosting controls

The production host should serve the built `dist/` directory over HTTPS and apply these response headers (or stricter equivalents):

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: geolocation=(), microphone=(), payment=(), camera=(self)
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`frame-ancestors` and HSTS must be supplied as HTTP response headers; a document `<meta>` policy is not a substitute for those controls.

## Routing

The host must support SPA fallback to `index.html` for Chief client routes such as:

- `/agents`
- `/inbox`
- `/activity`
- `/more`

Static files such as `/manifest.webmanifest`, `/sw.js`, icons and hashed build assets must be served directly and must not be rewritten to `index.html`.

## Service worker

- Serve `/sw.js` with JavaScript MIME type.
- Do not rewrite `/sw.js` to an HTML fallback.
- Avoid long immutable caching for `/sw.js`; clients must be able to discover updates.
- Hashed `/assets/*` files may use long immutable cache lifetimes.
- The service worker must remain scoped to the Chief Mobile origin.
- Chief API/auth/mutation responses must not be transformed into offline synthetic success responses by a CDN, reverse proxy or edge worker.

## Chief API boundary

Production must provide the real Chief backend under the configured same-origin `/api/v1` route or an explicitly configured `VITE_CHIEF_API_BASE_URL`.

The deployment must preserve these application invariants:

- HTTP/network failure is not a Chief rejection.
- 401/403 fail closed and do not become cached-auth success.
- STOP cannot be overridden by the mobile client.
- ASK cannot silently become AUTO.
- Worker report acceptance requires explicit backend `accepted` state plus a verification/receipt identifier.
- Job/Farm development fixtures must never be exposed as production operational truth.
- Model provider/API credentials must remain server-side and must never be injected into the frontend build.

## Environment configuration

Production:

```text
VITE_CHIEF_DEV_MODE=false
VITE_CHIEF_API_BASE_URL=/api/v1
```

`VITE_CHIEF_DEV_MODE` must never be enabled in a production build. Development personas and fixture data are construction/test facilities only.

## Release gate

Before deployment, the exact commit being deployed should have a successful GitHub `CI` workflow run containing all of these gates:

1. secret-safety check
2. deterministic `npm ci`
3. high-severity dependency audit
4. PWA asset validation
5. source-safety lint
6. TypeScript typecheck
7. safety invariant tests
8. production build
9. static release smoke check
10. built preview HTTP smoke check

A green source build alone is not sufficient evidence of release readiness.

## Known external dependency

Real production authentication and authoritative Job/Farm data depend on Chief backend endpoints being provisioned. The mobile application intentionally fails closed or shows unavailable state when those authoritative services are absent; it must not substitute fixtures or manufacture success.
