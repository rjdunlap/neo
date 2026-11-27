import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Two Tablets' rules (docs/definitions/two-tablets.md#the-model-logicts): eight island signs carry eight sounds, one sign each.
 * A crib (picture-words with their signs) fixes some signs; she reads a new line by finding the picture-word each group of signs
 * spells. Pure: no Pixi. The true key is never saved.
 */
export const SIGNS = 8;
/** The eight sounds, in the order the true key gives them to signs `0..7`. */
export const SOUNDS = ['lad', 'der', 'ta', 'ble', 'ba', 'by', 'ri', 'ver'] as const;
export type WordId = 'ladder' | 'table' | 'baby' | 'rider' | 'river';
/** A picture-word: its spoken name and the sounds it is made of, in order. */
export const WORDS: Record<WordId, readonly number[]> = {
  ladder: [0, 1],
  table: [2, 3],
  baby: [4, 5],
  rider: [6, 1],
  river: [6, 7],
};
export const WORD_IDS = Object.keys(WORDS) as WordId[];

export interface CribEntry {
  word: WordId;
  /** One sign per sound of the word, in order. */
  signs: number[];
}
export interface Group {
  signs: number[];
  /** The three picture-words offered, in the order they are shown. */
  candidates: WordId[];
  /** The one the true key reads. */
  answer: WordId;
}
export interface CaseDef {
  crib: CribEntry[];
  groups: Group[];
}

/** The true key: sign i carries sound i. */
export const TRUE_KEY: readonly number[] = SOUNDS.map((_, i) => i);

const entry = (word: WordId): CribEntry => ({ word, signs: [...WORDS[word]] });

/** Level 1, *Find the missing sound*: seven signs known, one unknown, one group. */
const LEVEL_1: CaseDef = {
  crib: [entry('ladder'), entry('table'), entry('baby'), entry('rider')],
  groups: [{ signs: [6, 7], candidates: ['river', 'rider', 'baby'], answer: 'river' }],
};
/** Level 2, *Two unknown signs*: six known, two unknown, two groups; the first reading fixes a sign the second needs. */
const LEVEL_2: CaseDef = {
  crib: [entry('ladder'), entry('table'), entry('baby')],
  groups: [
    { signs: [6, 1], candidates: ['rider', 'ladder', 'river'], answer: 'rider' },
    { signs: [6, 7], candidates: ['river', 'rider', 'baby'], answer: 'river' },
  ],
};
export const CASES: Record<number, CaseDef> = { 1: LEVEL_1, 2: LEVEL_2 };

export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };

export function describeLevel(level: number): string {
  return level <= 1
    ? 'Find the missing sound: match signs to sounds from the first tablet and read one group'
    : 'Two unknown signs: read one group to learn a sign, then use it on the next';
}

export function caseFor(level: number): CaseDef {
  return CASES[Math.max(1, Math.min(2, Math.round(level)))];
}

/** A seeded round: which clay shape each sign wears, and the order of each group's candidates. */
export interface TabletsRound {
  level: number;
  def: CaseDef;
  /** `shapes[sign]` is the shape index (0..7) that sign is drawn with. */
  shapes: number[];
}

export function makeRound(level: number, rng: Rng): TabletsRound {
  const base = caseFor(level);
  const shapes = rng.shuffle(Array.from({ length: SIGNS }, (_, i) => i));
  const groups = base.groups.map((g) => ({ ...g, candidates: rng.shuffle([...g.candidates]) }));
  return { level: Math.max(1, Math.min(2, Math.round(level))), def: { crib: base.crib, groups }, shapes };
}

/** The sound each sign is fixed to by the crib (and any extra pairs), as `sign -> sound`. */
export function cribMap(def: CaseDef, extra: ReadonlyMap<number, number> = new Map()): Map<number, number> {
  const m = new Map<number, number>(extra);
  for (const e of def.crib) e.signs.forEach((s, i) => m.set(s, WORDS[e.word][i]));
  return m;
}

/** Every bijection (sign -> sound) that agrees with the crib, found by backtracking over the unknown signs. */
export function keys(def: CaseDef): number[][] {
  const fixed = cribMap(def);
  const used = new Set(fixed.values());
  const unknown = Array.from({ length: SIGNS }, (_, s) => s).filter((s) => !fixed.has(s));
  const free = SOUNDS.map((_, i) => i).filter((i) => !used.has(i));
  const out: number[][] = [];
  const key = Array.from({ length: SIGNS }, (_, s) => fixed.get(s) ?? -1);
  const rec = (at: number, left: number[]) => {
    if (at === unknown.length) {
      out.push([...key]);
      return;
    }
    left.forEach((snd, i) => {
      key[unknown[at]] = snd;
      rec(
        at + 1,
        left.filter((_, j) => j !== i),
      );
    });
    key[unknown[at]] = -1;
  };
  rec(0, free);
  return out;
}

/** Whether a picture-word can be what a group of signs reads, in some key that agrees with the crib. */
export function consistent(def: CaseDef, group: Group, word: WordId): boolean {
  const w = WORDS[word];
  if (w.length !== group.signs.length) return false;
  return keys(def).some((k) => group.signs.every((s, i) => k[s] === w[i]));
}

/** The candidates of a group that can be read. */
export function readings(def: CaseDef, group: Group): WordId[] {
  return group.candidates.filter((c) => consistent(def, group, c));
}

/** Which groups a commit reads rightly; `picks[g]` is a candidate index or -1. Only groups with a pick are judged. */
export function judge(def: CaseDef, picks: readonly number[]): (boolean | null)[] {
  return def.groups.map((g, i) => (picks[i] < 0 ? null : g.candidates[picks[i]] === g.answer));
}

/** The signs a right reading makes known: those in the crib plus those in groups already read. */
export function knownSigns(def: CaseDef, right: ReadonlySet<number>): Set<number> {
  const k = new Set(cribMap(def).keys());
  right.forEach((g) => def.groups[g].signs.forEach((s) => k.add(s)));
  return k;
}

export type ReadingHint =
  /** Dim one candidate that cannot be read. */
  | { kind: 'dim'; group: number; candidate: number }
  /** Glow the crib position that fixes a sign of the group, and the candidate it points to. */
  | { kind: 'crib'; group: number; candidate: number; entry: number; pos: number }
  /** Nothing in the crib helps this group yet: look at another group first. */
  | { kind: 'other'; group: number; first: number };

/**
 * The next help for a group, from how many hints it has already had. Step 0 dims an unreadable candidate (never the right one),
 * later steps glow the crib sign that gives the answer away. A group none of whose signs are known yet points to the group
 * that makes one known.
 */
export function readingHint(
  def: CaseDef,
  group: number,
  step: number,
  right: ReadonlySet<number>,
  dimmed: ReadonlySet<number> = new Set(),
): ReadingHint {
  const g = def.groups[group];
  const answer = g.candidates.indexOf(g.answer);
  const bad = g.candidates.map((_, i) => i).filter((i) => i !== answer && !dimmed.has(i));
  if (step <= 0 && bad.length) return { kind: 'dim', group, candidate: bad[0] };
  const known = knownSigns(def, right);
  const at = g.signs.findIndex((s) => known.has(s));
  if (at < 0) {
    const first = def.groups.findIndex(
      (o, i) => i !== group && !right.has(i) && o.signs.some((s) => known.has(s)),
    );
    if (first >= 0) return { kind: 'other', group, first };
    return bad.length
      ? { kind: 'dim', group, candidate: bad[0] }
      : { kind: 'crib', group, candidate: answer, entry: -1, pos: at };
  }
  const sign = g.signs[at];
  const entryAt = def.crib.findIndex((e) => e.signs.includes(sign));
  return {
    kind: 'crib',
    group,
    candidate: answer,
    entry: entryAt,
    pos: entryAt < 0 ? at : def.crib[entryAt].signs.indexOf(sign),
  };
}

/** The next group worth a hint: the first one not yet read. */
export function hintGroup(def: CaseDef, right: ReadonlySet<number>): number {
  const g = def.groups.findIndex((_, i) => !right.has(i));
  return g < 0 ? 0 : g;
}
