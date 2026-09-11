import api from '../../lib/api';

const REGISTER_RETRIES = 3;
const REGISTER_RETRY_DELAY_MS = 1500;

/**
 * Register a user on the server and return the JWT token.
 * Retries up to 3 times with backoff — this is the fire-and-forget path
 * called from login().  If it fails, the token stays null and household
 * operations will 401.  ensureToken() in useStore retries on demand.
 */
export async function registerUser(id: string, name: string): Promise<{ user: Record<string, unknown>; token: string } | null> {
  for (let attempt = 0; attempt < REGISTER_RETRIES; attempt++) {
    try {
      const result = await api.post<{ user: Record<string, unknown>; token: string }>('/auth/register', { id, name });
      return result;
    } catch (err) {
      console.warn(`[AuthApi] register attempt ${attempt + 1}/${REGISTER_RETRIES} failed:`, err);
      if (attempt < REGISTER_RETRIES - 1) {
        await new Promise(r => setTimeout(r, REGISTER_RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  return null;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.warn('[AuthApi] logout failed:', err);
  }
}

export async function getMe(): Promise<Record<string, unknown> | null> {
  try {
    const result = await api.get<{ user: Record<string, unknown> }>('/auth/me');
    return result.user;
  } catch (err) {
    console.warn('[AuthApi] getMe failed:', err);
    return null;
  }
}
