# MealDrama — /office-hours product review

**Reviewer:** gstack-style, off-hours interrogation of the MVP as it stands.
**Date:** 2026-09-15 · **Companion to:** `docs/PRODUCTION_READINESS.md` (execution audit).

The engineering is unusually good — 84 test files, mocked-prisma route harnesses, a self-healing API layer, a real optimization engine. That discipline is an advantage *only if the product proposition is right*. This review treats the proposition as unproven and tries to break it. It is deliberately harsher than the readiness report.

---

## The short version

MealDrama is not "another meal planner." It is a **family-meal decisions + execution system**: someone must decide *what's for dinner*, and someone must *shop and cook it*. The personal side (pick favourites, auto-rotate, diet) is the moat. The household + cook side is the monetizable surface — but only when the cook receives **zero-effort, always-current, no-login** instructions and the pantry **closes the loop from eaten to remembered**. Today the personal side is real, the cook side was a WhatsApp screenshot, and the pantry never drained.

The strongest product worth launching is **"the cook's daily kit"**: a 10-minute "settle the week" ritual in the app, a stable link the cook can bookmark (done this session), and a ledged pantry that reconciles what disappeared (done this session). Sell to the Indian household with one hired cook first; the two-cook couple is second, not first, because the hired cook has zero adoption friction to overcome.

---

## 1. What is the real problem MealDrama solves?

The pains, in probable order of commercial value:

1. **The decision is the expensive part.** "What should we eat" is asked ~3× a day, forever. It spikes exactly when people are tired and busy. A family that decides once per week buys back ~10 hours of low-grade argument a month. This is the *planning* pain — and it is the part the engine already wins (diet-first generation, taste rotation, region pools).
2. **The execution gap.** In the Indian hired-cook household, the decision and the doer are different humans. The cook doesn't want "a plan" — they want *today's work order*: what to cook, for how many, from what's in the pantry. Sending a WEEK of kanji-laden WhatsApp text is not a work order; it is homework. This is the *cook* pain — and it was the least-solved part (manual `wa.me` link, copy promising a scheduler that didn't exist).
3. **The inventory is a lie.** Pantry lists say "we have onions". No one records that onion consumption. The buy list inflates to safety, hoarding runs out, and the ledger grows forever (only buy-gap math existed; nothing decremented on cooking — fixed this session). This is the *pantry* pain — the least emotionally urgent but the most persistent source of "why is nothing ever right."

So: MealDrama's real problem is **"decide once, then make sure the food and the cook are actually there."** That's a decisions-and-logistics product, NOT a menu catalog. Everything that pushes toward "another meal planner" (400+ dishes, contexts, novelty/health-goal knobs competing) is secondary to the two loops: **the week-settle loop** and **the cook→pantry loop**.

## 2. Who is the strongest initial user / customer?

**Primary, pay-launch: the 28–45 urban Indian household manager with a hired live-in/day cook** — one member owns food ("Riya decides"), everyone else eats. Signals already in the code: cook's WhatsApp number is a first-class onboarding field; `Expense.category = cook_salary` exists; regional/north-Indian cuisine bias is clearly Bangladesh/North-India-first; per-member diets (veg/eggitarian mix) are real household facts.

- They have the strongest pain (the decision is *their* job, not shared).
- They have money and a reason to pay (the cook's salary is already a budget line — ₹500–1000/mo to "stop me being the cook's manager" is trivial).
- Adoption is a **single-user decision**: they install it, the cook gets a link with zero app download. No network effect required.

**Secondary: the dual-career couple who cooks at home** (him/her both work; weekend meal-prep). Strong retention, weaker willingness to pay, and they *both* have to adopt.

**Not first, not yet:** roommates (shared-expense/split logic is already in the schema — that's a features creep smell), the professional chef, the "healthy eating influencer" audience. All three dilute the wedge.

## 3. Is the household + cook workflow actually a strong product wedge?

**The household is the right unit; the cook used to be the wrong artifact.** The wedge is real: one cook, N eaters with different preferences → someone must mediate. MealDrama's mediation (admin consolidates, then shares) is the correct mental model.

But the previous "share" was decimal-level weak: a manually composed WhatsApp message the admin re-copies and re-sends. Copy promised it would be "shared daily / every morning" — there was no scheduler, and even if there were, WhatsApp Business API (the only programmatic send) is not wired. **The wedge only becomes strong when the cook's artifact is zero-effort and always-current.** This session added that: a per-household **cook link** (`/cook/:token`) that renders today's plan — no login, no app, self-updating, revocable. *That* is the wedge. It is now true: "send the cook a link once; it's always today's plan."

Open question the review flags hard: **is the cook a person or a process?** If the cook reads any WhatsApp text they already have, they can cook from a link. If the real product is a *work-order system* (quantities, prep notes, "who eats what"), the cook needs **WhatsApp-delivered** instructions with a done/feedback loop. The current page shows dish × servings + member attribution + done state — keep going in that direction.

**Decided 2026-09-15: WhatsApp Business API is the cook's ONLY channel** — no app, no login, no email. The link stays as the embedded fallback/deep artifact; the daily plan and the cook's "done"/shortage replies run on WhatsApp. Full build + rollout plan: `docs/WHATSAPP_COOK_PLAN.md`.

## 4. What is confusing, unnecessary, weak, or over-engineered?

- **Three-and-a-half week systems.** `UserPlan` (legacy), `SharedPlanItem` (explicit share), `HouseholdPlanItem` (per-member snapshot with the dayIndex bug — fixed), `MemberLane` (a JSON mirror of HouseholdPlanItem). The system that loads fastest in my head = personal tray → (optional) explicit share → (optional) household snapshot. Every table beyond `SharedPlanItem` is a candidate to die when the week becomes authoritative. **Do not add a fourth.**
- **Meal "ownership" is fuzzy.** `authorUserId` (User) + `requestedBy/requestedFor` (member ids OR free strings, no FK — now normalized to member ids at the write boundary) + family rows (`requestedFor = null`) that belong to nobody, + `quantity` not tied to eaters. "Who eats this, how many servings each" is unanswerable in the schema — and it's the cook's #1 question. This is a *schema-as-product* smell: the product can't answer the question the UI doesn't ask.
- **Feedback exists but is decorative.** A taste ledger, per-dish like/dislike, meal-logs — but nothing feeds back to the cook ("Riya said too spicy"), nothing aggregates into "stop suggesting X," and nothing auto-rotates off disliked dishes in a *visible* way. The engine references the ledger; the user never sees its effect. Either surface it or cut it.
- **Expense / roommate features** (`Expense`, `ExpenseSplit`, `isRoommateHousehold` hardcoded true in Profile) — built before the market was decided. The family-with-cook doesn't need split-the-cook's-salary; it needs "record what we spent on groceries this month." Right features, wrong audience, early.
- **TTS "download voice"** (server shells out to macOS `say`): clever, irreparably desktop-only, near-zero usage value for a phone-first product. It was a demo toy; don't let it linger near the cook path.
- **Onboarding asks for a phone number (cook's WhatsApp) as a hard step** while auth has no phone. The number is a "send-to" field, not identity — that divergence was the skeleton of the account-takeover. Fixed on the auth side; the onboarding shouldn't *look* like it's signing the cook up.

## 5. Biggest gaps between this MVP and a product people use repeatedly

Ranked by "how often a real household hits this":

1. **The daily work order.** Coming home and opening the app to answer "so what do I cook tonight" must be ≤ 2 taps and already correct. Today the day-anchored "tonight" view competes with week/tray UI. Make the **today** screen the identity of the product.
2. **The completion loop.** Cooking must be a one-tap "done" that (a) marks the slot cooked, (b) drains the pantry (done — ledger consume on completed), and (c) is the ONLY place feedback can live ("too salty", "Riya liked it"). Without a completion ritual, everything else is planning theatre.
3. **The pantry reconcile.** Stock must not be a checkbox list. It should be a *conversation*: "wednesday you cooked rajma for 3 → buy list says tomatoes are short." Right now the forecast simulates consumption but the ledger only records purchases (fixed: real consumption now exists; wire it into the forecast's baseline).
4. **Change, skip, swap surfacing.** Members edit plans constantly. The cook must see *the delta*, not the full week ("Lunch changed: Rajma → Dal Makhani"). The activity feed exists; it's not in the cook's artifact. The delta is what makes the link feel alive.
5. **Repeat promises.** "Weekly / bi-weekly / monthly" is client-local state with no server engine. If you sell "set it and forget it," this must actually expand into real dated windows and survive reinstalls. Right now it doesn't survive a device change (and single-device identity is gone too — see auth).

## 6. Assumptions likely to be wrong

- **"A guest is one device."** The device-bound auth fix (this session) makes that explicit and secure — but guests who *do* move to a new phone (new phone = new `deviceSecret`) orphan their account unless they've Google-linked. For a product whose whole pitch is a *household* with multiple devices, single-device identity is a rounding error of the promise. **OTP-first phone auth is not an option; it is the next milestone** (see § 9).
- **"The cook is on WhatsApp and reads text."** Strong in India, but the message must be *utterable* — the cook reads it to themselves mid-cooking. Dish names in the cook's own language matter; that's why the multi-language share exists. Don't lose it in the link page (the link page is currently English-only — a real gap).
- **"Everyone in the household wants the same plan template."** Personalization is per-member; the *shared week* has no per-day theme ("Tuesday is no-cook/paneer day"). Households run on routines ("dal-chawal Tuesday", "leftovers Thursday") that no data field captures. Routines are the repeat engine's oxygen.
- **"Members eat what the plan says."** Real households: guests, cravings, "I'll just boil noodles." The plan must absorb the exception without drama (a skip that doesn't nuke the week's diversity) — the swappability machinery exists but is buried in tray UI.
- **"Diet policy + allergies everywhere is core."** It's differentiation for *advertising* to families ("what everyone can eat") — the FamilyDiets view — not for 100% of normal flows. It's over-engineered relative to today's users; keep it as the compliance layer, don't let it drive the UI.
- **"Naming quantities by 'servings' maps to pantry units."** Recipe units (1 pc onion) vs buy units (100 g) differ per user. The consume ledger only reconciles when units happen to match (documented). Until a household-wide unit normalization lands, consumption numbers will undercount. Honest, but plan for it.

## 7. What actually happens in real multi-user households

Walk through the honest day:

- **Riya settles the week** on Sunday night: picks favourites, the engine fills the rest, rotations lock the week, she shares the link with the cook. (Works today; the "settle" ritual needs a 10-minute guided screen.)
- **Aman swaps Wednesday dinner** to his favourite because he's cooking that night. His swap must (a) respect household diet rules, (b) notify the *plan*, not spam everyone, (c) be visible to the cook as a delta. Today the swap mutates local tray state and half-sticks to the shared week.
- **The cook cooks.** They don't open an app — they glance at the link, maybe print it. If a dish is out-of-stock they improvise; **nothing tells them the pantry is short** unless the app is open on *Riya's* phone. The shared-kitchen concept needs the cook's surface to carry the shortage flag ("tomatoes low — sub for cucumber").
- **Guest mode / "I'll just make khichdi".** Someone cooks off-plan. That's the completion loop's job: mark that allowance, don't punish it, drain the pantry for what was actually made. Presently unmodelled.
- **Two people editing the family week** → silent last-write-wins. Fixed this session (optimistic-lock `version` CAS → 409; refresh-and-retry). This is the difference between a demo and a family's shared artifact.
- **Nobody eats it.** Leftovers, eating out — inventory must not demand "consume exactly what was planned." The ledger (fixed) makes that survivable; the forecast must treat plan-skips as consumption-never-happened.

**The design smell to watch:** the product currently optimizes for *the planner's plan being correct for everyone* rather than *the household eating well with minimal friction*. The latter tolerates chaos; the former collapses under it.

## 8. What should the admin actually control? What should the cook receive and see?

**Admin controls (few, explicit):**
- The **week**: accept/deny requests, swap, skip — the "what are we eating" authority.
- **Who edits** the shared week (`canEditPlan`, view-only) — exists in API, needs UI + client-side gating.
- **The cook relationship**: who the cook is, the contact/channel, rotate the link (done), enable the daily share.
- **Members**: leave/remove/invite + **admin transfer** (if the sole admin leaves, the key must not orphan). This is UI-missing and must-fix before launch.
- NOT: every member's personal tray. Each adult decides their own lane; admin curates only the *shared* week. That division of labour is the product's sanity.

**Cook receives/sees (zero-login, one link):**
- Today's slot list with **quantities and who-eats-what** (currently dish + servings + attribution — keep extending).
- **Deltas**: what changed since last seen; what's short in the pantry.
- A **single done/completed action** per dish that closes the loop: cooked → pantry drains → "Riya said it was great" can attach.
- **The cook is never a login, never a second account, never an admin.** The moment we make the cook "sign in," we lose them. (The link page must therefore also respect language — see § 6.)

## 9. Where can the product create real value beyond "another meal planner"?

1. **The cook's daily work order** (the wedge): consolidate the *problem domain of cooking for N people* — quantities, convertions, "for whom", what's short, what changed. This is genuinely new; no meal planner targets the hired-cook Indian household.
2. **The pantry-as-ledger** (started): what actually leaves the shelf. Value = money in the groceries bill (buy less of what you already have, buy more of what you actually run out of). This is the feature most likely to justify subscription alone when quantified ("you saved ₹1,400 last month").
3. **The taste→auto-rotate circuit**: the ledger surfaces "Riya has disliked paneer 4×" into an *automatic* next-week change the user can *see and approve*. Closed-loop learning, visible, no ML mystique.
4. **Routines as the repeat engine**: "Tuesday = dal-chawal-free night" gives weekly patterns a spine that manual repeat can't. Repeats then carry *household* context, not per-device context.
5. **The family diet matrix**: "everyone can eat this" computed instantly (veg/eggitarian/non-veg/vegan + allergies) is a killer dinner-table utility, even if it's not the daily driver.

Do not chase: a recipe database (the cook knows the recipes; they need *what*, *for how many*, *from what*), meal nutrition/counting, social sharing, a cook marketplace, grocery delivery integration (India's last-mile is a fight you don't want).

## 10. What should we NOT build?

- **SMS/email marketing of plans.** A channel, not a feature — and WhatsApp Business API *is* the only realistic daily-send once you build it. Don't build "email your cook."
- **The expense/roommate finance suite** (ExpenseSplit, splitType). Families-with-cook neither need split-the-salary nor roommates' utility math. One "groceries this month" line item is enough.
- **New cuisine expansions / catalog breadth.** 400+ dishes already exceeds what any household cooks from in a quarter. Depth of *your* household's dishes wins; breadth is sunk cost.
- **Per-meal nutrition/calories/health scoring.** Onboarding's health goals are a filter, not a product axis. Calories push the product into fitness-app territory it can't win.
- **Social / "share your weekly menu"** — zero pull, infinite moderation/abuse surface.
- **A fourth plan table.** See § 4. Unify or delete; never add.
- **Chef-influencer mode** (admin = professional recipe curator). The strongest flow is the *family's own* dinner.

## 11. The strongest version worth taking to production (2026-09 status)

**One-sentence pitch:** *"Text your cook nothing. Decide your dinners in 10 minutes on Sunday. The cook follows one link; the pantry tells the truth."*

Three screens, in priority order:
1. **TODAY** (the app's home): "Tonight's plan" — dish(es), for whom, what's missing from pantry, one-tap DONE → pantry drains, feedback prompt. This screen IS the habit.
2. **SETTLE THE WEEK** (Sunday ritual): favourites → auto-rotation → approve → share the cook link. Runs on the engine you already built.
3. **THE KITCHEN** (shared): the cook link (live), the week with deltas, the stock that reconciles (consumed + bought + short).

Non-negotiable before general launch (mostly done or pinned this session):
- Real auth that a *household* can share across devices → **OTP-first phone auth** (or password) as the next milestone; device-bound auth closed the hole and stays as the guest path.
- The cook link page, in **cook-language**, with **who-eats-what** and pantry-shortage flags.
- Optimistic-lock on the shared week (done), admin transfer/removal UI (not done).
- Consumption ledger in the forecast baseline (consume fixed; wire into forecast).
- Honest copy: never promise "every morning" until a send channel exists (copy fixed).

First market: **the Indian family with a hired cook**, onboarding resistors-near-zero (cook installs nothing), the household manager pays, retention is the "done → drained → saved" loop. Second market: the two-cook couple. Everything else is deliberate path.

---

## 12. What changed in the repo because of this review

The review found the four launch blockers already noted and, because they block the *proposition* (not just the demo), this session turned each into code (all in the readiness report § 3):

- Auth takeover → device-bound register/login, hardened `/users`. *(The proof-of-cook-phone OTP is the flagged next build.)*
- The week → real `dayIndex`, `version` CAS (409 on conflict), member-id normalization for `requestedBy/requestedFor`.
- The cook → `CookShare` link + public no-login page, honest copy.
- The pantry → consumption ledger; completion drains stock (clamped, unit-checked).

Also surfaced mid-flight: the pre-existing member-`GET /pantry` resolver can't run from the compiled server (require of a root-only client TS module → `MODULE_NOT_FOUND`). That is a real production bug for the shared-kitchen screen and is item #1 in § 4 of the readiness report.