import type { Rng } from '../../engine/random';
import { nameLetters } from '../letter-trails/logic';

/**
 * Pond Typing's rules: a round is a row of bubbles, each holding what to type (a letter, a name's letter, a word or a
 * two-word phrase). Nothing drifts and nothing times out: the bubble waits for the right key. Levels 4–6 add a capital, a copied line and a line to mend.
 */
export const MAX_LEVEL = 6;

/** Level 1's letters: a round uses one group of four consecutive letters of the alphabet. */
export const GROUPS = ['ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'WXYZ'] as const;
/** Level 3's words and phrases (the definition's reviewed pools). */
export const WORDS = ['hat', 'cat', 'dog', 'pig', 'hen', 'cow', 'bee', 'net', 'sun', 'mud', 'log', 'fox', 'pip', 'bug', 'nest', 'frog', 'duck', 'pond', 'leaf', 'moon', 'rain', 'cake', 'boat', 'tree'] as const;
export const PHRASES = ['red hat', 'big dog', 'wet duck', 'hot sun', 'green frog', 'soft mud', 'tall tree', 'little bee'] as const;
export const LINES = ['Pip has a hat.', 'The duck is wet.', 'A frog sat on a log.', 'We ate a big cake.', 'The sun is hot.', 'A bee is in the tree.', 'Mud is soft.', 'The moon is up.'] as const;

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
  if (l >= 5) return rng.shuffle([...LINES]).slice(0, 5);
  if (l === 4) {
    const own = nameToType(name).toLowerCase();
    return [own, ...rng.shuffle(WORDS.filter(w => w !== own)).slice(0, 4)].map(w => w[0].toUpperCase() + w.slice(1));
  }
  const words = rng.shuffle([...WORDS]).slice(0, 3);
  const phrases = rng.shuffle([...PHRASES]).slice(0, 2);
  return [...words, ...phrases];
}

/** A key from the typed-letter channel, compared as levels 1–3 do: either case. */
export const sameKey = (pressed: string, wanted: string) => pressed.toLowerCase() === wanted.toLowerCase();

export type PressResult =
  | { kind: 'right'; bubbleDone: boolean; roundDone: boolean }
  /** `space`: the space bar where a letter belongs; `wantSpace`: a letter where the space belongs. */
  | { kind: 'wrong'; pressed: string; wanted: string; why: 'letter' | 'space' | 'wantSpace' | 'capital' | 'stop'; counted: boolean; glow: boolean }
  | { kind: 'edit' }
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
  shift = false;
  constructor(readonly bubbles: readonly string[], readonly level = 1) {}

  get done() { return this.bubble >= this.bubbles.length; }
  get text() { return this.bubbles[this.bubble] ?? ''; }
  /** The character to press now, or '' when the round is over. */
  get wanted() { return this.text[this.at] ?? ''; }

  press(key: string): PressResult {
    if (this.done) return { kind: 'ignored' };
    if (key === 'Shift' && this.level >= 4) { this.shift = true; return { kind: 'edit' }; }
    if (key.length !== 1) return { kind: 'ignored' };
    if (this.shift && /[a-z]/i.test(key)) { key = key.toUpperCase(); this.shift = false; }
    this.presses += 1;
    const wanted = this.wanted;
    if (this.level >= 4 ? key === wanted : sameKey(key, wanted)) {
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
    const why = key === ' ' ? 'space' : wanted === ' ' ? 'wantSpace' : /[A-Z]/.test(wanted) && sameKey(key, wanted) ? 'capital' : wanted === '.' ? 'stop' : 'letter';
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
export const keyName = (key: string) => key === ' ' ? 'space' : key === '.' ? 'full stop' : key.toUpperCase();

export function describeTypingLevel(level: number): string {
  return ['', 'Finds a letter key: one group of four letters', 'Types a name, letter by letter', 'Types words, and the space bar between two words', 'Uses Shift for a capital at the start of a word or name', 'Copies a line with a capital, spaces and a full stop; uses Backspace', 'Mends a line with the arrow keys and Backspace'][typingLevel(level)];
}

/** Swap exactly one internal letter; no spaces, first capital or stop are changed. */
export function muddle(text: string, rng: Rng): string {
  const positions = [...text].flatMap((ch, i) => i > 0 && /[a-z]/.test(ch) ? [i] : []);
  const at = rng.pick(positions);
  return text.slice(0, at) + (text[at] === 'q' ? 'x' : 'q') + text.slice(at + 1);
}

/** A small in-memory editor. The shown model always stays visible: this tests copying, never spelling. */
export class LineTypist extends Typist {
  buffer = '';
  caret = 0;
  private wrongRemovals = 0;
  private credited = new Set<number>();
  constructor(bubbles: readonly string[], level: number, readonly starts: readonly string[]) {
    super(bubbles, level);
    this.resetLine();
  }
  resetLine() {
    this.buffer = this.starts[this.bubble] ?? '';
    this.caret = this.buffer.length;
    this.at = this.caret;
    this.shift = false;
    if (this.level === 6) [...this.buffer].forEach((ch, i) => { if (ch === this.text[i]) this.credited.add(i); });
    // A restart does not erase accounting or first-try history.
  }
  get mismatch() {
    let i = 0;
    while (i < this.text.length && this.text[i] === this.buffer[i]) i++;
    return i;
  }
  /** A deterministic repair that also recovers from extra removals/insertions. */
  get nextAction(): string {
    const i = this.mismatch;
    const remove = this.buffer.length >= this.text.length && i < this.buffer.length;
    const destination = i + (remove ? 1 : 0);
    if (this.caret > destination) return 'ArrowLeft';
    if (this.caret < destination) return 'ArrowRight';
    return remove ? 'Backspace' : this.text[i] ?? 'Backspace';
  }
  override get wanted() { return this.text[this.caret] ?? ''; }
  override press(key: string): PressResult {
    if (this.done) return { kind: 'ignored' };
    if (key === 'Shift') { this.shift = true; return { kind: 'edit' }; }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      this.caret = Math.max(0, Math.min(this.buffer.length, this.caret + (key === 'ArrowLeft' ? -1 : 1)));
      this.at = this.caret;
      return { kind: 'edit' };
    }
    if (key === 'Backspace') {
      if (this.caret > 0) {
        const i = this.caret - 1;
        if (this.buffer[i] === this.text[i]) {
          this.wrongRemovals++;
          if (this.wrongRemovals === 2) this.showHint();
        }
        this.buffer = this.buffer.slice(0, i) + this.buffer.slice(this.caret);
        this.caret = i; this.at = i;
      }
      return this.buffer === this.text ? this.completeLine() : { kind: 'edit' };
    }
    if (key.length !== 1 || this.buffer.length >= this.text.length + 4) return { kind: 'ignored' };
    if (this.shift && /[a-z]/i.test(key)) { key = key.toUpperCase(); this.shift = false; }
    const at = this.caret;
    const wanted = this.wanted;
    this.presses++;
    this.buffer = this.buffer.slice(0, at) + key + this.buffer.slice(at);
    this.caret++; this.at = this.caret;
    if (key !== wanted) {
      this.wrongHere++;
      const counted = this.wrongHere > 1;
      if (counted) this.misses++;
      const glow = this.wrongHere === 2 && !this.glowing;
      if (glow) this.showHint();
      return { kind: 'wrong', pressed: key, wanted, counted, glow,
        why: key === ' ' ? 'space' : wanted === ' ' ? 'wantSpace' : sameKey(key, wanted) ? 'capital' : wanted === '.' ? 'stop' : 'letter' };
    }
    if (!this.credited.has(at) && this.wrongHere === 0) this.firstTry++;
    this.credited.add(at);
    this.wrongHere = 0; this.glowing = false;
    const bubbleDone = this.buffer === this.text;
    return bubbleDone ? this.completeLine() : { kind: 'right', bubbleDone: false, roundDone: false };
  }
  private completeLine(): PressResult {
    this.bubble++; this.credited.clear(); this.wrongRemovals = 0;
    this.resetLine();
    return { kind: 'right', bubbleDone: true, roundDone: this.done };
  }
}

/** Logical bounds used by rendering and fit tests; the bottom-left guide and top HUD stay clear. */
export function typingLayout(w: number, h: number) {
  const portrait = h > w;
  return {
    bubble: { x: w / 2 - 150, y: (portrait ? h * 0.25 : 245) - 150, w: 300, h: 300 },
    picture: { x: w - 220, y: portrait ? h * 0.45 - 80 : 180, w: 180, h: 160 },
    line: { x: 190, y: portrait ? h * 0.59 : 435, w: w - 230, h: 148 },
    coach: { x: w / 2 - 220, y: portrait ? h * 0.82 : h - 160, w: 440, h: 120 },
  };
}
