import { vi } from 'vitest';

const mockStorage: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  length: 0,
  key: () => null,
});

const existingWindow = typeof globalThis.window !== 'undefined' ? globalThis.window : {};
vi.stubGlobal('window', {
  ...existingWindow,
  localStorage: (globalThis as any).localStorage,
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  navigator: { onLine: true },
});
