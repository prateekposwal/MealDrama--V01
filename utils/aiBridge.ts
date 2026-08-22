/**
 * AI Bridge — centralized module for all AI feature integrations.
 * Every function first tries the AI bridge (port 5002 proxied via /api/v1/ai/)
 * and falls back gracefully if unavailable.
 */
const AI_BASE = 'http://192.168.29.211:3001/api/v1/ai';

async function post<T>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(`${AI_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Fetch AI-ranked suggestions per meal slot */
export async function fetchAISuggestions(
  trayLibrary: Record<string, any[]>,
  diet: string,
  preferredRegions: string[],
): Promise<Record<string, { id: string; name: string; region: string; calories: number; protein: number; slots: string[] }[]> | null> {
  const data = await post<{ suggestions: Record<string, any[]> }>('/suggestions', { trayLibrary, diet, preferredRegions });
  return data?.suggestions ?? null;
}

/** Fetch AI diet/plan score and issues */
export async function fetchAIScore(params: {
  trayLibrary: any; planDays: any; pantryStaples: string[];
  diet: string; preferredRegions: string[]; healthGoal?: string;
}): Promise<{ metrics: any[]; issues: string[]; dietCompatibility: number; searchQuality: number; regionDiversity: number } | null> {
  return post('/score', params);
}

/** Fetch AI recommendations */
export async function fetchAIRecommendations(params: {
  trayLibrary: any; planDays: any; pantryStaples: string[];
  diet: string; preferredRegions: string[]; healthGoal?: string;
}): Promise<string[] | null> {
  const data = await post<{ recommendations: string[] }>('/recommendations', params);
  return data?.recommendations ?? null;
}

/** Translate a meal phrase via AI */
export async function fetchAITranslate(key: string, language: string, params: Record<string, string>): Promise<string | null> {
  const data = await post<{ translated: string }>('/translate', { key, language, params });
  return data?.translated ?? null;
}

/** Generate AI voice message for a dish */
export async function fetchAIVoice(dishName: string, language: string, region: string): Promise<{
  voiceMessage: { textHindi: string; textRegional: string; textEnglish: string; durationSec: number };
  recipeDescription: string;
} | null> {
  return post('/voice', { dishName, language, region });
}

/** Send a chat action to the AI assistant */
export async function fetchAIChatAction(action: string, params: Record<string, string>, language: string): Promise<{
  type: string; text: string; dish?: string; voice?: boolean;
} | null> {
  const data = await post<{ message: any }>('/chat', { action, params, language });
  return data?.message ?? null;
}
