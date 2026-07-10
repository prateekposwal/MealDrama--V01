import { trayApi, offlineQueue, suggestionCache } from './trayApi';
import type { SuggestionResponse, UpdateItemPayload, AddSlotPayload, GuestModePayload } from './trayApi';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function retry<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries && navigator.onLine) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
      }
    }
  }
  throw lastError;
}

export class MealRepository {
  async addSlotItem(slotId: string, payload: AddSlotPayload): Promise<{ item_id: string; success: boolean }> {
    return retry(() => trayApi.addSlotItem(slotId, payload));
  }

  async updateItem(itemId: string, payload: UpdateItemPayload): Promise<{ success: boolean }> {
    return retry(() => trayApi.updateItem(itemId, payload));
  }

  async removeItem(itemId: string): Promise<{ success: boolean }> {
    return retry(() => trayApi.removeItem(itemId));
  }

  async getSuggestions(params: {
    mealType: string;
    diet: string;
    region: string;
    pantry?: string[];
  }): Promise<SuggestionResponse> {
    return suggestionCache.getWithFallback(params);
  }

  async setGuestMode(payload: GuestModePayload): Promise<{ applied_days: number; success: boolean }> {
    return retry(() => trayApi.setGuestMode(payload));
  }

  async completeSlot(date: string, mealType: string): Promise<{ success: boolean }> {
    return retry(() => trayApi.completeSlot(date, mealType));
  }

  async skipSlot(date: string, mealType: string): Promise<{ success: boolean }> {
    return retry(() => trayApi.skipSlot(date, mealType));
  }

  async unskipSlot(date: string, mealType: string): Promise<{ success: boolean }> {
    return retry(() => trayApi.unskipSlot(date, mealType));
  }

  get offlineQueue() {
    return offlineQueue;
  }
}

export const mealRepository = new MealRepository();
