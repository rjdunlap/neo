import manifest from '../content/voice-clips.json';

/**
 * Rendered clips for exact script texts, made by `scripts/voice-clips/render.mjs` (Kokoro, run locally)
 * and precached offline. A line with no clip, a changed line, or a slotted one speaks with device speech.
 */
const urls = import.meta.glob<string>('./clips/*.m4a', { eager: true, query: '?url', import: 'default' });
const byKey = new Map(Object.entries(urls).map(([path, url]) => [path.slice('./clips/'.length, -'.m4a'.length), url]));
const clips: Record<string, string> = manifest.clips;

/** The clip's URL for this exact text, or null for device speech. */
export function clipUrl(text: string): string | null {
  const key = Object.hasOwn(clips, text) ? clips[text] : undefined;
  return (key && byKey.get(key)) || null;
}
