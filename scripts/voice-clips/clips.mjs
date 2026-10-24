// Shared by the renderer and the clip test: the pinned voice, which lines get a clip, and each clip's name.
import { createHash } from 'node:crypto';

/** Pinned so lines added later sound like the ones already rendered. Changing any of these renames every clip. */
export const SETTINGS = {
  engine: 'kokoro-js 1.2.1',
  model: 'onnx-community/Kokoro-82M-v1.0-ONNX',
  dtype: 'q8',
  voice: 'af_heart',
  speed: 0.95,
  encode: 'afconvert aac 32000 mono',
};

/**
 * Line ids with clips, by the part before the first dot: the island's shell (titles, praise, the
 * home spot, lands and places, the hatch, stickers) and two whole lap games, Bubble Pop and Duck Pond.
 * The rest stays on device speech until the iPad listen passes (docs/ROADMAP.md#a-better-voice).
 */
export const PREFIXES = [
  'game', 'praise', 'sticker', 'again', 'hub', 'nav', 'home', 'island', 'land', 'place', 'explore', 'parent',
  'hatch', 'stickers', 'friends', 'keep', 'play', 'bubble', 'duck',
];

/** Variants with a `{slot}` stay on device speech: a rendered fragment mid-sentence sounds jarring. */
export const hasSlot = (text) => /\{\w+\}/.test(text);

/** The slot-free variants of the chosen lines, de-duplicated, in script order. */
export function chosenTexts(script) {
  const out = new Set();
  for (const [id, variants] of Object.entries(script)) {
    if (!PREFIXES.includes(id.split('.')[0])) continue;
    for (const text of variants) if (!hasSlot(text)) out.add(text);
  }
  return [...out];
}

/** A clip's file name (without `.m4a`): the exact text under the pinned settings. */
export const clipKey = (text) => createHash('sha256').update(`${JSON.stringify(SETTINGS)}\n${text}`).digest('hex').slice(0, 16);
