# MealDrama — Task / Todo Ledger

Always-current plan of record. Every agent session MUST: (1) append a RUN HISTORY
entry, (2) state the local-server running state (ports 3000/3001/3101), (3) commit + push.
No hidden state. Last updated: 2026-09-12.

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
