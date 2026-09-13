import api from '../../lib/api';
import type { TasteAction } from '../../utils/tasteLedger';

/**
 * Taste-ledger API — the learning record for taste personalization.
 *   PUT /api/v1/taste-ledger  → record ONE action (idempotent per day)
 *   GET /api/v1/taste-ledger  → MY ledger, newest first (bounded)
 */
export interface TasteLedgerRow {
  id: string;
  userId: string;
  dishId: string;
  action: TasteAction;
  replacedWithId?: string;
  at: string;
}

export interface TasteLedgerPutResponse {
  event: TasteLedgerRow;
  duplicate: boolean;
}

export const tasteLedgerApi = {
  /** Record one taste action. Best-effort from UI surfaces; offline failures
   *  never break the meal flow (the local cache keeps the read model fresh). */
  put: (dishId: string, action: TasteAction, replacedWithId?: string) =>
    api.put<TasteLedgerPutResponse>('/taste-ledger', {
      dishId,
      action,
      ...(replacedWithId ? { replacedWithId } : {}),
    }),

  get: (limit = 200) =>
    api.get<TasteLedgerRow[]>(`/taste-ledger?limit=${limit}`),
};
