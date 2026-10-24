import type { Rng } from '../../engine/random';
import { nameLetters } from '../letter-trails/logic';

/**
 * Pond Typing's rules: a round is a row of bubbles, each holding what to type (a letter, a name's letter, a word or a
 * two-word phrase). Nothing drifts and nothing times out: the bubble waits for the right key. Levels 1–3 are built; the
 * capital, the line and mending (4–6) are the next part of the definition (docs/definitions/pond-typing.md).
 */
export const MAX_LEVEL = 3;

/** Level 1's letters: a round uses one group of four consecutive letters of the alphabet. */
export const GROUPS = ['ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'WXYZ'] as const;
/** Level 3's words and phrases (the definition's reviewed pools). */
export const WORDS = ['hat', 'cat', 'dog', 'pig', 'hen', 'cow', 'bee', 'net', 'sun', 'mud', 'log', 'fox', 'pip', 'bug', 'nest', 'frog', 'duck', 'pond', 'leaf', 'moon', 'rain', 'cake', 'boat', 'tree'] as const;
export const PHRASES = ['red hat', 'big dog', 'wet duck', 'hot sun', 'green frog', 'soft mud', 'tall tree', 'little bee'] as const;
/** The longest name typed at level 2: a long name is typed in part, so a round stays a handful of bubbles. */
export const NAME_LETTERS = 12;

export const typingLevel = (level: number) => Math.max(1, Math.min(MAX_LEVEL, Math.floor(level) || 1));

/** The name typed at level 2: the player's own (accents dropped, A–Z only), else Pip. "friend" is the couch's stand-in, not a name. */
export function nameToType(name: string): string {
  const letters = name.trim().toLowerCase() === 'friend' ? 'PIP' : nameLetters(name);
  return letters.slice(0, NAME_LETTERS);
}

/** The bubbles of one round, in order. Each string is typed character by character; ' ' is the space bar. */
export function roundBubbles(level: number, rng: Rng, name: string): string[] {
  const l = typingLevel(level);
  if (l === 1) {
    const group = rng.pick([...GROUPS]);
    // Each letter twice, never the same letter twice in a row, so every press is a fresh look for a key.
    for (;;) {
      const letters = rng.shuffle([...group, ...group].map((c) => c.toLowerCase()));
      if (letters.every((c, i) => i === 0 || c !== letters[i - 1])) return letters;
    }
  }
  if (l === 2) return nameToType(name).toLowerCase().split('');
  const words = rng.shuffle([...WORDS]).slice(0, 3);
  const phrases = rng.shuffle([...PHRASES]).slice(0, 2);
  return [...words, ...phrases];
}

/** A key from the typed-letter channel, compared as levels 1–3 do: either case. */
export const sameKey = (pressed: string, wanted: string) => pressed.toLowerCase() === wanted.toLowerCase();

export type PressResult =
  | { kind: 'right'; bubbleDone: boolean; roundDone: boolean }
  /** `space`: the space bar where a letter belongs; `wantSpace`: a letter where the space belongs. */
  | { kind: 'wrong'; pressed: string; wanted: string; why: 'letter' | 'space' | 'wantSpace'; counted: boolean; glow: boolean }
  | { kind: 'ignored' };

/**
 * One round's typing. Every character is a target of its own: the first wrong key on it is free, each later one counts a
 * miss, and the second wrong key on it glows its key (one hint, counted once a round, shared with the pause menu's hint).
 */
export class Typist {
  bubble = 0;
  /** The next character to type in the bubble. */
  at = 0;
  misses = 0;
  hints = 0;
  /** Wrong keys on the character in play. */
  wrongHere = 0;
  /** The key in play is glowing (a hint is showing). */
  glowing = false;
  /** Presses that were the wanted key on the first try, for the couch's calm number. */
  firstTry = 0;
  /** Every character key pressed at a target: a course's tries. */
  presses = 0;
  constructor(readonly bubbles: readonly string[]) {}

  get done() { return this.bubble >= this.bubbles.length; }
  get text() { return this.bubbles[this.bubble] ?? ''; }
  /** The character to press now, or '' when the round is over. */
  get wanted() { return this.text[this.at] ?? ''; }

  press(key: string): PressResult {
    if (this.done || key.length !== 1) return { kind: 'ignored' };
    this.presses += 1;
    const wanted = this.wanted;
    if (sameKey(key, wanted)) {
      if (this.wrongHere === 0) this.firstTry += 1;
      this.at += 1; this.wrongHere = 0; this.glowing = false;
      const bubbleDone = this.at >= this.text.length;
      if (bubbleDone) { this.bubble += 1; this.at = 0; }
      return { kind: 'right', bubbleDone, roundDone: this.done };
    }
    this.wrongHere += 1;
    const counted = this.wrongHere > 1;
    if (counted) this.misses += 1;
    const glow = this.wrongHere === 2 && !this.glowing;
    if (glow) this.showHint();
    const why = key === ' ' ? 'space' : wanted === ' ' ? 'wantSpace' : 'letter';
    return { kind: 'wrong', pressed: key, wanted, why, counted, glow };
  }

  /** Glow the key in play. The round's hint is counted once, however often it glows. */
  showHint() {
    if (this.done) return;
    this.glowing = true;
    this.hints = 1;
  }
}

/** How a key is said: "space" for the space bar, the capital letter otherwise. */
export const keyName = (key: string) => key === ' ' ? 'space' : key.toUpperCase();

export function describeTypingLevel(level: number): string {
  return ['', 'Finds a letter key: one group of four letters', 'Types a name, letter by letter', 'Types words, and the space bar between two words'][typingLevel(level)];
}
