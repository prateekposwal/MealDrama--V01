// Cross-platform text-to-speech: uses the native Capacitor plugin in the
// Android/iOS APK (where the WebView does NOT expose window.speechSynthesis
// reliably — Android System WebView usually returns an empty voice list /
// speaks nothing), and falls back to the browser Web Speech API on the web
// PWA (Chrome/Safari), where the native plugin is absent.
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let nativeAvailable: boolean | null = null;

// The Capacitor plugin registers regardless of platform, but only WORKS on a
// native install. The web bundles of the plugin still import fine; calling
// speak() on web throws ("not implemented"). Never touch it on the web — keep
// the browser's speechSynthesis path.
function isNativeApp(): boolean {
  if (nativeAvailable !== null) return nativeAvailable;
  nativeAvailable = Capacitor.isNativePlatform();
  return nativeAvailable;
}

export interface TtsOptions {
  text: string;
  lang?: string;
  rate?: number;
}

/** Speak text aloud; resolves on completion. Guarded so a failure on any
 *  platform returns false instead of throwing (voice is a nice-to-have). */
export async function speakText(opts: TtsOptions): Promise<boolean> {
  if (isNativeApp()) {
    try {
      await TextToSpeech.speak({
        text: opts.text,
        lang: opts.lang || 'en-US',
        rate: opts.rate ?? 0.85,
      });
      return true;
    } catch {
      try {
        await TextToSpeech.stop();
      } catch { /* ignore */ }
      return false;
    }
  }
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(opts.text);
    u.lang = opts.lang || 'en-US';
    u.rate = opts.rate ?? 0.85;
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    u.onstart = () => {};
    u.onend = () => done(true);
    u.onerror = () => done(false);
    synth.speak(u);
    // Web Speech can silently not fire onend on some browsers (Android
    // System WebView) — give the caller a bounded wait so "Stop" state is
    // not wedged forever.
    setTimeout(() => done(true), Math.min(60000, Math.max(5000, opts.text.length * 40)));
  });
}

/** Stop any in-flight utterance, native or web. */
export async function stopSpeaking(): Promise<void> {
  if (isNativeApp()) {
    try {
      await TextToSpeech.stop();
    } catch { /* ignore */ }
    return;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/** True when some TTS mechanism exists on this install. */
export function hasVoiceSupport(): boolean {
  if (isNativeApp()) return true;
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}