/**
 * Per-install DEVICE SECRET for the guest auth handshake.
 *
 * A guest account is bound to this device by (deviceId, deviceSecret). The
 * deviceId is the account key (collected as `id` at /auth/register); the
 * secret is the PROOF that whoever self-heals that account still physically
 * owns it. Without the secret, neither /register nor /login will issue a
 * token — knowing someone's email/phone/id is no longer enough to become them.
 *
 * Generation happens once per install and is persisted to localStorage. Keep
 * it in the browser storage namespace alongside the rest of auth storage.
 */

const DEVICE_SECRET_KEY = 'mealdrama-device-secret';

export function getOrCreateDeviceSecret(): string {
  try {
    const existing = localStorage.getItem(DEVICE_SECRET_KEY);
    if (existing && existing.length >= 16) return existing;
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    const secret = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(DEVICE_SECRET_KEY, secret);
    return secret;
  } catch {
    // localStorage unavailable (storage guard/private mode) — fall back to a
    // per-session secret so registration still completes for THIS session.
    return `md-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function clearDeviceSecret(): void {
  try {
    localStorage.removeItem(DEVICE_SECRET_KEY);
  } catch {
    // ignore
  }
}