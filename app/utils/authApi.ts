import api from '../../lib/api';

export async function registerUser(id: string, name: string): Promise<{ user: Record<string, unknown>; token: string } | null> {
  try {
    const result = await api.post<{ user: Record<string, unknown>; token: string }>('/auth/register', { id, name });
    return result;
  } catch (err) {
    console.warn('[AuthApi] register failed:', err);
    return null;
  }
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
