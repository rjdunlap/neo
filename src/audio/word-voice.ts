import type { VoiceInfo } from './voice-choice';

/**
 * Which device voice may say a second-language word (WL2). Only a voice on the device (the app speaks offline) whose
 * language is exactly the one asked for: `pt-PT`, never `pt`, `pt-BR` or a "closest" variety. Android writes
 * `pt_PT`, which is the same tag. Several exact voices: the first by name, then URI, so the choice never drifts.
 */
export function exactLocalVoice<V extends VoiceInfo>(voices: readonly V[], lang: string): V | null {
  const want = lang.toLowerCase();
  const exact = voices.filter((v) => v.localService && v.lang.replace(/_/g, '-').toLowerCase() === want);
  exact.sort((a, b) => cmp(a.name, b.name) || cmp(a.voiceURI, b.voiceURI));
  return exact[0] ?? null;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
