# MealDrama (MD-App) — Production-Readiness Report

**Audit date:** 2026-09-14 · **Method:** source inspection (server `routes/` + `prisma/schema.prisma`, client stores/screens), live API probes against the dev server (`localhost:3001` + a throwaway `:3199` instance), and the repo's own test suite (now **1201 tests green**, 84 files).

The mandate was evidence-first: understand what exists, find the gaps between this MVP and a production product, and fix only what is a genuine bug. The **household model** got the deepest pass.

---

## 1. What is solid

- **Eng discipline is genuinely good.** 84 vitest files, mocked-prisma route harnesses, optimistic-locking CAS on `UserPlan`, offline queues, an API self-heal layer that distinguishes "backend down" from "session expired", a service-worker asset-MIME regression suite, and a repo ledger that demands evidence before claims.
- **The plan-generation engine is real.** Diet-first → region pools → quota reps → health tiebreak, RNG isolation, household-diversity rotation, meal-history penalties, taste ledger (like/dislike/replacedTo/added). This is the product's moat and it is well-tested.
- **Shared-pantry taxonomies are sane.** Standardized ingredient IDs, aliases, per-category pantry groups, ingredient de-dupe (`sharedGrocery` counts a shared dish once across members), variant styles (gravy/roti/rice), guest servings.
- **The shared-kitchen ledger** (`HouseholdStock` per `(household, name, unit)`) gives every device the same numbers.
- **UI disaster-paths are handled**: offline banners, pull-to-refresh, error boundaries, toasts, stale-base migration, confirmed-auth-rejection logout.

---

## 2. What was FIXED this session (server hardening + correctness)

All changes are behavior-preserving for legitimate users, covered by regression tests in `tests/prodHardening.test.ts` (16 new).

| # | Issue (evidence) | Fix | Verified |
|---|---|---|---|
| 1 | **`sharedPlan` PATCH wiped `requestedFor`.** `data: { ...p, requestedFor: p.requestedFor ?? null }` nulled "this meal is for X" on every status-only PATCH. Reproduced live: accept → `requestedFor` gone. | Update built from only present keys; `requestedFor` cleared only when explicitly sent `null`. | live + test |
| 2 | **`sharedPlan` ±1-day date drift.** `new Date(p.date+'T00:00:00')` parsed in server-local tz; a plan for 2026-09-20 stored/read as 2026-09-19. | Query and row comparison both use UTC-midnight; days param bounded + NaN-guarded. | live + test |
| 3 | **Pantry IDOR.** `GET /:householdId/pantry` returned any household's ingredient plan with zero membership check. | `requireMembership` gate → 403. | live + test |
| 4 | **Expenses IDOR + shadowed routes.** `/activity` (GET/POST) and `/meals` had no membership check, and the "secured" duplicates in `householdFeed.ts` were unreachable dead code (expenses mounted first). | Membership gate on the three handlers; dead duplicates removed; `APIError` imports unified to the leaf `lib/apiError.ts`. | test |
| 5 | **Three routers ran unauthenticated** — `loopConfig`, `tts`, `events`. `/tts` shells out to `say` (30 s blocking); `/events` appends logs. | `authMiddleware` on all three. `loopConfig` no longer a data-losing in-memory `Map`: persists to Prisma, self-scoped (GET/DELETE of another user's config return empty). Client tts + analytics flush now send the Bearer header. | live + test |
| 6 | **`plan.ts` / `complete.ts` returned 500 on bad payloads** (zod failures indistinguishable from crashes); `variantId` never cross-checked. | zod failures → 400. | test |
| 7 | **Client typecheck was red** (blocked the "gate deploys on tsc" goal): `App.tsx` passed `Spice` to `changeDiet`'s wrongly-typed `spiceLevel?: number`; `Profile.tsx` retry button compared `'failed'` to `'saving'` inside the `failed` branch (dead code — the spinner could never render); `lib/api.ts` `lastErr` typed `Error`. | Fixed types; Profile uses a local `dietRetrying` in-flight flag (the intended behavior now works). | `tsc --noEmit` clean (app + server) |
| 8 | **One permanently failing test** (`preferenceScore` not imported). | Imported the real export. | suite |

**End-to-end proof (throwaway `:3199`, dev DB):** unauth `POST /loop-config` → 401; non-member pantry → 403; family-week item dated `2026-09-20` with `requestedFor=MEMBER-ABC` → PATCH `{status:'accepted'}` → still `2026-09-20` and `requestedFor=MEMBER-ABC`.

> **Deploy note:** the running services (launchd `3001`, Render `mealdrama.onrender.com`) are still on the pre-fix build. Rebuild/restart to pick up these fixes.

---

## 3. What is BROKEN — must fix before launch

**Status change (2026-09-15): the four launch blockers from section 3 of the
2026-09-14 report were FIXED this session.** Evidence + regression tests below.
What remains true is that **real OTP/password auth** and the **server-side
repeat-expansion engine** are still product decisions (no messaging/OTP infra
exists yet).

### CRITICAL: authentication is an account-takeover, not a login — FIXED (device-bound)

The takeover (verified live 2026-09-13): `register` trusted a client `id` and
issued the matched account's token; `login` issued a token for any existing
`email/phone/systemId`; `/users` POST was a public authless upsert that also
issued a JWT + cookie.

**Fix (2026-09-15): a guest account is now device-bound.**
- `POST /auth/register { id, name, deviceSecret }`: `id` is the device key.
  New account → requires a 16+ char `deviceSecret` (bcrypt-hashed column,
  never stored plain), email/phone that already belong to another account →
  409 (`IDENTITY_CONFLICT`). Existing `id` → self-heal issues a token **only**
  when the secret matches the stored hash. There is no path from
  email/phone/systemId to a token.
- `POST /auth/login { email, phone, deviceSecret }`: proof required; a missing
  or wrong secret is rejected. (The client does not use it — kept for legacy.)
- `POST /users`: authenticated + self-scoped; updates only the caller's own
  row; never creates, never issues a token, never sets a cookie.
- Client: `login()` + `ensureToken()` now generate/persist a per-install device
  secret (`utils/deviceSecret.ts`) and send it; self-heal keeps working across
  restarts. Google OAuth path unchanged (real identity via `googleId`).

**Verified:** live dev-DB probes (`:3199`) — register-new 201 with token;
register-wrong-secret 401; register-no-secret 400; login-email-no-secret 400;
email-collision 409; self-heal-right-secret 200. 9 new regression tests.

**What still needs the product call:** real OTP/password for account recovery
across devices — the device-bound model ties a guest account to one device
until a Google sign-in links it. That matches the current UX (device-local
tray), but the "cook's phone" + lost-device flows need an OTP channel
(document § office-hours).

### HIGH: the household week — four overlapping representations — HARDENED

- **`dayIndex` fixed.** `pushCurrentTrayAsHouseholdPlan` writes the dish's
  position in the slot array as its day index (was literally `0` for every
  row) → family plans carry real days, not a single-day snapshot.
- **Optimistic lock added.** `SharedPlanItem` gains `version` (default 0);
  PATCH accepts `ifVersion` and applies as an atomic CAS
  (`updateMany where {id, householdId, version}`), bumping version; a stale
  `ifVersion` → 409 `CONFLICT`. Two devices editing the family week now get a
  refresh-and-retry, not silent last-write-wins.
- **Member-pointer integrity.** `requestedBy/requestedFor` are resolved to
  `HouseholdMember.id` at the write boundary (a member *name* is normalized to
  its id; anything that is neither → 400). The old mix of user ids, member ids
  and free strings can no longer enter the table.
- **Model reconciliation still stands** (don't merge the four tables yet): the
  authoritative-week merge policy and FK-backed member pointers remain a
  deliberate follow-up (see § office-hours "not to build").

### HIGH: the cook is not an entity — FIXED (no-login link + WhatsApp channel)

- New `CookShare` model (one per household, opaque token). `GET`/`PUT
  /households/:id/cook-share` (membership-gated) return/rotate the link; the
  token is the credential (rotate = revoke).
- **Public `GET /api/v1/cook/:token`** renders TODAY's family plan as a
  mobile-first HTML page — no app, no login. It renders fresh on every
  request, so the cook bookmarks ONE link that updates as members change
  meals. Client: a "Cook's live link" card in the WhatsApp share modal
  (create / copy / rotate).
- **Decision made 2026-09-15: the channel is WhatsApp Business API** (cook
  communicates ONLY via WhatsApp) — full plan in `docs/WHATSAPP_COOK_PLAN.md`.
- **PHASE 1 SHIPPED 2026-09-16 (dry-run until Meta creds land):**
  - `server/src/lib/whatsapp.ts` — Cloud API client (`sendText` /
    `sendTemplate` / interactive buttons / full work-order via `sendWorkOrder`)
    with a **dry-run sender** (no `WHATSAPP_*` env → logs instead of sending)
    and per-household-day `Idempotency-Key` headers.
  - `server/src/lib/cookPlanMessage.ts` — the **work-order composer**: the
    message the cook gets each morning carries the FULL plan (done ✓ + pending)
    AND the "left to do" slice, plus shortages (pantry rows clamped to zero by
    the ledger = "ran out") and the auto-updating `/cook/:token` link.
    Language hi (Hinglish, utterable) or en.
  - `server/src/lib/cookReply.ts` — inbound intents: "done" / "ho gaya" →
    completes today's pending shared meals ; "tomatoes nahi" → shortage →
    activity feed; unknown → short non-looping help. Phone→household via
    `CookShare.cookPhone` (E.164). Inbound **done does not yet draw the pantry
    down** (see §4 — the pending server-side ingredient resolver).
  - `server/src/lib/cookScheduler.ts` — minutely, day-aligned to each
    household's `notifyAt`/`notifyTz` (Asia/Kolkata default), idempotent via
    `lastSentDate`, skips empty days (retries until a plan exists), one bad
    household never kills the loop.
  - `server/src/routes/whatsappWebhook.ts` — GET challenge handshake +
    **raw-body HMAC-SHA256 verification** (`X-Hub-Signature-256`); mounted
    ahead of the global JSON parser. Strict when `WHATSAPP_APP_SECRET` is set,
    dev-dry-run acceptance when not.
  - `CookShare` extended (additive migration, applied to dev DB): `cookPhone`,
    `notifyEnabled`, `notifyAt`, `notifyTz`, `language`, `lastSentDate`,
    `consentAt`. Enabling the push with a phone **captures the cook's explicit
    opt-in** (`consentAt`) once — nothing sends without it.
  - Client: the WhatsApp share modal's "Cook's live link" card gains a
    **"Daily on WhatsApp"** toggle (phone / time / language) with honest
    opt-in + off-anytime copy.
- **Verified:** 38 new regression tests (payload builders, dry-run vs
  configured send, HMAC verify, composer hi/en, intent classifier, orchestrator
  gate/done/shortage/unknown, scheduler idempotency + empty-day + send-fail,
  webhook challenge/forgery/interactive, consent capture). Full suite: 86 files
  / 1257 tests green; `server` builds; changed client files tsc-clean.
- **Flip to real sends** (Phase 2): set `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID`,
  `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` in server + Render env, wire
  the webhook URL at Meta, get `cook_daily_plan` (hi+en) approved. Until then
  everything runs dry-run — no billable sends, no messages sent.

### HIGH: pantry is buy-gap math, not a ledger — FIXED (consumption)

- New **`POST /households/:id/stock/consume`** (membership-gated): the client
  sends what a cooked meal used (already normalized to buy-friendly units via
  the same `toBuyGrams` the buy list uses); the server matches on the shared
  `canonicalName`, requires a matching unit (mismatches are skipped, never a
  nonsense subtraction), and clamps at zero — stock cannot go negative.
- **Triggered at the exact "cooked" moment**: `setSharedStatus(…, 'completed')`
  in the household feed store fires a best-effort consume for the completed
  dish × servings. The ledger now drains as meals are actually cooked; the
  buy-gap forecast no longer inflates forever.
- Server `canonicalName` lives in `server/src/lib/canonicalName.ts` (leaf,
  compiles into dist) — byte-for-byte the same alias table as the client util.

**Verified:** 4 regression tests (non-member 403; decrement + clamp-at-zero;
unit-mismatch skip). The **latent pantry production bug found en route is now
FIXED (2026-09-14)**: the `GET /:householdId/pantry` resolver used to
`require()` root-only client TS modules never compiled into `server/dist`
→ `MODULE_NOT_FOUND` on every member read in prod. It now resolves from a
server-owned ingredient catalog (`server/src/lib/ingredientResolver.ts` +
generated `server/src/data/pantrySnapshot.ts`), byte-parity-pinned against the
client engine (`tests/pantryResolver.parity.test.ts`) and proven on compiled
dist (200 with correct groups; see § 4). `server/dist/routes/pantry.js` has
ZERO client `require`s. The server now ALSO has the ingredient engine the
WhatsApp inbound "done" path needs to draw the ledger down server-side.

### MEDIUM-HIGH gaps (product decisions)

- **Repeat scheduling ("weekly / bi-weekly / monthly") is not implemented server-side.** `loop-config` was an in-memory no-op (now persisted, but the **repeat-expansion engine** — turning a config into dated plan rows outside the client — still does not exist). Everything live is client-local Zustand.
- **Admin transfer + member removal — DONE 2026-09-14.** `PATCH members/:id {role:'admin'}` now transfers adminship atomically (incumbents demote, sole-admin demote → 400) and NEW `DELETE members/:id` removes a member admin-side with full cleanup (lanes, assumptions, shared-plan pointers NULLED, ExpenseSplit cascades). UI: FamilyPlans **Make admin** / **Remove**. `regenerate-code` also has UI-free callers only (`householdApi.regenerateCode` unused in components) — a wink of polish left.
- **`canEditPlan` / view-only is enforced server-side only.** View-only members get the same editing UI and only discover the 403 on submit (`planStatus.ts` helper exists but has no production caller).
- **Member privacy:** `GET /households/:id` returns every member's `UserProfile` + `DietPreference` (allergies, dislikes) to any member. Acceptable for a household, but it should be an explicit decision (and FamilyDiets deliberately restricts the *diet policy* view server-side — inconsistent).

---

## 4. What remains broken but can wait (with evidence)

- `expenses.ts` has **no zod**; `title` accepts objects, `amount` accepts strings that crash Prisma; `splitType:'custom'` silently stores equal splits (post:58-75).
- `mealLog` / `tasteLedger` accept arbitrary `dishId` with no existence check and no FK (client can fabricate history — "never guessed" is unenforceable).
- `meals.ts` pagination is fake (`skip` echoed, never applied); `take` reports `100` while capping.
- `custom-dishes.ts`: rename collisions → P2002 → 500; `ingredients` cannot be PATCHed.
- `tray.ts`: free-form `gravyStyle/rotiType/riceType/sides` unbounded; `guestCount` guard is dead (schema caps 11, runtime checks `> 12`).
- `householdFeed.ts`/`sharedPlan` day-range params: negative/invalid `days` → NaN → 500.
- **Latent prod bug FIXED (2026-09-14):** `GET /:householdId/pantry` member path
  used to `require()` a root-only client TS module never compiled into
  `server/dist` → `MODULE_NOT_FOUND` in a built server. Now served by a
  server-owned catalog + resolver leaf (`server/src/lib/ingredientResolver.ts`)
  with engine-parity tests; **verified on compiled dist** (`node dist/index.js`,
  real member + `rajma-chawal ×2` → HTTP 200 with grouped ingredients). The
  server-side engine is also the one the WhatsApp inbound "done" path needs.
- **WhatsApp inbound "done" does not draw the pantry down (2026-09-16):** the in-app complete triggers the consumption ledger client-side; the cook's WhatsApp "done" marks meals complete server-side only. The server ingredient engine now exists (`ingredientResolver.ts`) — wiring it into the inbound path is a small, well-scoped follow-up (resolve the completed shared-plans' dishes → `POST /stock/consume`).
- `isRoommateHousehold` hardcoded `true` in Profile (`Profile.tsx:1063`) — expense UI shows for families too.
- `requestForMemberId` (the "request this dish for a member" flow) is dead — no call site passes it.
- Test-infra typecheck noise remains (`tests/analytics.test.ts`, `tests/api503CrashRegression.test.ts`, `tests/staticServing.test.ts`, `server/tmp/scratch_*.mts`) — app + server code are clean, vitest is unaffected.

---

## 5. What should be tested before launch

1. **Auth replacement**: register→OTP (or password)→household create→fresh device→re-login; account linking with Google; "cook's phone" reuse.
2. **Household lifecycle end-to-end**: create → invite by code → join → second member edits their own tray → admin toggles `canEditPlan`/`autoPlanEnabled` → view-only member's UI blocks writes → admin leaves → admin transfer.
3. **The family week across two real devices** (the current gap): member A plans 7 days; member B's phone shows A's persisted `HouseholdPlanItem` rows for those 7 days, not a single-day snapshot.
4. **Pantry consumption loop**: plan + cook + mark-bought + complete-slot → shared stock reflects the cook's actual consumption (after the ledger fix).
5. **Concurrent edits** on the family week (two devices, same slot) — expect a 409/conflict path, not silent overwrite.
6. **Date integrity across timezones**: plan a meal for tomorrow at UTC+13; confirm it lands on tomorrow, not yesterday, in GET + WhatsApp share text.
7. **Fresh-install boot**: no stale SW cache, `/health` 200, `sw.js`/assets served with correct MIME (the repo's own v3 discipline), `PORT`-freedom (vite off 3000), `KeepAlive=true` for the 3001 launchd job.

---

## 6. Priorities, on one page

| When | What |
|---|---|
| **Done 2026-09-15** | Four launch blockers closed: device-bound auth (register/login/users), `dayIndex` real days, `version` CAS on the week, member-pointer integrity, cook-share link + public page, pantry consumption ledger. 18 new regressions (1219 tests green, 84 files). |
| **Done 2026-09-16** | Cook WhatsApp channel **Phase 1 shipped** (dry-run): `lib/whatsapp.ts` client + dry-run sender + idempotency, the "all plan + left to do" work-order composer, inbound `cookReply` intents (done/shortage/fallback), day-aligned idempotent `cookScheduler`, webhook route with raw-body HMAC, `CookShare` messaging fields + consent capture, and the modal "Daily on WhatsApp" toggle. +38 regressions → **86 files / 1257 tests green**. |
| **Done 2026-09-14** | Known-prod-bug sweep: **pantry `GET /:householdId/pantry` prod-500 FIXED** (server-owned catalog + resolver leaf, engine-parity pinned, proven on compiled dist); **household admin transfer + member removal** (atomic `$transaction` transfer, `DELETE members/:mid` w/ cleanup, FamilyPlans **Make admin / Remove**); **port-supervision** `KeepAlive=true` (kill-proofed); **dev-DB prune** (6 probe users + 7 throwaway households). +18 → **90 files / 1275 tests green**. |
| **Block launch** | ~~Deploy~~ **DONE 2026-09-16** — launchd `3001` restarted launchd-owned, Render redeployed (webhook 200, cook-share 401 live). Remaining: decide OTP/password for cross-device recovery + cook-on-phone flow; add the `WHATSAPP_*` env on Render + approve `cook_daily_plan` (Phase 2 flip — everything already runs dry-run); wire the server ingredient engine into the WhatsApp inbound "done" path. |
| **Before scale** | One authoritative family-week model (reconcile `UserPlan`/`SharedPlanItem`/`HouseholdPlanItem`/`MemberLane`); stable `memberKey` everywhere + FKs; repeat-expansion engine server-side; food-consumption ledger across ALL completion paths — incl. the cook's WhatsApp "done" (the server-side ingredient resolver now exists — the path is unblocked). |
| **This quarter** | `expenses` zod; dish-existence checks on `mealLog`/`tasteLedger`; client-side `canEditPlan` gating; cook page Hindi localization; onboarding number ≤> CookShare echo; WhatsApp Phase 3 (OTN — the same WABA becomes the OTP/identity channel). |
| **Nice-to-have** | `meals` pagination, `customDish` PATCH completeness, tray string enums, `isRoommateHousehold` decision, test-file type hygiene, tame the flaky trayP2028 round-trip assertions. |

Bottom line: the product logic (meal generation, tray, diet policy, ingredient resolution) is ahead of a typical MVP and well-tested. The launch blockers were **not in the meal engine** — they were the **identity/authorization layer**, the **inconsistent household data model**, and the **cook/pantry consumption story**. All four have code fixes now; the cook's daily-send channel decision is SET (WhatsApp Business API) and Phase 1 is built, dry-run, and test-gated. What remains is the deployment, the Meta Phase-0 setup, and the OTP/cross-device identity call.

## 7. Read next

**`docs/OFFICE_HOURS.md`** — the deep product review (what the real problem is,
who the first users are, what to build and what to explicitly NOT build), done
alongside this hardening pass.