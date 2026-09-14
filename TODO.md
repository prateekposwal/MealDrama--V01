# MealDrama — Task / Todo Ledger

Always-current plan of record. Every agent session MUST: (1) append a RUN HISTORY
entry, (2) state the local-server running state (ports 3000/3001/3101), (3) commit + push.
No hidden state. Last updated: 2026-09-14.

## NOW (current focus)
- [ ] **User: clear stale browser state on http://localhost:3001 and https://mealdrama.onrender.com**
      (Cmd+Shift+R hard-refresh; also purge site data for `localhost:3000` if that tab is still open).
      This is the fix for "UI distorted / can't create household" — the servers are verified healthy
      (see RUN HISTORY); the distortion was a stale-cache class (old SW served text/html for .js).
- [x] Agent: port-supervision fix (task 1) — **DONE 2026-09-14** (see task 1).

## OPEN TASKS
1. [x] **Port-supervision one-liner** (owner=agent) — **DONE 2026-09-14**.
      `telos/scripts/com.mealdrama.server.plist` now has `<key>KeepAlive</key><true/>`
      (was `SuccessfulExit=false` — a clean stop left 3001 down forever). Reinstalled
      to `~/Library/LaunchAgents`, reloaded, and PROVEN: `kill -9` the 3001 listener →
      launchd relaunched it (PID 11644→11835, `/health` 200, uptime reset). Evidence:
      plist diff; `/tmp/mealdrama_watchdog.log` "supervisor start (foreground)".
2. [x] **Move vite dev off port 3000** (owner=agent) — **DONE 2026-09-14**.
      `vite.config.ts` now pins `server.port: 5175` + `strictPort: true` — a stray
      `npm run dev` can no longer squat 3000 (the port the user wants empty).
      Evidence: `vite.config.ts` diff (port 3000 → 5175, strictPort added).
3. [ ] **Durable tunnel OR phone-via-Render** (owner=user) — quick-tunnel slugs die with the process;
      for phone testing prefer https://mealdrama.onrender.com or a named tunnel. Blocked-by: none.
      Evidence: `telos/scripts/watchtunnel.sh` header note; 2026-09-11 "tunnel plist missing" item.
4. [x] **Prune throwaway test users** (owner=agent) — **DONE 2026-09-14 (dev DB)**.
      One-off script (run via tsx against server/.env `DATABASE_URL`, NOT committed)
      deleted 6 `probe-*`/`flake-*` users + 7 `probe-*`/`flake-*`/`Smoke Cook` households
      (all household deps cascade: cook share, stock, lanes, assumptions, activity).
      Re-scan clean. Live/prod DB prune still needs main-DB access.
      Note: the prod API intentionally has NO delete route — prune stays one-off/psql.
      Evidence: this session's run output (users deleted: 6, households deleted: 7).
5. [x] **CI build-then-test gate** (owner=agent) — **DONE 2026-09-14**.
      `.github/workflows/ci.yml` already gated `build` on `lint` + `test`; the TypeScript
      check was `continue-on-error: true` (~110 pre-existing errors). The test/scratch
      `tsc` backlog is NOW ZERO, so the lint step is a HARD gate. Evidence: `npx tsc --noEmit`
      exit 0; workflow diff (continue-on-error removed).
6. [x] **Monitor stale-token 401s** (owner=agent) — **DONE 2026-09-14** (copy).
      Server log showed `POST / 401 1ms` at 01:03:23 between two 201s: a stale-JWT attempt
      that self-healed. The graceful 401 path already existed (`lib/api.ts` `signalSessionExpired`
      → App `auth:unauthorized` handler → `getMe()`; confirmed rejection → logout). Both toast
      surfaces now carry the user's exact copy **"Session expired — please re-enter"** instead of
      the previous generic variants (`App.tsx` graceful-expiry + `app/store/useStore.ts` mutation-
      drain 401 branch). Continues to self-heal on the re-register path; keep an eye on the log only
      if it starts to recur daily.
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
- **2026-09-14 — Housekeeping batch: vite off 3000, CI hard tsc gate, 401 toast copy, test-file tsc backlog ZERO, P2028 flake tamed**
  - **vite dev off 3000 (task 2)**: `vite.config.ts` pins `server.port: 5175` + `strictPort: true`.
    A stray `npm run dev` can no longer squat the port the user wants empty.
  - **CI build-then-test gate (task 5)**: `ci.yml` already ordered validate → lint → test → build
    (build NEEDS lint+test); the TypeScript check was `continue-on-error: true` with ~110 pre-existing
    errors. The `tsc` backlog is now ZERO → the lint step is a HARD gate; a type regression now fails CI.
  - **Stale-token 401 toast (task 6)**: the graceful 401 path already existed (signalSessionExpired →
    App revalidates via getMe → confirmed rejection logs out). Both toast surfaces now use the user's
    EXACT copy **"Session expired — please re-enter"** (App.tsx graceful-expiry branch +
    useStore mutation-drain 401 branch) instead of the two old generic variants.
  - **test-file tsc backlog → ZERO**: fixed 19 errors in `analytics.test.ts` (fetch mock arity),
    `api503CrashRegression.test.ts` + `traySeedFirstLoad.test.ts` (fetch mock casts to
    `as unknown as typeof fetch` — the repo's established pattern; plus `makeMeal` now returns a
    valid `Meal` with `region: 'central'`), `staticServing.test.ts` (matchAll refs narrowed by
    filter). Deleted the whole `server/tmp` scratch set (scratch_*.mts + telos_*.mjs — tracked
    one-off probes, part of the backlog). **`npx tsc --noEmit` now exits 0**.
  - **trayP2028 slow-prisma flake tamed (task)**: the "slow-prisma proof" block asserted REAL
    wall-clock `elapsed ≥ 5000` on 2600ms-mocked latency — a CI timing flake (the one flaky run
    noted at TODO:261) AND it burned ~26s of fake sleeps per suite run. Replaced with two
    DETERMINISTIC pins + a 25ms latency: exact group delta (2 < the old interactive form's 3-4)
    and a per-group latency tally (`sleptMs ≡ groups × LAT` — the array batch's shared submit
    window can never consume the cumulative 5s interactive budget). Timing asserts deleted.
    Suite still 20/20; full suite wall time dropped ~28s → ~10s.
  - **prod-DB prune (task 4)**: still BLOCKED user-owned — only the dev Neon DB is reachable from
    this machine (`server/.env DATABASE_URL`); prod lives in Render secrets (deliberately not in
    render.yaml). Dev DB was already pruned last session.
  - Suite: **91 files / 1302 passed (1 skipped)**; build exit 0; `tsc --noEmit` exit 0.
    Local server: 3001 RUNNING (launchd). User-owned NOW item unchanged (stale browser state).

- **2026-09-14 — Recommendation-quality tuning pass (pass 2): hot-affinity amplification, novelty gradation + reach, ingredient-cache root-cause**
  - **ITEM 1 — "loves Punjabi" beats "loves spicy" cleanly (hot users)**:
    - Engine: new `isHotSpiceUser` + `cuisineAffinityBoostForSpice` — hot users now get the
      STRONGEST cuisine-affinity unit (2.0/key, cap 3.0; mild 1.6, medium EXACT legacy 0.8).
      Rationale: the +0.9/hot-dish global term rewards every hot dish, so the loved-cuisine
      marker must out-scale it — the OLD 0.8 left a hot Punjabi lover at 2/20 plan dishes
      and a scored gap of 2.75 vs the 3.0 max-jitter span; amplified = gap 3.95, always
      ranked ahead. `preferenceScore` now uses the spice-aware tuple.
    - DATA (the binding constraint, surfaced by probing): the library had only THREE
      'punjabi'-tagged dishes (Sarson, Amritsari Chole, egg-only Anda Paratha) — no weight
      can make a veg Punjabi lover's plan read Punjabi. Tagged the genuine classics
      (Dal Makhani, Paneer Bhurji + Sandwich, Kadai Mushroom, Baingan Bharta, Aloo Matar,
      Methi Malai Matar, Paneer Pulao, Paneer Pakora, Rajma Chawal, Chana Masala) with the
      'punjabi' cuisine tag → the hot-Punjabi plan now carries **9/20 Punjabi dishes**
      (up from 2), measured and pinned.
  - **ITEM 2 — deeper within-region novelty, reach preserved**: `noveltyTierLift` GRADED
    (2026-09-14). The 0.5–0.6 band (the p75–p90 home pool) now opens the full −2
    (within-region deepener) and ≥0.6 gets a fractional −2.4 edge; NEW regionDistance
    param keeps far-region strong-novel dishes AHEAD of home mid-novel ones (far
    2−2.4−2=−2.4 < home-mid −2). Measured: adventurous-vs-familiar avg-novelty delta
    0.083 → **0.132** with far-region reach intact (**7/20** south for a north
    adventurous user). A partial-shelf intermediate measured WORSE (greedy home-mid
    displaced ALL far reach: south 3→0, delta 0.072) and was reverted — documented
    in the function comment.
  - **ITEM 3 — client ingredient-engine order/cache fragility, ROOT-CAUSED**: two real
    bugs in `getIngredientsForMealOption` (confirmed by probe, both fixed):
    - **B1 cache-key collision**: the key was `dishId::variant::diet` ONLY — categorySelections
      were dropped, so the FIRST resolution of a dish won and later callers with different
      selections inherited the first caller's list (order-dependent). Fixed: stable
      `selectionsKey` fingerprint is part of the cache key.
    - **B2 live-reference returns**: the cache handed out the canonical array BY REFERENCE —
      a mutating caller (push/splice, or `quantity`/`unit` rewrite on an item) silently
      corrupted every later resolution (measured: one caller's pollutant leaked into the
      next two). Fixed: `defensiveIngredients` returns clone-of-item copies on every exit;
      `utils/cache.ts` helper hardened to match.
    - New permanent regressions in `tests/ingredientUtils.test.ts`: equal-values-never-same-
      reference, push/rewrite isolation, selections-order-independence. Two ref-identity
      assertions updated to content-equality (deliberate semantic change).
  - **Re-pins (deliberate, documented in-test)**: goal-2 pairwise overlaps 8/6/3 →
    **8/2/3** (hot identity amplified → Punjabi plan 9/20; graded novelty widened the
    adventurous/novelty separation); the `allergic-novelty` profile now shares only 2/20
    with simple-home. Locked new floors: hot-Punjabi plan ≥6/20 Punjabi; row-14 delta
    >0.10 AND far-region reach ≥2.
  - Suite: **91 files / 1302 passed (+5)**, 1 skipped; root build green; `tsc --noEmit`
    clean for all touched files (only pre-existing backlog: analytics/api503/scratch/
    staticServing/traySeedFirstLoad — all untouched by this pass).
  - Carry-forward unchanged: WhatsApp Phase-2 flip, pantry inbound-"done" draw-down,
    OTP auth, cook Hindi.

- **2026-09-14 — Recommendation-quality bundle: 15-row use-case matrix, real spice + novelty signals, Recommendation Score decomposition, small-DB overlap policy**
  - **THE MATRIX**: `tests/recommendationUseCases.test.ts` (22 tests) locks ALL 15 spec
    rows on the real 679-dish library through the live pipeline: (1) 4 same-profile
    roommates → different/valid/deterministic plans; (2) same diet different taste →
    ≤8/20 shared + per-plan taste signatures; (3/9) same taste different focus →
    nutrition changes, taste retained; (4/11) same everything → CONTROLLED variety
    (byte-identical determinism, bounded overlap); (5) dislike paneer → 0 paneer in
    plan + `− Dislikes` driver; (6) South love → south share 0→10+/20 + Taste Fit up;
    (7) spicy → ingredient-hot share strictly hot > medium > mild; (8) Veg→Eggitarian
    (eggs appear, taste tilt survives); (10) Veg→Vegan (zero non-vegan rendered);
    (12) skip/dislike → sibling dishes drop (ledger); (13) like → similar later
    (ledger boost); (14) Try-Something-New → adventurous > familiar novelty on BOTH
    surfaces; (15) small DB → 20/20 via RECORDED gate-safe overlap, never fabricated.
  - **KEY TEST (spec p.1 "don't confuse variety with randomization")**: mean pairwise
    sharing of DIFFERENT-taste roommates < same-profile sharing; determinism byte-identical;
    max different-taste pair ≤11/20; min same-profile pair ≥7/20 — difference is REASONING
    (taste signal), identity-stable, not dice. **RECOMMENDATION-SCORE (spec p.2)**:
    `recommendationScoreParts` (dietGate/healthFit/tasteFit/dislikes/variety/repetition/
    jitter; total === personalizationScore) + `recommendationScore`. Part map:
    Diet a gate never a weight; Health=healthFocusScore; Taste=preference+ledger;
    Variety=noveltyScore; History≡−Repetition=historyPenalty (never double-counted);
    Dislikes=dislikePenalty (label extracted).
  - **ENGINE FIXES (measured no-ops → real signals)**:
    - SPICE (row 7): `preferenceScore` now scores ingredient-derived spice
      (`dishSpiceLevel` — chili evidence; 55–117 hot fillable/slot) instead of the
      rare 'spicy' tag; the old tag axis measured plan-identical (hot plan == baseline).
      Hot user plans now measure 87 vs 73 (medium) vs 40 (mild) ingredient-hot dishes
      across 8 seeds.
    - NOVELTY (row 14): `noveltyTierLift` (new) — adventurous users get a region-tier
      lift for genuinely novel dishes, wired into the pipeline fill+dedupe AND the
      gated builder; previously measured adventurous avg novelty 0.4465 < familiar
      0.4675 (the "Try Something New" preference changed nothing).
    - GATED SURFACE (recommendation.ts): candidates now order REGION/appropriateness
      FIRST (mirrors the pipeline), then score — score-before-region let a hot user
      wander into far-region hot dishes, blurring A-favours-Punjabi vs B-favours-South;
      plus the affinity/novelty tier lifts so a loved far-region cuisine ("B loves
      South") still reaches the plan.
    - SMALL-DB OVERLAP (row 15): `reuseCandidatesForSlot` + `small_pool_overlap`
      fill-branch + dedupe keeps a recorded overlap when no substitute exists
      (`small_pool_overlap_kept`) — a repeat the user already accepted beats a hole
      OR a bad dish; EMPTY library still records honest `fill_short`.
  - **Re-pins (deliberate, documented in-test)**: goal-2 pairwise overlaps 11/9/8 →
    8/6/3 (spice fix changed hot-user ranking; novelty lift changed adventurous user).
  - Suite: **91 files / 1297 passed (+22 matrix)**, root build green. Local servers
    unchanged: 3001 RUNNING (launchd).
  - Carry-forward unchanged: WhatsApp Phase-2 flip, pantry inbound-"done" draw-down
    (server engine exists), OTP auth, cook Hindi.

- **2026-09-14 — Known-prod-bug sweep: pantry 500 fixed, household admin transfer/removal, port-supervision + DB prune**
  - **PANTRY 500 ROOT-CAUSED + FIXED.** `GET /:householdId/pantry` `require()`d
    root-only client TS (`../../../utils/ingredientUtils`, `dishLibrary`) that never
    compiles into `server/dist` → `MODULE_NOT_FOUND` on every member read in prod.
    - New server-owned leaf: `server/src/lib/ingredientResolver.ts` + generated
      `server/src/data/pantrySnapshot.ts` (per-dish + per-category ingredients from
      the REAL client engine, precomputed; regenerate via
      `WRITE_PANTRY_SNAPSHOT=1 npx vitest run tests/pantrySnapshot.generate.test.ts`).
      `server/dist/routes/pantry.js` now has ZERO client `require`s.
    - Guard rail: `tests/pantrySnapshot.generate.test.ts` (engine drift guard) +
      `tests/pantryResolver.parity.test.ts` (byte-parity vs client buildPantryGroups)
      + `tests/pantryRoute.test.ts` (route contract, 401/403 gates, legacy-id skip).
    - PROVEN on compiled dist: booted `node dist/index.js` on :3101 (same dev DB),
      added a `rajma-chawal ×2` tray item for a real member, `GET /pantry` → **200**
      with correctly grouped Fresh Stuff / Staples (Basmati Rice 370g, Rajma 240g) /
      Spices / Pantry. (Probe row + server removed after; nothing left behind.)
    - NOTE (client engine, pre-existing): fixing this surfaced a latent client
      engine fragility — some dish resolution is order/cache-state dependent (a
      full-library sweep can leave sparse variants degraded). Snapshot pins the
      faithful first-resolution content; engine root-cause is a clean follow-up.
  - **HOUSEHOLD ADMIN (server + UI).**
    - `PATCH /households/:id/members/:mid {role:"admin"}` now TRANSFERS adminship:
      demote incumbents + promote target in ONE `$transaction`; demoting the ONLY
      admin → 400. `households.ts` now imports `APIError` from `../lib/apiError`
      (leaf), not `../index` — the old import broke any harness test.
    - NEW `DELETE /households/:id/members/:mid` (admin only): guards (self → use
      /leave; last-admin → 400), cascades ExpenseSplit, deletes MemberLane +
      HouseholdAssumption, NULLS shared-plan member pointers (no dangling id).
    - Client: `removeMember` in householdApi + `removeHouseholdMember` in useStore
      + FamilyPlans admin buttons **Make admin** / **Remove** (hidden on admin rows).
    - Tests: `tests/householdMembers.admin.test.ts` (7) via new
      `buildHouseholdsApp` harness.
  - **PORT SUPERVISION (task 1) DONE.** Plist `KeepAlive <true/>`; reinstalled +
      reloaded; proven with `kill -9` → launchd re-armed (PID 11644→11835, health 200).
  - **DEV-DB PRUNE (task 4) DONE.** One-off tsx script (not committed) deleted
      6 probe/flake users + 7 probe/flake/Smoke-Cook households; re-scan clean.
  - **Suite: 90 files / 1275 tests green** (+ the 18 new). Root client build green.
    Local state: **3001 RUNNING** (launchd, KeepAlive=true after reload).
  - Carry-forward: WhatsApp Phase-2 flip (`WHATSAPP_*` env), pantry inbound-"done"
    can now REUSE the same server ingredient engine to draw the ledger down, and a
    fresh look at the client engine's order-dependence (follow-up).
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
