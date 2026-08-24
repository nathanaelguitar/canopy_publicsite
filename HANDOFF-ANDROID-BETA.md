# HANDOFF: Android Free Beta Wiring (Codex)

Status: **Frontend complete, backend not yet wired.** Everything below is what
needs to be built on the Worker so the new page works end to end.

## What shipped (frontend, this repo)

- `android-beta.html` — free Android beta landing page at `/android-beta`.
  Copy states six free spots, how Play closed testing works, and collects a
  Google Play email. No payment anywhere on the page.
- `assets/android-beta.js` — form logic. Validates the email, POSTs it to the
  API, and renders success / full / rate-limited / error states.
- `founding.html` — new screen `04/05` (`#device`) inserted between Membership
  and Contribute. iPhone continues down the existing Stripe contribution flow;
  Android links out to `/android-beta`. Screens renumbered 02–05 of 05.
- `assets/styles.css` — `.founding-screen-device*` rules for the funnel step
  and `.android-*` rules for the landing page.

## API contract the frontend already implements

`POST https://founding-api.canopychat.app/v1/android-beta`

Request body:

```json
{ "email": "someone@gmail.com" }
```

Responses the frontend handles:

| Status | Body                          | Frontend behavior                                   |
| ------ | ----------------------------- | --------------------------------------------------- |
| 200    | `{ "already_claimed": bool }` | Success panel; `true` shows "You're already on the list." |
| 400    | any                           | "Enter the email address you use with Google Play." |
| 409    | any                           | Capacity message ("All 6 spots are claimed…")        |
| 429    | any                           | Rate-limit message                                   |
| other  | —                             | Generic try-again                                    |

Notes:

- The frontend does **not** display a live spots-remaining count. Keep the
  count server-side; do not add it to responses unless product changes.
- Idempotency: re-submitting an already-accepted email should return 200 with
  `already_claimed: true`, not consume a second spot.
- CORS must behave like the other browser endpoints (see below).

## Worker implementation (local_ai_aether/founding_members/worker)

### 1. Migration `migrations/0006_android_beta_requests.sql`

```sql
CREATE TABLE IF NOT EXISTS android_beta_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | invited | granted
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Apply locally and remotely per the repo's existing migration workflow
(`wrangler d1 execute canopy-founding-members[-live] --remote --file=...`).

### 2. Env var

In `wrangler.toml` `[vars]` and `[env.production.vars]`:

```toml
ANDROID_BETA_CAPACITY = "6"
```

Read it in code as an integer; treat parse failure as capacity 0 (fail closed).

### 3. Route in `src/index.ts`

- `POST /v1/android-beta` → new handler (e.g. `src/androidBeta.ts`).
- Add the path to the `OPTIONS` preflight allowlist in `fetch()` alongside the
  other `/v1/...` frontend routes.
- Origin check: reuse `allowedBrowserOrigin(request, env)` — reject otherwise
  (`403 origin_not_allowed`), same as `/v1/beta-access`.
- Body parsing: reuse `parseAccountBody`; require JSON object whose only key is
  `email`; validate with `isValidEmail`, normalize with `normalizeEmail`
  (both from `memberAccessToken.ts`).
- Rate limit: `checkRequestRateLimit(env.DB, clientIp(request), env.RATE_LIMIT_SALT,
  "android_beta", 5, RATE_LIMIT_WINDOW_SECONDS)` → `429` when blocked.
- Capacity + insert in a transaction-ish sequence:
  1. `SELECT COUNT(*) FROM android_beta_requests` → if `>= ANDROID_BETA_CAPACITY`
     return `409 {"error":"capacity_reached"}`.
  2. `INSERT INTO android_beta_requests (email) VALUES (?)` on conflict do
     nothing; if no row inserted return `200 {"already_claimed": true}`.
  3. Return `200 {"already_claimed": false}`.
- Log `info` events (`android_beta_claimed`, `android_beta_capacity_reached`)
  using the existing `log()` helper.

### 4. Ops after wiring

Invite testers in Google Play Console (closed testing track), then mark them:

```sh
npx wrangler d1 execute canopy-founding-members-live --remote \
  --command "SELECT email, requested_at FROM android_beta_requests WHERE status='pending' ORDER BY requested_at ASC LIMIT 6;"
```

```sql
UPDATE android_beta_requests SET status='invited', updated_at=datetime('now') WHERE email='tester@example.com';
```

## Deployment checklist

1. Worker: deploy test env, verify with `curl -X POST` against the test host,
   then deploy `[env.production]`.
2. Site: push `main`; GitHub Pages publishes to canopychat.app automatically.
3. Smoke-test on production: submit a real address, confirm D1 row, invite via
   Play Console, confirm invite email arrives.
4. When all 6 are filled, either raise `ANDROID_BETA_CAPACITY` or leave it —
   the page shows the 409 waitlist copy on its own.

## Local validation notes (already verified)

- Serve this repo: `python3 -m http.server 8765` then open
  `http://localhost:8765/android-beta`.
- UI states without backend: `?preview=success`, `?preview=full`,
  `?preview=error` (localhost only).
