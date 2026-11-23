import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Jar Clues (docs/definitions/jar-clues.md): a jar of pebbles nobody has counted, a board of the numbers 1 to 60 and a
 * short list of exact clues about the count. Each clue is applied to the whole board by crossing off what it rules out;
 * the clues stop two or three numbers short, well apart, and the last choice between them is made by eye.
 *
 * Everything here is round state built from the seeded rng: nothing is saved.
 */

export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };

/** The board's numbers, 1 to 60, in six rows of ten (1–10, 11–20 …); a column is a last digit. */
export const TOP = 60;
export const NUMBERS: readonly number[] = Array.from({ length: TOP }, (_, i) => i + 1);
export const ROWS = 6;
export const rowOf = (n: number) => Math.floor((n - 1) / 10);
export const colOf = (n: number) => (n - 1) % 10;

/** A one-digit number has tens digit 0, so 7 is "0 and 7". */
export const tens = (n: number) => Math.floor(n / 10);
export const ones = (n: number) => n % 10;
export const digitSum = (n: number) => tens(n) + ones(n);
/** "Its digits are 0 and 7": said whenever an explanation leans on the one-digit convention. */
const digits = (n: number) => `its digits are ${tens(n)} and ${ones(n)}`;

// ---- clues ----

export type Kind = 'range' | 'parity' | 'by' | 'ends' | 'sum' | 'order';

export interface Clue {
  /** Stable id; its spoken line is `jarclues.clue.<id>`. */
  id: string;
  kind: Kind;
  /** "More than" and "Fewer than" are each allowed once on a board. */
  side?: 'more' | 'fewer';
  /** The clue as printed and spoken. */
  words: string;
  test(n: number): boolean;
  /** Why `n` fits it, as a clause ("it is fewer than 40", "it is even", "its digits add to 7"). */
  fits(n: number): string;
  /** Why `n` does not fit it, as a sentence about `n` ("23 is odd"). */
  fails(n: number): string;
  /** Why several numbers do not fit it, given them as a list ("21 to 29 are odd"). */
  failsAll(list: string): string;
}

const FIVES = ['fives', 'tens'] as const;

function makeClues(): Clue[] {
  const out: Clue[] = [];
  for (let a = 5; a <= 55; a += 5) {
    out.push({
      id: `more-${a}`,
      kind: 'range',
      side: 'more',
      words: `More than ${a}`,
      test: (n) => n > a,
      fits: () => `it is more than ${a}`,
      fails: (n) => (n === a ? `${n} is ${a} itself, not more` : `${n} is less than ${a}`),
      failsAll: (list) => `${list} are not more than ${a}`,
    });
    out.push({
      id: `fewer-${a}`,
      kind: 'range',
      side: 'fewer',
      words: `Fewer than ${a}`,
      test: (n) => n < a,
      fits: () => `it is fewer than ${a}`,
      fails: (n) => (n === a ? `${n} is ${a} itself, not fewer` : `${n} is more than ${a}`),
      failsAll: (list) => `${list} are not fewer than ${a}`,
    });
  }
  out.push({
    id: 'odd',
    kind: 'parity',
    words: 'An odd number',
    test: (n) => n % 2 === 1,
    fits: () => 'it is odd',
    fails: (n) => `${n} is even`,
    failsAll: (list) => `${list} are even`,
  });
  out.push({
    id: 'even',
    kind: 'parity',
    words: 'An even number',
    test: (n) => n % 2 === 0,
    fits: () => 'it is even',
    fails: (n) => `${n} is odd`,
    failsAll: (list) => `${list} are odd`,
  });
  for (const [i, m] of [5, 10].entries())
    out.push({
      id: `by-${m}`,
      kind: 'by',
      words: `You say it counting by ${FIVES[i]}`,
      test: (n) => n % m === 0,
      fits: () => `you say it counting by ${FIVES[i]}`,
      fails: (n) => `you do not say ${n} counting by ${FIVES[i]}`,
      failsAll: (list) => `you do not say ${list} counting by ${FIVES[i]}`,
    });
  for (let d = 0; d <= 9; d++)
    out.push({
      id: `ends-${d}`,
      kind: 'ends',
      words: `It ends in ${d}`,
      test: (n) => ones(n) === d,
      fits: () => `it ends in ${d}`,
      fails: (n) => `${n} ends in ${ones(n)}`,
      failsAll: (list) => `${list} do not end in ${d}`,
    });
  for (let s = 3; s <= 12; s++)
    out.push({
      id: `sum-${s}`,
      kind: 'sum',
      words: `The digits add to ${s}`,
      test: (n) => digitSum(n) === s,
      fits: (n) => (n < 10 ? `${digits(n)}, which add to ${s}` : `its digits add to ${s}`),
      fails: (n) => `${n}'s digits are ${tens(n)} and ${ones(n)}, which add to ${digitSum(n)}`,
      failsAll: (list) => `the digits of ${list} do not add to ${s}`,
    });
  out.push({
    id: 'ones-bigger',
    kind: 'order',
    words: 'The ones digit is bigger than the tens digit',
    test: (n) => ones(n) > tens(n),
    fits: (n) => (n < 10 ? `${digits(n)}, so the ones digit is bigger` : 'its ones digit is the bigger one'),
    fails: (n) => `${n}'s digits are ${tens(n)} and ${ones(n)}, so the ones digit is not the bigger one`,
    failsAll: (list) => `in ${list} the ones digit is not the bigger one`,
  });
  out.push({
    id: 'tens-bigger',
    kind: 'order',
    words: 'The tens digit is bigger than the ones digit',
    test: (n) => tens(n) > ones(n),
    fits: () => 'its tens digit is the bigger one',
    fails: (n) => `${n}'s digits are ${tens(n)} and ${ones(n)}, so the tens digit is not the bigger one`,
    failsAll: (list) => `in ${list} the tens digit is not the bigger one`,
  });
  return out;
}

export const CLUES: readonly Clue[] = makeClues();
const BY_ID = new Map(CLUES.map((c) => [c.id, c]));
export const clueById = (id: string): Clue => {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`no clue ${id}`);
  return c;
};
export const clueLine = (c: Clue) => `jarclues.clue.${c.id}`;

// ---- levels ----

export interface Plan {
  level: number;
  name: string;
  /** Clues on a board. */
  clues: number;
  kinds: readonly Kind[];
  /** The fewest standing numbers each clue crosses off when it arrives. */
  cut: number;
  /** The least distance between any two of the last numbers standing. */
  gap: number;
  /** The board must have at least one clue of these kinds. */
  needs: readonly Kind[];
  /** A ten line on the jar's glass. */
  tenLine: boolean;
}

/** Levels 1–2 are built (batch `jar-clues 1`); 3–4 add multiples, primes, the plain jar and one-of-two clues (batch 2). */
export const PLANS: readonly Plan[] = [
  {
    level: 1,
    name: 'First clues',
    clues: 3,
    kinds: ['range', 'parity', 'by', 'ends'],
    cut: 4,
    gap: 10,
    needs: [],
    tenLine: true,
  },
  {
    level: 2,
    name: 'Digit clues',
    clues: 4,
    kinds: ['range', 'parity', 'by', 'ends', 'sum', 'order'],
    cut: 3,
    gap: 9,
    needs: ['sum', 'order'],
    tenLine: true,
  },
];
export const planFor = (level: number): Plan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

const DESCRIBE = [
  'First clues: three clues about ranges, odd and even, counting by fives and last digits, then choose by the jar',
  'Digit clues: four clues, at least one about what the digits add to or which digit is bigger',
];
export const describeLevel = (level: number) => DESCRIBE[planFor(level).level - 1];

// ---- the board ----

export interface Board {
  level: number;
  count: number;
  clues: readonly Clue[];
}

/** The numbers every one of `clues` allows. */
export const allowedBy = (clues: readonly Clue[]): number[] =>
  NUMBERS.filter((n) => clues.every((c) => c.test(n)));

/** The numbers left standing once every clue on the board is applied. */
export const lastStanding = (b: Board) => allowedBy(b.clues);

const smallestGap = (ns: readonly number[]) =>
  ns.slice(1).reduce((m, n, i) => Math.min(m, n - ns[i]), Infinity);

/** Whether `c` may join `chosen` on a board: never twice, and at most one "More than" and one "Fewer than". */
const allowedBeside = (c: Clue, chosen: readonly Clue[]) =>
  chosen.every((d) => d.id !== c.id && (!c.side || d.side !== c.side));

/** Every condition of a valid board at its level (the definition's list). */
export function valid(b: Board): boolean {
  const plan = planFor(b.level);
  if (b.count < 6 || b.count > TOP || b.clues.length !== plan.clues) return false;
  if (!b.clues.every((c) => plan.kinds.includes(c.kind) && c.test(b.count))) return false;
  if (!b.clues.every((c, i) => allowedBeside(c, b.clues.slice(0, i)))) return false;
  if (plan.needs.length && !b.clues.some((c) => plan.needs.includes(c.kind))) return false;
  let standing = NUMBERS.slice();
  for (const [i, c] of b.clues.entries()) {
    const next = standing.filter((n) => c.test(n));
    if (standing.length - next.length < plan.cut) return false;
    const last = i === b.clues.length - 1;
    if (last ? next.length < 2 || next.length > 3 : next.length <= 3) return false;
    standing = next;
  }
  return standing.includes(b.count) && smallestGap(standing) >= plan.gap;
}

/** One draw of the generator: a board, or null when a step had nothing to choose or the end fails. */
export function drawBoard(level: number, rng: Rng): Board | null {
  const plan = planFor(level);
  const count = rng.int(6, TOP);
  const pool = CLUES.filter((c) => plan.kinds.includes(c.kind) && c.test(count));
  const chosen: Clue[] = [];
  let standing = NUMBERS.slice();
  for (let i = 0; i < plan.clues; i++) {
    const last = i === plan.clues - 1;
    const options = pool.filter((c) => {
      if (!allowedBeside(c, chosen)) return false;
      const left = standing.filter((n) => c.test(n)).length;
      if (standing.length - left < plan.cut) return false;
      return last ? left >= 2 && left <= 3 : left > 3;
    });
    if (!options.length) return null;
    const c = rng.pick(options);
    chosen.push(c);
    standing = standing.filter((n) => c.test(n));
  }
  const b: Board = { level: plan.level, count, clues: chosen };
  return valid(b) ? b : null;
}

/** Draws until a board is valid. `draws` reports how many it took. */
export function makeBoard(level: number, rng: Rng): Board & { draws: number } {
  for (let draws = 1; ; draws++) {
    const b = drawBoard(level, rng);
    if (b) return { ...b, draws };
  }
}

// ---- the player's board ----

/** Which numbers are crossed off: index n − 1. */
export type Marks = readonly boolean[];
export const fresh = (): Marks => NUMBERS.map(() => false);
export const standingOf = (m: Marks) => NUMBERS.filter((n) => !m[n - 1]);
export const toggled = (m: Marks, n: number, crossed = !m[n - 1]): Marks =>
  m.map((x, i) => (i === n - 1 ? crossed : x));
export const marksKey = (m: Marks) => m.map((x) => (x ? '1' : '0')).join('');

/** The numbers whose state is wrong after `shown` clues: standing but ruled out, or crossed but allowed. */
export function wrongNumbers(b: Board, shown: number, m: Marks): number[] {
  const clues = b.clues.slice(0, shown);
  return NUMBERS.filter((n) => clues.every((c) => c.test(n)) === m[n - 1]);
}

/** The board holds when the numbers standing are exactly the numbers every shown clue allows. */
export const holds = (b: Board, shown: number, m: Marks) => wrongNumbers(b, shown, m).length === 0;

/** One miss per distinct wrong board at a check within a clue; checking the same board again is free. */
export class Misses {
  private readonly seen = new Set<string>();
  /** True when this wrong board has not been counted at this clue before. */
  count(shown: number, m: Marks): boolean {
    const key = `${shown}:${marksKey(m)}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }
}

export interface Fault {
  /** The lowest wrong number, which is lit. */
  n: number;
  kind: 'standing' | 'crossed';
  /** For a standing number, the newest shown clue that rules it out. */
  clue: Clue | null;
  /** The working, with the numbers in it: what the note shows. */
  words: string;
}

/** A list joined "a, b and c". */
export const andList = (xs: readonly string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;

/** Numbers as a list, a run of three or more as "35 to 40": "1 to 5, 8 and 9". */
export function runs(ns: readonly number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < ns.length;) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    if (j - i >= 2) parts.push(`${ns[i]} to ${ns[j]}`);
    else for (let k = i; k <= j; k++) parts.push(String(ns[k]));
    i = j + 1;
  }
  return andList(parts);
}

const lower = (s: string) => s[0].toLowerCase() + s.slice(1);

/** The newest shown clue that rules `n` out. */
const rulesOut = (b: Board, shown: number, n: number): Clue | null =>
  b.clues
    .slice(0, shown)
    .reverse()
    .find((c) => !c.test(n)) ?? null;

/** "It fits every clue so far: it is fewer than 40 and even." Never mentions the count, so it reads the same for it. */
const fitsAll = (b: Board, shown: number, n: number) => {
  const parts = b.clues.slice(0, shown).map((c) => c.fits(n));
  // "it is fewer than 40" and "it is even" become "it is fewer than 40 and even".
  const is = parts.filter((p) => p.startsWith('it is ')).map((p) => p.slice(6));
  const rest = parts.filter((p) => !p.startsWith('it is '));
  const said = [...(is.length ? [`it is ${andList(is)}`] : []), ...rest];
  return `It fits every clue so far: ${said.join('; ')}.`;
};

/** Why a board that does not hold is wrong: the lowest wrong number and a true reason. Null when it holds. */
export function fault(b: Board, shown: number, m: Marks): Fault | null {
  const n = wrongNumbers(b, shown, m)[0];
  if (n === undefined) return null;
  if (!m[n - 1]) {
    const c = rulesOut(b, shown, n)!;
    return {
      n,
      kind: 'standing',
      clue: c,
      words: `${n} is still standing. The clue says ${lower(c.words)}, and ${c.fails(n)}.`,
    };
  }
  return { n, kind: 'crossed', clue: null, words: `${n} is crossed off. ${fitsAll(b, shown, n)}` };
}

export const faultLine = (f: Fault) => `jarclues.fault.${f.kind}`;

export interface Hint {
  row: number;
  /** Every wrong number in the row, lit. */
  lit: number[];
  kind: 'cross' | 'bring' | 'mixed';
  words: string;
}

/** The lowest row holding a wrong number, every wrong number in it, and the working. Null when the board holds. */
export function hint(b: Board, shown: number, m: Marks): Hint | null {
  const wrong = wrongNumbers(b, shown, m);
  if (!wrong.length) return null;
  const row = rowOf(wrong[0]);
  const lit = wrong.filter((n) => rowOf(n) === row);
  const cross = lit.filter((n) => !m[n - 1]);
  const bring = lit.filter((n) => m[n - 1]);
  const said: string[] = [];
  // Group the numbers to cross off by the clue that rules each out, in the clues' order.
  for (const c of b.clues.slice(0, shown)) {
    const ns = cross.filter((n) => rulesOut(b, shown, n) === c);
    if (!ns.length) continue;
    const why = ns.length === 1 ? c.fails(ns[0]) : c.failsAll(runs(ns));
    said.push(`The clue says ${lower(c.words)}. In this row ${why}.`);
  }
  if (cross.length) said.push(cross.length === 1 ? 'Cross it off.' : 'Cross them off.');
  if (bring.length === 1) said.push(`${bring[0]} fits every clue so far. Bring it back.`);
  else if (bring.length) said.push(`${andList(bring.map(String))} fit every clue so far. Bring them back.`);
  return {
    row,
    lit,
    kind: cross.length && bring.length ? 'mixed' : cross.length ? 'cross' : 'bring',
    words: said.join(' '),
  };
}

export const hintLine = (h: Hint | null) =>
  h
    ? h.kind === 'bring' && h.lit.length > 1
      ? 'jarclues.hint.bring-many'
      : `jarclues.hint.${h.kind}`
    : 'jarclues.hint.holds';

/** Following a hint: the lit numbers take their right state. */
export function follow(b: Board, shown: number, m: Marks, h: Hint): Marks {
  const allowed = new Set(allowedBy(b.clues.slice(0, shown)));
  return m.map((x, i) => (h.lit.includes(i + 1) ? !allowed.has(i + 1) : x));
}

// ---- the jar ----

/** The jar's inside, in its own units: the brim line is at height `JAR.h` above the floor. */
export const JAR = { w: 150, h: 220 } as const;
export const PEBBLE_R = 9;

/** The share of the jar the pile fills: 30 pebbles half fill it. */
export const fillShare = (count: number) => Math.min(1, Math.max(0, count / TOP));
/** The height of the ten line above the jar's floor. */
export const tenLineAt = () => fillShare(10) * JAR.h;

export interface Pebble {
  x: number;
  /** Height of the centre above the jar's floor. */
  y: number;
  r: number;
  /** 0–2: one of three palette colours. */
  tone: number;
}

/**
 * A packed, overlapping pile whose top stands at the count's share of the brim, its surface uneven by no more than one
 * pebble's height. Pebbles are a picture, not a count: they overlap so they cannot be counted one by one.
 */
export function pile(count: number, rng: Rng): Pebble[] {
  const top = fillShare(count) * JAR.h;
  const out: Pebble[] = [];
  const step = PEBBLE_R * 1.25;
  const cols = Math.floor((JAR.w - 2 * PEBBLE_R) / step) + 1;
  // The surface: a gentle wave plus a jitter, kept within one pebble's height of the true top.
  const phase = rng.range(0, Math.PI * 2);
  const surface = (i: number) => top - PEBBLE_R + Math.sin(phase + i * 0.7) * PEBBLE_R * 0.45;
  for (let i = 0; i < cols; i++) {
    const x = PEBBLE_R + i * step + rng.range(-1.5, 1.5);
    const crest = surface(i);
    for (let y = PEBBLE_R * 0.8; y <= crest + 0.01; y += step) {
      const r = PEBBLE_R * rng.range(0.88, 1.06);
      out.push({ x, y: Math.min(crest, y + rng.range(-2, 2)), r, tone: rng.int(0, 2) });
    }
  }
  return out;
}

/** The pile's highest point: the top of its highest pebble. */
export const pileTop = (ps: readonly Pebble[]) => ps.reduce((m, p) => Math.max(m, p.y + p.r), 0);

// ---- the ghost finger ----

/** The guess the ghost finger plants. */
export const BOT_GUESS = 30;

/** The last numbers standing whose fill share is nearest the pile's: the card the ghost finger takes. */
export const nearestByEye = (b: Board) =>
  lastStanding(b).reduce((best, n) => (Math.abs(n - b.count) < Math.abs(best - b.count) ? n : best));

/**
 * The ghost finger's next stroke: in the lowest row with a wrong number, the longest run of neighbouring numbers from
 * the first wrong one whose right state is the state that number's stroke gives, so the sweep never passes a number it
 * would make wrong. Null when the board holds.
 */
export function sweepRun(b: Board, shown: number, m: Marks): number[] | null {
  const wrong = wrongNumbers(b, shown, m);
  if (!wrong.length) return null;
  const first = wrong[0];
  const crossed = !m[first - 1];
  const allowed = (n: number) => b.clues.slice(0, shown).every((c) => c.test(n));
  const run = [first];
  for (let n = first + 1; rowOf(n) === rowOf(first) && n <= TOP; n++) {
    if (allowed(n) === crossed) break;
    run.push(n);
  }
  // End the stroke on the last number that was wrong, so it never sweeps further than it needs to.
  while (run.length > 1 && !wrong.includes(run.at(-1)!)) run.pop();
  return run;
}
