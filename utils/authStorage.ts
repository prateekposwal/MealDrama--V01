/**
 * Dedicated Auth Storage for Beta Persistence.
 *
 * PROBLEM: Zustand persist hydration can be slow or fail on app restart,
 * causing the app to think the user is logged out or hasn't built a tray.
 *
 * SOLUTION: Synchronous, immediate persistence of critical routing state.
 * This ensures the user stays logged in and goes to the correct screen
 * even if the main store hydration lags.
 */

const AUTH_KEY = 'mealdrama-auth';

export interface AuthState {
  isLoggedIn: boolean;
  trayBuilt: boolean;
  user: Record<string, any> | null;
}

export const saveAuth = (auth: AuthState): void => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.error('[AuthStorage] saveAuth failed:', err);
  }
};

export const loadAuth = (): AuthState => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isLoggedIn: false, trayBuilt: false, user: null };
    const parsed = JSON.parse(raw);
    return {
      isLoggedIn: parsed.isLoggedIn ?? false,
      trayBuilt: parsed.trayBuilt ?? false,
      user: parsed.user ?? null,
    };
  } catch (err) {
    console.error('[AuthStorage] loadAuth failed:', err);
    return { isLoggedIn: false, trayBuilt: false, user: null };
  }
};

export const clearAuth = (): void => {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (err) {
    console.error('[AuthStorage] clearAuth failed:', err);
  }
};
