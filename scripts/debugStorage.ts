/**
 * DEBUG SCRIPT — Run this in browser console to diagnose data loss
 * Paste and run: paste this entire file content in DevTools Console
 */

(function debugStorage() {
  console.group('🔍 MealDrama Storage Debug');

  // Check TrayStore
  const trayRaw = localStorage.getItem('mealdrama-tray-store');
  if (!trayRaw) {
    console.error('❌ mealdrama-tray-store is EMPTY — no data saved!');
  } else {
    try {
      const tray = JSON.parse(trayRaw);
      console.log('✅ mealdrama-tray-store found:');
      console.log('  - Version:', tray.version);
      console.log('  - plan.days keys:', Object.keys(tray.state?.plan?.days || {}).length);
      console.log('  - mealLoop.config:', !!tray.state?.mealLoop?.config);
      console.log('  - mealLoop.assignments:', tray.state?.mealLoop?.assignments?.length || 0);
      console.log('  - completions keys:', Object.keys(tray.state?.completions || {}).length);
      console.log('  - skipped keys:', Object.keys(tray.state?.skipped || {}).length);

      // Check for corrupted data
      if (typeof tray.state?.plan?.days !== 'object') {
        console.error('❌ plan.days is corrupted:', typeof tray.state?.plan?.days);
      }
      if (!Array.isArray(tray.state?.mealLoop?.assignments)) {
        console.error('❌ mealLoop.assignments is corrupted:', typeof tray.state?.mealLoop?.assignments);
      }
    } catch (e) {
      console.error('❌ mealdrama-tray-store is CORRUPTED:', e);
      console.log('Raw data (first 200 chars):', trayRaw?.substring(0, 200));
    }
  }

  // Check Store
  const storeRaw = localStorage.getItem('mealdrama-store');
  if (!storeRaw) {
    console.error('❌ mealdrama-store is EMPTY — no data saved!');
  } else {
    try {
      const store = JSON.parse(storeRaw);
      console.log('✅ mealdrama-store found:');
      console.log('  - Version:', store.version);
      console.log('  - isLoggedIn:', store.state?.isLoggedIn);
      console.log('  - user:', store.state?.user?.name || 'null');
      console.log('  - user.id:', store.state?.user?.id || 'null');
      const trayLib = store.state?.trayLibrary || {};
      const trayTotal = Object.values(trayLib).reduce((sum: number, arr: any[]) => sum + (arr?.length || 0), 0);
      console.log('  - trayLibrary items:', trayTotal);
      console.log('  - dishes:', store.state?.dishes?.length || 0);
    } catch (e) {
      console.error('❌ mealdrama-store is CORRUPTED:', e);
      console.log('Raw data (first 200 chars):', storeRaw?.substring(0, 200));
    }
  }

  // Check offline queues
  const queueRaw = localStorage.getItem('mealdrama_util_queue');
  if (queueRaw) {
    try {
      const queue = JSON.parse(queueRaw);
      console.log('📦 Offline queue:', queue?.length || 0, 'items');
    } catch {
      console.warn('⚠️ Offline queue corrupted');
    }
  }

  // Storage usage
  let totalSize = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  console.log(`💾 Total localStorage usage: ${(totalSize / 1024).toFixed(2)} KB / ~5000 KB`);

  console.groupEnd();
})();
