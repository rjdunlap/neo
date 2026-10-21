/**
 * Which of the device's voices speaks the island's lines. Kept apart from
 * `voice.ts` so the choice can be tested without `speechSynthesis`.
 *
 * A downloaded Premium or Enhanced voice (iPad: Settings → Accessibility →
 * Spoken Content → Voices) beats everything else; a voice on the device beats
 * an online one, since the app has to speak offline. Apple marks quality in the
 * name ("Ava (Premium)") or only in the voice URI
 * ("com.apple.voice.enhanced.en-US.Samantha"), so both are read.
 */

/** The fields of a `SpeechSynthesisVoice` the choice reads. */
export interface VoiceInfo {
  name: string;
  voiceURI: string;
  lang: string;
  localService: boolean;
}

export type VoiceQuality = 'premium' | 'enhanced' | 'standard';

/** Novelty voices: never the pet's voice. */
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|hysterical|deranged|pipe organ)\b/i;
/** Eloquence and old MacinTalk voices: robotic, used only when nothing else is there. */
const ROBOTIC = /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|fred|junior|ralph|kathy|victoria|bruce|agnes|vicki)\b/i;
const FRIENDLY = /^(samantha|ava|allison|susan|zoe|karen|tessa|serena|evan|nathan|joelle|noelle)\b/i;

export function voiceQuality(v: VoiceInfo): VoiceQuality {
  const text = `${v.name} ${v.voiceURI}`;
  if (/premium/i.test(text)) return 'premium';
  if (/enhanced/i.test(text)) return 'enhanced';
  return 'standard';
}

export function voiceScore(v: VoiceInfo): number {
  const quality = voiceQuality(v);
  return (
    (quality === 'premium' ? 30 : quality === 'enhanced' ? 20 : 0) +
    (v.localService ? 5 : 0) +
    (/neural|natural/i.test(v.name) ? 4 : 0) +
    (FRIENDLY.test(v.name) ? 2 : 0) +
    (/^en[-_]US$/i.test(v.lang) ? 1 : 0) -
    (ROBOTIC.test(v.name) ? 40 : 0)
  );
}

/** The best English voice, or null to leave it to the device's default. */
export function chooseVoice<V extends VoiceInfo>(voices: readonly V[]): V | null {
  const english = voices.filter((v) => /^en([-_]|$)/i.test(v.lang) && !NOVELTY.test(v.name));
  return [...english].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
}

/** The voice's name without Apple's quality suffix, for the grown-ups' page. */
export function voiceLabel(v: VoiceInfo): string {
  return v.name.replace(/\s*\((premium|enhanced)\)/gi, '').trim() || v.name;
}
