// ─────────────────────────────────────────────────────────────────────────────
// COOK-SHARE API — one stable, no-login cook link per household.
//   GET/PUT /households/:id/cook-share (auth) ; the public /cook/:token page
//   renders TODAY's family plan with no app, no login, updates automatically.
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../lib/api';
import { getApiBase } from '../../lib/api';

export interface CookShareRow {
  displayName: string;
  enabled: boolean;
  url?: string;
  cookPhone?: string | null;
  notifyEnabled?: boolean;
  notifyAt?: string;
  notifyTz?: string;
  language?: 'hi' | 'en';
  consentAt?: string | null;
  lastSentDate?: string | null;
}

export interface CookSharePutBody {
  displayName?: string;
  enabled?: boolean;
  rotate?: boolean;
  cookPhone?: string | null;
  notifyEnabled?: boolean;
  notifyAt?: string;
  notifyTz?: string;
  language?: 'hi' | 'en';
}

export const cookShareApi = {
  get: (householdId: string) =>
    api.get<{ share: CookShareRow | null }>(`/households/${householdId}/cook-share`),

  put: (householdId: string, body: CookSharePutBody) =>
    api.put<{ share: CookShareRow }>(`/households/${householdId}/cook-share`, body),
};

/** Absolute, shareable URL for a token path like "/cook/abc123". */
export function cookShareUrl(tokenPath: string): string {
  return `${getApiBase()}${tokenPath}`;
}