## Goal
- Enhance WhatsApp share flow, fix undo-skip race condition, add DP optimizations across scoring/search/pairing/pantry, implement component-aware 5-role plate completeness with Dessert as 5th role, harden DP with timeout/greedy-fallback/Pareto/MAB/telemetry/cache-invalidation, **fix QuickAddModal infinite-render crash**, **fix wrong pairing chips in dish search (metadata-driven defaults)**.

## Constraints & Preferences
- "Restore meal" state must persist across tab switches.
- DP optimizations are additive layers, not rewrites.
- Cultural exceptions for one-pot meals (khichdi, biryani, thali) bypass rigid completeness checks.
- CarbBase stays combined (Bread + Rice not split).
- 5 plate roles: CarbBase, ProteinCore, FiberSide, Hydration, Dessert — each +2.5 (max +12.5 completeness bonus).
- Wrong pairing chips in `SwapCustomizeModal` dish search: Chinese starters show Rice+Roti; teas show Rice/Sides instead of tea-appropriate pairings — fix via **metadata-driven `defaultPairings` on `Dish`**.
- `dishToMeal` should stop inferring carb options for dishes that don't need them; let the dish declare its expected defaults directly.

## Progress
### Done
- **Undo-Skip Fix**: `undoSkipSlot` cancels pending `debounceSave` timer for `skip_${key}` and calls `trayApi.unskipSlot` (POST /tray/unskip).
- **Search/Pantry Updates**: Ingredients added to Idli, Dosa, Kodo Ko Roti, Matar Paneer, Aloo Gobi, Dal Makhani, Chole.
- **WhatsApp Share Flow**: Inline cook contact editing in `Dashboard.tsx`; slot-level share buttons in `MealCard.tsx`; native script translations in `share.ts`.
- **Profile Picture**: Upload in `Profile.tsx`/`Dashboard.tsx`; stored as base64 in `user.avatarUrl`.
- **Analytics Fix**: `cyclesCompleted` increments only on pointer wrap.
- **Hydration Safety**: Clears corrupted storage pre-hydration; `nativeStorage` implements `PersistStorage` directly.
- **Dish Selection Bug (search)**: Fixed `dishSearch.ts` region matching — changed from `d.region.toLowerCase().includes("north")` (matched "northeast" too) to word-boundary regex `\bnorth\b`.
- **Gulab Jamun, Ladoo, Barfi**: Added to `dishLibrary.ts` with full ingredient lists, emoji icons, and multiple variants (3 ladoo, 3 barfi).
- **5-Role Completeness + Dessert**: `hasDessert` flag in `MealsForScoring`/`PlateOptimizationCandidate`; max score 62.5; `isOnePotCombo` cultural bypass; keyword matching (gulab, kheer, halwa, jalebi, ladoo, barfi, sweet, ice cream, rasgulla).
- **DP Timeout + Greedy Fallback**: New `utils/dpTimeout.ts` — `checkWithFallback()` wrapper with 300ms timer integrated into all 5 DP engines: rotation, plate balance, dish diversity, pairing, pantry matching.
- **Swap Delta-Scoring**: New `utils/swapScoring.ts` — `scoreSwap()`, `findBestSwap()`, `findBestInsertion()` evaluate local plate balance delta with reason tags.
- **Pareto Frontier**: `optimizePlateBalance` now collects all non-dominated terminal DP states (3 objectives: nutrition, completeness, calorie efficiency), returns top 8 as `paretoFrontier[]`.
- **Multi-Armed Bandit**: New `utils/preferenceBandit.ts` — `PreferenceBandit` class with UCB1, 5 signals (accept/skip/swap_out/complete/reject), localStorage persistence.
- **Cache Invalidation**: New `utils/dpCache.ts` — `DpCache<T>` with state-hash keying, entries auto-expire on `invalidateOnChange(trayLibrary, config)`; integrated into `reconcileLoopStateWithTray`.
- **Telemetry**: New `utils/dpTelemetry.ts` — `recordMetric()` + `getDpStats()` collect execution time, cache hit rate, fallback count per DP function; zero PII, 1000-entry ring buffer.
- **All DP files updated**: `nutritionScore.ts`, `mealLoopEngine.ts`, `dishSearch.ts`, `pairingEngine.ts`, `pantryRecipeMatch.ts` — each uses `checkWithFallback` with timed guards inside inner loops.
- **QuickAddModal infinite-render crash — FIXED**:
  - `SwapCustomizeModal.tsx`: Stabilized `renderSwapItem` with `useCallback`.
  - `App.tsx`: Wrapped `<QuickAddModal>`'s `dishes`/`customDishes` in `useMemo` to prevent unstable references.
  - `useTrayStore.ts`: Fixed `hydrateTrayFromLibrary` — changed `Object.fromEntries(entries)` to `Object.assign({}, ...entries)` to handle arrays correctly.
  Root cause: `useBackendDishes()` returned fresh reference per render, cascading through `allDishes` → `rankedDishes` → inline `renderItem` → `VirtualList.memo` re-render → infinite loop.

### Done (continued)
- **Wrong pairing chips in dish search — FIXED**:
  - Added `defaultPairings` field to `Dish` type and `Meal` type.
  - Populated for 8 classic teas (Temi, Darjeeling, Balma, Berinag, Black, Green, Kangra, Milk) and 3 bubble teas — sides: Biscuits, Cookies, Namkeen, Roasted Peanuts; no gravy/roti/rice.
  - Populated for Chinese starters (Spring Rolls, Honey Chilli Potato, Chicken Lollipop) and Momos — sides: Dipping Sauce, Spring Onion / Momos Chutney; no gravy/roti/rice.
  - Updated `dishToMeal`: three-tier priority — (1) explicit `defaultPairings`, (2) nearest-dish similarity fallback (weighted by region + style + shared tags, cached), (3) legacy inference as last resort.
  - Updated `applySmartDefaults`: checks `meal.defaultPairings` first and returns immediately with `itemQtys` — bypasses all kitchen logic for dishes with explicit pairings.
  - Added 8 missing teas to `dishStyles.ts` as `'beverage'` style (safety net for any code path using `getDishStyle`).
  - All 0 new type errors; 145 pre-existing errors unchanged.

### Blocked
- (none)

## Key Decisions
- **CarbBase Not Split**: Bread and Rice remain one role.
- **Dessert is Positive Bonus**: +2.5 completeness role, not pure sugar penalty.
- **Completeness as Additive Layer**: `scorePlateBalance` unchanged — bonus added via the same function.
- **Cultural Bypass**: Dishes with `isCompleteMeal` or one-pot tags auto-get full completeness bonus.
- **Timeout over Web Workers**: Synchronous DP with cooperative time-checking (`performance.now()` per loop iteration) chosen over workers for simplicity and React Native compatibility.
- **Pareto over Single Best**: DP now tracks 3 objectives instead of 1 — nutrition score, completeness, and calorie efficiency — giving users meaningful trade-off choices.
- **MAB over Cloud ML**: UCB1 bandit (O(1) update, stateless, no cloud dependency) chosen over neural models for offline-first mobile.
- **Metadata-driven defaults over inference**: `Dish` gets a `defaultPairings` field (gravy/roti/rice/sides/beverages/dessert) so each dish declares its expected accompaniments directly — `dishToMeal` reads it instead of inferring from tags/categories/region, and `applySmartDefaults` consults `meal.defaultPairings` first before falling back to kitchen logic.

## Next Steps
- Populate `defaultPairings` for more dishes as needed (soups, salads, desserts, breads, etc.).
- Rebuild APK after all fixes.

## Critical Context
- `QuickAddModal` infinite render was caused by unstable `dishes` ref from `useBackendDishes()`. Fix: wrap `dishes`/`customDishes` in `useMemo` in `App.tsx`; stabilize `renderSwapItem` with `useCallback`.
- Wrong pairing chips root cause: `dishToMeal` infers `rotiOptions`/`riceOptions` based on category ('lunch'/'dinner') and tags, which misfires for starters/snacks in lunch category (Spring Rolls, Dimsum) and for teas/standalone dishes. Teas also hit pairing engine's region fallback which assigns 'Steamed Basmati' as a side for 'northeast' region.
- Fix implemented: `defaultPairings` on `Dish` — three-tier priority in `dishToMeal`:
  1. Explicit `defaultPairings` on the dish (authoritative)
  2. Nearest-dish similarity fallback (tag/style/region weighted scoring, cached)
  3. Legacy inference as last resort
- `findNearestDefaultPairings`: iterates `DISH_LIBRARY`, scores candidates by same region (+3), same dishStyle (+5), shared signal tags (+2 each), shared other tags (+1 each). Results cached per dishId.
- **4-layer guard**: (1) Role classification via `classifyDishRole` — style-authoritative tag/category fallback into 8 roles (`beverage`, `main`, `starter`, `dessert`, `bread`, `rice`, `side`, `other`). (2) Role gate — `rolesMatch()` only allows same-role matching; `'other'` never matches anything. (3) Minimum score threshold of 6 prevents weak/incidental matches. (4) Legacy inference (Priority 3) preserved intact as safety net when similarity fails.
- `SwapCustomizeModal.tsx` lines 702-753: `renderSwapItem` calls `applySmartDefaults(meal, mealType)` to get chips — this is the only rendering path that shows pairing chips in search results. The store's `addMealToSlot` and `replaceMealInSlot` also call `applySmartDefaults` to seed the initial tray item state.
- `undoSkipSlot` in `useTrayStore.ts` clears pending debounce timer and calls `trayApi.unskipSlot` (POST /tray/unskip).
- All 5 DP engines now use `checkWithFallback(() => {...}, fallbackValue)` with cooperative time checking — if >300ms elapses, returns fallback.
- `preferenceBandit` persists to localStorage under key `md_preference_bandit`; signal mapping: accept=+1.0, complete=+0.8, skip=-0.3, swap_out=-0.5, reject=-1.0.
- `DpCache<T>` in `dpCache.ts` links entries to the current state hash (computed from `trayLibrary` + `config`) — all cache entries auto-expire when `invalidateOnChange` detects a hash change.
- Telemetry ring buffer (`MAX_METRICS = 1000`) stored in-memory (`recordMetric` / `getDpStats`), no persistent storage.

## Relevant Files
- `utils/dpTimeout.ts`: New — `setDpTimeout()`, `createTimeChecker()`, `checkWithFallback()`.
- `utils/dpTelemetry.ts`: New — `recordMetric()`, `getDpStats()`, `clearMetrics()`, `recordMetricAndReturn()`.
- `utils/dpCache.ts`: New — `DpCache<T>`, `invalidateOnChange()`, `computeStateHash()`.
- `utils/preferenceBandit.ts`: New — `PreferenceBandit` class with UCB1, `recordSignal()`, `select()`, `getStats()`.
- `utils/swapScoring.ts`: New — `scoreSwap()`, `findBestSwap()`, `findBestInsertion()`.
- `store/useTrayStore.ts`: Added `invalidateOnChange` call in `reconcileLoopStateWithTray`; fixed `hydrateTrayFromLibrary` (Object.fromEntries → Object.assign); undo-skip fix.
- `utils/nutritionScore.ts`: Exported `tallyCompleteness`; added Pareto frontier (`paretoFrontier[]` in `PlateOptimizationResult`), timeout via `checkWithFallback`, `DpCache` for plate optimization cache, telemetry via `recordMetricAndReturn`.
- `utils/mealLoopEngine.ts`: `optimizeRotationQueue` wrapped with `checkWithFallback`, timed guard in outer DP loop.
- `utils/dishSearch.ts`: Fixed region matching (word-boundary regex); `optimizeTopNDiversity` wrapped with `checkWithFallback`.
- `src/data/pairingEngine.ts`: `computePairingForSlot` wrapped with `checkWithFallback`; timed guard in `selectBestForCategory`.
- `utils/pantryRecipeMatch.ts`: Phase 2 DP optimization wrapped with `checkWithFallback`.
- `constants/dishLibrary.ts`: Added gulab jamun (`gulab-jamun`), ladoo (`ladoo` with 3 variants), barfi (`barfi` with 3 variants). Added `defaultPairings` field to `Dish` type; populated for 8 classic teas, 3 bubble teas, Spring Rolls, Honey Chilli Potato, Chicken Lollipop, and Momos.
- `screens/MealTrayBuilder.tsx`: Onboarding builder that passes `dishes` from `useBackendDishes()` to `QuickAddModal` — issue resolved by `useMemo` in `App.tsx`.
- `screens/Dashboard.tsx`: Dessert keyword matching; passes `dishes` prop (from parent) to `QuickAddModal`.
- `App.tsx`: Fixed QuickAddModal infinite render — wraps `dishes`/`customDishes` in `useMemo`.
- `components/meal/SwapCustomizeModal.tsx`: Lines 702-753 `renderSwapItem` — stabilized with `useCallback`; chips come from `applySmartDefaults(meal, mealType)` only. This is the root rendering path for wrong pairing chips.
- `utils/dishToMeal.ts`: Converts `Dish` → `Meal` for smart defaults — three-tier priority: (1) explicit `defaultPairings`, (2) nearest-dish similarity fallback, (3) legacy inference. Imports `DISH_LIBRARY` for nearest-dish scoring. `findNearestDefaultPairings` caches results per dishId.
