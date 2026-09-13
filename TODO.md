# MealDrama — Task / Todo Ledger

Always-current plan of record. Every agent session MUST: (1) append a RUN HISTORY
entry, (2) state the local-server running state (ports 3000/3001/3101), (3) commit + push.
No hidden state. Last updated: 2026-09-16.

## NOW (current focus)
- [ ] **User: clear stale browser state on http://localhost:3001 and https://mealdrama.onrender.com**
      (Cmd+Shift+R hard-refresh; also purge site data for `localhost:3000` if that tab is still open).
      This is the fix for "UI distorted / can't create household" — the servers are verified healthy
      (see RUN HISTORY); the distortion was a stale-cache class (old SW served text/html for .js).
- [ ] Agent: port-supervision fix (task 1) — highest-value structural item.

## OPEN TASKS
1. [ ] **Port supervision one-liner** (owner=agent) — `telos/scripts/com.mealdrama.server.plist` uses
      `KeepAlive SuccessfulExit=false`: a *clean* stop leaves 3001 down forever. Change to
      `<key>KeepAlive</key><true/>` (or add `<key>StartInterval</key><integer>60</integer>`), then
      `launchctl unload/load ~/Library/LaunchAgents/com.mealdrama.server.plist`. Blocked-by: none.
      Evidence: plist contents; 2026-09-11 handoff item.
2. [ ] **Move vite dev off port 3000** (owner=agent) — `vite.config.ts` pins `server.port: 3000`;
      a stray `npm run dev` squats the exact port the user wants empty. Pin 5173/5175. Blocked-by: none.
      Evidence: user "something coming on 3000… don't keep it"; shell history has `npm run dev` +
      `npx vite --port 3000 --host`.
3. [ ] **Durable tunnel OR phone-via-Render** (owner=user) — quick-tunnel slugs die with the process;
      for phone testing prefer https://mealdrama.onrender.com or a named tunnel. Blocked-by: none.
      Evidence: `telos/scripts/watchtunnel.sh` header note; 2026-09-11 "tunnel plist missing" item.
4. [ ] **Prune prod-DB throwaway test users** (owner=agent) — `probe-*`/`flake-*` users + households
      accumulate from verification probes. NO delete route in the prod API by design; prune via one-off
      script / admin psql only. Blocked-by: main-DB credentials. Evidence: this session created
      probe-1789175387 / probe-1789175450 / flake-* (local) + probe-1789175450 (live).
5. [ ] **CI build-then-test one-liner** (owner=agent) — gate deploys on `npm run build && npm test`
      (vitest, 847+ tests). Currently the gate is manual. Blocked-by: none. Evidence: package.json scripts.
6. [ ] **Monitor stale-token 401s** (owner=agent) — server log shows `POST / 401 1ms` at
       01:03:23 today between two 201s: a stale-JWT attempt that self-healed (re-register → 201).
       If it recurs, add toast copy "session expired — please re-enter" instead of a generic failure.
       Blocked-by: none. Evidence: `/tmp/mealdrama_server.log`.
7. [ ] **WhatsApp cook channel — Phase 0 (owner=user)** — WABA + Meta business
       verification + dedicated number (direct-Meta vs BSP: Gupshup/Interakt/
       Twilio) + submit `cook_daily_plan` templates (EN + HI). Day–weeks lead
       time; the long pole. Blocked-by: Meta onboarding. Everything else is code
       (phase 1). Plan: docs/WHATSAPP_COOK_PLAN.md.
8. [x] **WhatsApp cook channel — Phase 1 (owner=agent, zero creds)** — DONE
       2026-09-16: `lib/whatsapp.ts` (dry-run sender + idempotency),
       `cookPlanMessage` "all plan + left to do" composer (hi/en),
       `cookScheduler` (day-aligned, idempotent via lastSentDate), webhook
       route with raw-body HMAC, `CookShare` messaging fields + migration
       (applied to dev DB), modal "Daily on WhatsApp" toggle, `cookReply`
       intents (done/shortage/fallback) + 38 new tests (1257 total green).
       Add `WHATSAPP_*` to server/Render env to flip from dry-run to real
       sends (Phase 2). Blocked-by: none.
9. [ ] **WhatsApp cook channel — Phase 2 flip (owner=user+agent)** — once Meta
       Phase 0 lands: set WHATSAPP_TOKEN/PHONE_ID/APP_SECRET/VERIFY_TOKEN on
       server + Render, wire the webhook URL at Meta, point `cook_daily_plan`
       template at the real name, soft-launch one household, measure
       conversations/day + done-rate. Blocked-by: Phase 0 (task 7).
10. [ ] **Cook page Hindi localization** — the embedded /cook/:token page stays
       English while the WhatsApp message is Hinglish; localize so the deep
       artifact matches the message (cook-artifact rule). Also echo the
       onboarding cook number ≤> CookShare 2026-09-16 was planned but the
       number lives on `user.cookContact` — modal prefills it, server echo
       still pending. Blocked-by: none.

## RECOMMENDATIONS / BETTER APPROACH
Answering "what is your problem / better approach" — a no-churn standard:
1. **Diagnose-with-evidence before any claim.** "Can't create household" sounded like a bug; probes
   proved local 7/7 + live 1/1 → 201. The problem was browser state, not code. Keep this rule everywhere.
2. **One fix per session; verify as the user.** After any change: full `npm test`, then exercise the
   REAL UI in a fresh browser (no SW cache, devtools open). A fix is DONE only when the user's exact
   action succeeds.
3. **Deploy runbook + verify checklist:** `git push` → Render auto-deploys service `mealdrama`
   (render.yaml) → verify `/health` 200 → run the register→create-household probe live → confirm
   `sw.js`/assets serve non-text/html MIME.
4. **Every session ends with:** TODO.md RUN HISTORY append + local-server running-state note
   (3001 RUNNING/STOPPED). No hidden state.
5. **Canonical local URL = http://localhost:3001 (built SPA).** Vite dev on 3000 is deprecated
   (ambiguous with old "mealdrama V1" + the confused-UI incident).
6. **After any SW/assets deploy: bump `CACHE_VERSION` in `public/sw.js`** and tell the user to
   hard-refresh — stale caches masquerade as bugs (v2 text/html-for-.js poison; fixed by v3 + aca72c7).
7. **Port-Supervision standard:** every launchd-managed service needs `KeepAlive=true` semantics or an
   explicit monitor; `SuccessfulExit=false` is a supervision gap, not a policy.

## RUN HISTORY
- **2026-09-16 — Cook WhatsApp channel Phase 1 SHIPPED (dry-run, code+DB+docs)**
  - **The cook's ONLY channel is now built end-to-end for WhatsApp Business API.**
    Runs in DRY-RUN until `WHATSAPP_*` env lands; then it sends for real.
  - New server modules (leaf, compile into dist):
    - `lib/whatsapp.ts` — Cloud API client: `sendText` / `sendTemplate` /
      interactive buttons / `sendWorkOrder`; **dry-run sender** (no env → logs
      the composed message, never touches network); per-household-day
      `Idempotency-Key`; `normalizeE164`; constant-time `verifyWebhookSignature`.
    - `lib/cookPlanMessage.ts` — the work-order composer: **FULL plan (done ✓ +
      pending) + "left to do" slice + shortages (ledger rows clamped to 0 = ran
      out) + auto-updating /cook/:token link**; hi (Hinglish, utterable) / en.
    - `lib/cookReply.ts` — inbound intents: `done`/`ho gaya` completes today's
      pending shared meals (version-bumped, status CAS-safe); `tomatoes nahi` →
      shortage → ActivityFeed; unknown → short non-looping help. Phone→household
      is the ONLY binding (foreign senders ignored).
    - `lib/cookScheduler.ts` — minutely, `notifyAt`+`notifyTz`-aligned
      (Asia/Kolkata default), idempotent via `lastSentDate` (restart never
      re-sends), skips empty days (retries until a plan exists), one bad
      household never kills the loop.
    - `routes/whatsappWebhook.ts` — GET challenge + **raw-body HMAC-SHA256**
      (strict when WHATSAPP_APP_SECRET set; dev-dry-run accept when not). Mounted
      with `express.raw` AHEAD of the global JSON parser in index.ts.
    - `CookShare` extended (migration 20260916000000 applied to dev DB, additive):
      `cookPhone`, `notifyEnabled`, `notifyAt`, `notifyTz`, `language`,
      `lastSentDate`, `consentAt`. PUT captures the **explicit cook opt-in once**
      when the push is enabled with a phone; nothing sends without it.
    - index.ts: webhook mount + `startCookScheduler()` (unref'd, harmless dry-run).
  - Client: WhatsAppShareModal "Cook's live link" card → adds a **"Daily on
    WhatsApp"** toggle (phone prefilled from cookShare/cookContact, time,
    language, honest opt-in + off-anytime copy). cookShareApi types extended.
  - **Tests: 38 new** (cookChannel + cookChannelWebhook: payload builders,
    dry-run vs configured fetch with bearer+idempotency headers, compose hi/en,
    classifier precedence incl. "khatam ho gaya" vs "ho gaya", orchestrator
    gate/done/shortage/unknown w/ activity assertions, scheduler idempotency +
    empty-day + send-fail, webhook challenge/forgery/interactive/always-200,
    consent capture + E.164 normalization + bad HH:MM). **Full suite: 86 files /
    1257 tests green** (one flaky timing run of trayP2028 round-trip counts —
    passed on re-run; noted in backlog to tame). `server` tsc build clean; new
    code adds zero root-tsc errors.
  - Migration applied to dev DB only (additive SQL; prod/DB untouched). Server
    dist rebuilt.
  - Local server state: 3001 RUNNING via launchd on **pre-fix dist** — rebuild +
    restart to deploy. None of today's changes committed (no push requested).
  - Docs: WHATSAPP_COOK_PLAN.md (Phase 1 = done checklist + Phase 2 flip),
    PRODUCTION_READINESS.md §3 cook block + §4 WhatsApp inbound-done ledger gap
    + §6 priorities, .env.example WHATSAPP_* contract, TODO.md tasks 8/9/10.

- **2026-09-15 (evening) — Product decision: cook channel = WhatsApp Business API (docs-only)**
  - **Decision:** cook communicates ONLY via WhatsApp — no app, no login, no
    email. Link stays as embedded fallback/deep artifact + cook identity anchor.
  - **docs/WHATSAPP_COOK_PLAN.md written** — messaging model (24h dialog window
    + one approved template `cook_daily_plan`; ≈1 conversation/household-day ≈
    ₹0.5–2 at current IN rate card, classify service/utility never marketing),
    architecture (whatsapp.ts client, cookScheduler, webhook w/ raw-body HMAC,
    CookShare messaging fields, cookReply intents done/shortage/fallback),
    compliance (explicit consentAt, no marketing templates), rollout phases 0–3
    (0=Meta WABA/template lead time, 1=build dry-run today, 2=flip, 3=OTP-via-
    WhatsApp for the auth milestone), full left-to-do checklist merged with the
    standing backlog.
  - OPEN TASKS #7 (Phase 0, owner=user, Meta) + #8 (Phase 1, owner=agent, no
    creds) added. OFFICE_HOURS.md + PRODUCTION_READINESS.md were still saying
    the send-channel was an *unmade* product call — corrected to DECIDED and
    pointing at the plan. All pre-existing launch-blocker fixes (1219 green)
    unchanged. NOT committed (no push requested).

- **2026-09-15 — /office-hours review + the four launch blockers fixed (agent)**
  - Product review written: **docs/OFFICE_HOURS.md** (real problem, first user =
    Indian household with one hired cook, the cook-link wedge, what not to
    build, strongest version = the "cook's daily kit"). PRODUCTION_READINESS
    §3/§6 updated to reflect the fixes below.
  - **All four launch blockers closed, with regressions (1219 green, 84 files; +18 tests):**
    1. **AUTH takeover → device-bound.** `User.deviceSecret` (bcrypt) added +
      migrated on dev DB (Neon). `/auth/register` = device `id` + 16-char
      deviceSecret; new accounts require the secret, email/phone of ANOTHER
      account → 409, self-heal issues a token ONLY when the secret matches.
      `/auth/login` = proof required. `POST /users` = authenticated, self-only,
      no token/cookie issuance. Client login/ensureToken send a per-install
      deviceSecret (`utils/deviceSecret.ts`). systemId no longer accepted.
      Proven live on :3199 (register-new 201, wrong-secret 401, no-secret 400,
      email-collision 409, login-email-no-secret 400).
    2. **Household week.** `pushCurrentTrayAsHouseholdPlan` now writes the dish's
      array index as dayIndex (was all `0` → single-day snapshot). `SharedPlanItem`
      gained `version` (migration) + PATCH `ifVersion` CAS → stale edit = 409
      (no last-write-wins). `requestedBy/requestedFor` normalized to
      HouseholdMember.id at the write boundary (name → id; neither → 400).
    3. **Cook as entity.** `CookShare` model (migration): membership-gated
      GET/PUT /households/:id/cook-share (rotate = revoke) + **public no-login
      `GET /api/v1/cook/:token`** rendering today's plan as a mobile HTML page
      (auto-updating; the stable link the cook bookmarks once). Client
      WhatsAppShareModal "Cook's live link" card (create/copy/rotate).
      Onboarding copy STOPPED promising "shared every morning" (no send channel
      exists — now honest).
    4. **Pantry ledger.** `POST /households/:id/stock/consume` (membership-gated,
      canonical-name + unit match, clamps at 0, unit-mismatch skipped) fired from
      the feed store when a shared item is COMPLETED (stock now drains). Server
      `canonicalName` leaf in server/src/lib (the old client-util `require()`
      dead-ends in compiled dist).
  - **Latent prod bug found en route:** member `GET /:householdId/pantry` resolver
    `require()`s a root-only client TS module → MODULE_NOT_FOUND in server/dist
    (masked in probes by the 403 gate). Needs a server-side resolver — flagged in
    report §4 (did NOT reproduce the pattern in the new consume route).
  - Migrations applied to dev DB only (`prisma db execute`, additive SQL file in
    prisma/migrations/20260915000000_...; migrate dev shadow-replay is broken on
    this repo — init uses a type Neon rejects). prod/DB untouched.
  - Local server state: 3001 RUNNING via launchd on **pre-fix dist** — rebuild
    (`cd server && npm run build` fresh) + restart to deploy; throwaway 3199
    started+stopped for live probes; new probe-* / Smoke Cook Household rows in
    dev DB (prune per open task #4). None committed (no push requested).

- **2026-09-14 — Production-readiness audit + security/data-integrity fixes (agent)**
  - Fixed (with regression tests, all 1201 green):
    1. **sharedPlan PATCH clobber** — status-only PATCH nulled `requestedFor`
       (`...requestedFor: p.requestedFor ?? null`); now only set when provided.
       Reproduced live on 3001 pre-fix, verified fixed on 3199 post-fix.
    2. **sharedPlan timezone drift** — POST/GET now resolve calendar dates in
       UTC; "2026-09-20" no longer lands on 2026-09-19 for non-UTC servers.
    3. **Pantry IDOR** — `GET /:householdId/pantry` had no membership gate;
       now 403 for non-members.
    4. **expenses /activity + /meals IDOR** — now membership-gated; the two
       shadowed duplicates in householdFeed.ts removed (expenses won the mount
       race — secured handlers were dead code).
    5. **Unauth routers** — loopConfig/tts/events required no token; now
       authenticated + loopConfig persists to Prisma (was in-memory Map, lost
       on restart) and is self-scoped. Client tts + analytics flush now send
       the Bearer header.
    6. **plan.ts/complete.ts** — zod failures were 500s; now 400s.
    7. **Typecheck** — App.tsx Spice type, Profile retry button dead
       `dietSyncState==='saving'` (→ local `dietRetrying`), lib/api.ts
       `lastErr: unknown`. Client app code + server tsc now clean.
    8. **Broken test** — mealPersonalization.test.ts referenced unimported
       `preferenceScore`.
  - New suite: tests/prodHardening.test.ts (16 tests, expr harness + mocked
    prisma — matches householdPlans.test.ts pattern).
  - NOT fixed (need product decisions, in PRODUCTION_READINESS report):
    auth takeover via /auth/register + /auth/login + public POST /users upsert
    (property-based login, zero verification — PROVEN live); cook is not an
    entity + "shared daily" is copy-only; no admin-transfer/member-removal UI;
    HouseholdPlanItem dayIndex pinned to 0 (family plans = single-day snapshot);
    memberId/userId conflation across assumptions/lanes/sharedPlan; no true
    pantry consumption ledger (buy-gap math only).
  - Local server: 3001 RUNNING (launchd, still on pre-fix dist — rebuild +
    restart to pick up fixes; `cd server && npm run build` done, dist fresh).
    Throwaway 3199 smoke server started+stopped for verification; probe-fix-*/
    probe-str-* users added to dev DB (prune per open task #4).

- **2026-09-12 — Verification + cleanup + ledger (docs-only, no code change)**
  - Household-create: LOCAL register→POST /api/v1/households `201` (×4 probes + 3× stress = 7/7);
    LIVE mealdrama.onrender.com `201` (1/1). **Server is NOT the bug.** Client chain audited
    (CreateHouseholdModal → useStore.createHousehold → ensureToken → householdApi.create →
    `POST /households {name}`; error toasts carry the server error). dist/ + sw.js v3 + MIME guard
    verified on local AND live (missing asset → 404 application/json, never text/html).
  - Ports: 3000 EMPTY (verified at start, during a 30s watch, and at end; prime suspect = this repo's
    vite dev — vite.config.ts pins 3000, shell history shows `npm run dev`; nothing respawns it:
    no cron, tunnel plist not installed, no cloudflared/vite process). 3101 EMPTY (PID 92326 gone).
  - Processes: full TCP listener audit — only authorized/system services (mealdrama 3001 via launchd,
    omniroute, Ollama, Figma, TELOS dashboard 8765/8766, block-space site-health agent, OpenCode).
    Nothing stray found; nothing killed (both authorized targets were already empty).
  - Left: **localhost:3001 RUNNING** (health 200; launchd job com.mealdrama.server, started 06:25:45).
    Production /health 200.
  - Evidence: `/tmp/mealdrama_server.log` (probe 201s + the one 01:03:23 stale-token 401), lsof/ps
    listings, curl probes — all in session tool log.
