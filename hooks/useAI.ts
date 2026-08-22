import { useState, useCallback } from 'react';
import { useStore } from '../app/store/useStore';

const AI_BASE = '/api/v1/ai';

interface AISuggestion {
  id: string;
  name: string;
  region: string;
  calories: number;
  protein: number;
  slots: string[];
}

interface AIScore {
  dietCompatibility: number;
  searchQuality: number;
  regionDiversity: number;
  metrics: { key: string; label: string; value: number; pct: number }[];
  issues: string[];
}

interface AIVoiceMessage {
  textHindi: string;
  textRegional: string;
  textEnglish: string;
  durationSec: number;
  language: string;
  region: string;
}

interface ChatMessage {
  type: string;
  text: string;
  dish?: string;
  voice?: boolean;
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${AI_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `AI request failed: ${res.status}`);
  }
  return res.json();
}

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<Record<string, AISuggestion[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (
    trayLibrary: any,
    diet: string,
    preferredRegions: string[],
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await post<{ suggestions: Record<string, AISuggestion[]> }>('/suggestions', {
        trayLibrary, diet, preferredRegions,
      });
      setSuggestions(data.suggestions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, loading, error, fetchSuggestions };
}

export function useAIScore() {
  const [score, setScore] = useState<AIScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async (params: {
    trayLibrary: any;
    planDays: any;
    pantryStaples: string[];
    diet: string;
    preferredRegions: string[];
    healthGoal?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await post<AIScore>('/score', params);
      setScore(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { score, loading, error, fetchScore };
}

export function useAIRecommendations() {
  const [recs, setRecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecs = useCallback(async (params: {
    trayLibrary: any;
    planDays: any;
    pantryStaples: string[];
    diet: string;
    preferredRegions: string[];
    healthGoal?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await post<{ recommendations: string[] }>('/recommendations', params);
      setRecs(data.recommendations);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations: recs, loading, error, fetchRecs };
}

export function useAITranslate() {
  const [loading, setLoading] = useState(false);

  const translate = useCallback(async (
    key: string,
    language: string,
    params: Record<string, string>,
  ): Promise<string> => {
    setLoading(true);
    try {
      const data = await post<{ translated: string }>('/translate', { key, language, params });
      return data.translated;
    } catch {
      return '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { translate, loading };
}

export function useAIVoice() {
  const [voice, setVoice] = useState<AIVoiceMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const generateVoice = useCallback(async (
    dishName: string,
    language: string,
    region: string,
  ) => {
    setLoading(true);
    try {
      const data = await post<{ voiceMessage: AIVoiceMessage }>('/voice', {
        dishName, language, region,
      });
      setVoice(data.voiceMessage);
    } catch {
      setVoice(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { voice, loading, generateVoice };
}

export function useAIChat() {
  const [loading, setLoading] = useState(false);

  const sendAction = useCallback(async (
    action: string,
    params: Record<string, string>,
    language: string,
  ): Promise<ChatMessage | null> => {
    setLoading(true);
    try {
      const data = await post<{ message: ChatMessage }>('/chat', { action, params, language });
      return data.message;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendAction, loading };
}
