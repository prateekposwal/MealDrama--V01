# MealDrama — Cook Channel: WhatsApp Business API

**Decision (product, 2026-09-15):** the cook's ONLY channel is WhatsApp.
No app install, no login, no email. All cook communication — the daily plan,
changes, "done", shortage flags, feedback — runs through WhatsApp Business
API. The no-login `/cook/:token` link (built yesterday) becomes the *fallback*
and the *deep artifact* embedded in every WhatsApp send, not the primary path.

> **STATUS — Phase 1 SHIPPED (2026-09-16).** Everything below marked `[x]` is
> built, tested (38 new regressions + 1257 total green), and live in `server/`
> dist. It runs in **dry-run** until the `WHATSAPP_*` env values land: the
> daily scheduler and every reply AUTHENTICALLY log the composed message and
> never touch the network. Flip to real sends by adding the env vars (Render →
> service → Environment). The one remaining MATTER ON META is Phase 0 (WABA
> + number + `cook_daily_plan` template approval).

This document is the plan + the left-to-do. It is deliberately implementation-
shaped: each section names the files/fields it will touch and what is blocked
on Meta vs what can be built today with zero credentials.

---

## 1. The channel model that fits the product

WhatsApp Business Platform (Cloud API) is built on **conversations**, not
messages, and on a **24-hour dialog window** per conversation:

- Inside the 24 h window (cook replied last evening → next morning is still in
  the window) the business can send free-form text and interactive messages.
- Outside the window, or to *start* a conversation, the business must send an
  **approved template message** (variables allowed), paying a conversation fee.
- **This maps exactly onto MealDrama's rhythm.** Morning plan = template (cold
  start on day one / after silence). Evening "done" reply = inbound → opens a
  service conversation → the *next* morning's plan rides inside that window.
  Each active day costs **≈ 1 conversation**, not "a message per dish."

Net: one template (`cook_daily_plan`), one inbound intent parser, one
conversation per household-day. Price per active household-day is on the order
of **₹0.5–2** at Meta's current IN rate card (confirm the live rate card —
Meta changes it; service/utility tiers are materially cheaper than marketing,
so classify templates as **service/utility**, never marketing).

### Outbound message the cook actually wants

Not a menu, a **work order**. One template payload:

> {Cook name}, {household} today:
> 🍛 Lunch — Rajma Chawal (for 3: Riya, Aman)
> 🍱 Dinner — Dal Makhani + Tandoori Roti (for 4: family)
> ⚠️ Tomatoes are short from yesterday
> Open: https://…/cook/{token} · Tap ✓ when done

Variables (`{{1}}`…`{{n}}`): cook name, household, per-slot lines (dish ×
servings × who), shortage line, cook-link. The link embedded in the message
keeps the cook one tap from the full always-current page (the phase-0
artifact) and gives the inbound flow a stable reference.

## 2. Architecture (what lands in the repo)

```
┌─────────────┐   outbound   ┌───────────────────────┐   Graph API    ┌────────────┐
│ cookScheduler│────────────▶│ lib/whatsapp.ts (send)│──────────────▶│  Meta WABA │
│  (in-process, per-day)     └───────────────────────┘                │ phone:+91..│
└─────────────┘                                                        └────────────┘
┌─────────────┐   inbound    ┌───────────────────────┐
│ Meta webhook│────────────▶│ whatsappWebhook.ts     │──▶ cookReply.ts: intents
│ (POST)      │              │ (raw body + signature) │    done ✓ / shortage ⚠ / feedback
└─────────────┘              │                       │──▶ householdFeedStore-equivalent
                             └───────────────────────┘    completes slots / flags pantry
```

- **`server/src/lib/whatsapp.ts`** — thin Cloud API client (env-gated):
  `sendTemplate(name, lang, params, to)`, `sendText`, `sendInteractive`
  (buttons: "✅ Done" / "⚠️ Something short"). Headers:
  `Authorization: Bearer <WHATSAPP_TOKEN>`, `Content-Type: application/json`,
  body to `https://graph.facebook.com/v{ver}/{WHATSAPP_PHONE_ID}/messages`.
  Idempotency key per household-day so a scheduler retry never double-sends.
  **Also speaks a `dry-run` sender** (logs the intended message) so Phase 1 is
  testable with no Meta account.
- **`server/src/routes/whatsappWebhook.ts`** — GET `/webhook/whatsapp` verifies
  the `hub.challenge` (Meta's setup ping); POST receives messages. **Raw-body
  signature verification** is mandatory: `X-Hub-Signature-256` = HMAC-SHA256(
  `WHATSAPP_APP_SECRET`, raw JSON). Express quirk to handle: the route must get
  the RAW body, so it mounts ahead of (or beside) the global `express.json`
  parser (`express.raw({ type: 'application/json' })`) and verifies before any
  parsed-body logic.
- **`server/src/lib/cookScheduler.ts`** — in-process daily job (their servers
  are long-running: launchd + Render). Aligns to HH:00 (IST-default,
  per-household `notifyAt`/`notifyTz`), enumerates households with
  `CookShare.cookPhone` + `notifyEnabled` + pending items, sends the day
  template, records `lastSentDate` (idempotent — a restart never resends same
  day). Documented limits: single-instance, no failover — fine for launch.
- **`server/src/routes/cookShare.ts` (extend)** — the cook entity becomes the
  messaging config: `CookShare.cookPhone`, `notifyEnabled`, `notifyAt`,
  `notifyTz`, `lastSentDate`, `consentAt`. The WhatsAppShareModal "Cook's live
  link" card grows a "send today's plan daily on WhatsApp" toggle (writes the
  first three fields); onboarding's existing cook-WA-number field is echoed
  into CookShare at household creation (it currently lives on the manager's
  personal `DietPreference` — that field is a *send-to* target, not identity).
- **`server/src/lib/cookReply.ts`** — inbound intent map (English + Hinglish
  tokens): `done`/`ho gaya` → complete today's *pending* shared items for that
  household (matching by sender phone → CookShare.cookPhone) and ack via
  `sendText`; shortage tokens (`no tomatoes`, `tomato nahi`, …) → pantry
  shortage flag + activity entry; unknown text → a “need help?” fallback that
  doesn't loop on the admin. This is the **two-way** half: the cook closes the
  loop with zero app.

### Env / secrets (all missing today — Phase 1 gates on values arriving)
`WHATSAPP_TOKEN` (system-user token), `WHATSAPP_PHONE_ID`, `WHATSAPP_APP_SECRET`
(webhook HMAC), `WHATSAPP_VERIFY_TOKEN` (webhook challenge). Add to
`server/.env` + Render env, and visibly to `env.example` (no values).

## 3. Pre-reqs that take weeks, start now

1. **WABA + Business verification** (Meta) — days–weeks, needs a real business
   (even a single-owner). 
2. **A dedicated phone number.** Decide: direct-Meta number vs an Indian BSP
   (Gupshup / Interakt / Twilio / Vonage) that handles number provisioning,
   Meta verification and support for a margin. Recommendation: **start
   direct-Meta with the Sandbox/test number**, abstra cited behind
   `lib/whatsapp.ts` so a BSP switch is env-only (BSPs speak the same Graph
   surface).
3. **`cook_daily_plan` template + approval** — the long pole. Draft vars now;
   submit the moment the WABA is live (Meta approval is not instant). One
   template per cook language **(Hindi first — the cook-artifact rule: it must
   be utterable; the English-only cook page was a reviewed gap)**.
4. **Webhook URL** → Meta dashboard: `https://mealdrama.onrender.com/api/v1/
   webhook/whatsapp` (or tunnel) + subscribe to `messages`.

## 4. Compliance & consent (India)

- Capture an explicit **opt-in** when the cook number is saved ("send today's
  plan to the cook on WhatsApp") → `CookShare.consentAt`. Never send without it.
- **Never use marketing templates.** Plan + operational replies = service/
  utility classification. This keeps costs low *and* stays inside India's
  consent rules for promotional comms.
- Keep an unmistakable **off** (disable `notifyEnabled`); a revoked cook link
  (`rotate`) already hard-revokes the embedded URL.

## 5. Cost & scale reality

- Pilot (1–50 households): each active household-day ≈ 1 conversation ≈
  single-digit ₹/day/household at current rates — a COGS line, not a blocker.
- At scale/free-B2C this becomes real money + per-conversation rate risk; the
  product should keep the *link* as a no-cost fallback and treat the daily
  push as the paid-tier differentiator. Don't promise "free daily WhatsApp".

## 6. Rollout phases

| Phase | What | Blocked on |
|---|---|---|
| **0 — now** | WABA business verif + number + `cook_daily_plan` template drafts (EN + HI); keep wa.me + cook link as shipping features | Meta setup (user) |
| **1 — build (no creds)** | `whatsapp.ts` client + dry-run, `cookScheduler`, webhook route + HMAC verify, `CookShare` messaging fields + migration, modal toggle, `cookReply` intent parser + unit tests | nothing — can be written + tested in dry-run today |
| **2 — flip** | real token + phone id + template → daily push to pilot households; inbound done/shortage loop; measure retention (conversations/day, done-rate) | Phase 0 + Phase 1 |
| **3 — identity spin-off** | **OTP via WhatsApp (OTN template)** — the same WABA serves the auth milestone: cross-device household identity + verify the cook's own number (the "cook's phone" flow from the office-hours review) | Phase 0 (+ product sign-off) |

## 7. Left to do — full launch checklist (this plan + standing backlog)

**WhatsApp-specific**
- [ ] WABA / business verification / number / template (EN+HI) — *user-started*
- [x] `lib/whatsapp.ts` client + dry-run sender + idempotency + tests *(2026-09-16)*
- [x] webhook route with raw-body HMAC verify + tests (incl. express raw/body order) *(2026-09-16)*
- [x] `cookScheduler` day-aligned idempotent job + tests *(2026-09-16)*
- [x] `CookShare` messaging fields + migration (additive, dev DB) + modal toggle + consentAt *(2026-09-16)*
- [x] `cookReply` intents (done/shortage/fallback) + phone→household mapping + tests *(2026-09-16)*
- [x] env additions (`WHATSAPP_*`) + `env.example` (Render vars are dashboard-side: token, phone id, app secret, verify token) *(2026-09-16)*
- [ ] onboarding number ≤> CookShare echo + honest "daily on WhatsApp" copy once Phase 2 is real *(modal now carries the toggle + opt-in copy; onboarding echo still pending)*
- [ ] cook page localization (Hindi) so the embedded link matches the message
- [ ] **Phase 2 flip:** set `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` / `WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN`, wire the webhook URL at Meta, point the daily template at the real `cook_daily_plan`. Do one soft-launch household, then measure (conversations/day, done-rate).
- [ ] Inbound consumption ledger: the cook's WhatsApp "done" marks meals done but does NOT yet draw down pantry the way the in-app complete does (client-side `stockConsume`). Server-side ingredient resolution for the inbound path is the latent-pantry-bug follow-up.

**Standing backlog (unchanged, from readiness report §4/§6 + office-hours)**
- [ ] Deploy the 2026-09-15 + 2026-09-16 build (launchd 3001 + Render still pre-fix)
- [ ] Pantry `GET /:householdId/pantry` resolver prod-500 (root-only TS `require()`)
- [ ] OTP-first phone auth (Pairs with WhatsApp Phase 3 — one platform: WhatsApp OTN)
- [ ] Admin transfer / member removal / regenerate-code UI; client-side `canEditPlan`
- [ ] Server-side repeat-expansion engine (weekly/bi-weekly/monthly survive reinstalls)
- [ ] Consumption ledger wired into the forecast baseline (consume now exists)
- [ ] Expenses zod; dish-existence checks on mealLog/tasteLedger; meals pagination
- [ ] Test-file typecheck hygiene + tame the flaky trayP2028 round-trip group-count assertions
- [ ] Prune probe-* / Smoke Cook Household dev-DB rows (open task #4)

**Sequencing call:** Phase 1 is DONE and testable today (dry-run). Phase 0 (Meta
setup) is the user's owner-task and the only thing between us and live sends.