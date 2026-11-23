import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Key It Out (docs/definitions/key-it-out.md): name a page of sketched lake creatures by working through a field guide's
 * identification key. A creature's look is one value for each of four parts; the key asks yes-or-no questions about one
 * part and one value each and ends in names. A sketch may hide a part, and then a question about that part rules nothing
 * out. Three unstamped sketches carrying their right names at once are stamped together.
 *
 * Everything here is round state built from the seeded rng: nothing is saved.
 */

export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };

export const PARTS = ['head', 'coat', 'tail', 'feet'] as const;
export type Part = (typeof PARTS)[number];
export const VALUES: Record<Part, readonly [string, string, string]> = {
  head: ['crest', 'horns', 'ears'],
  coat: ['plain', 'spotted', 'striped'],
  tail: ['fanned', 'curled', 'tufted'],
  feet: ['webbed', 'clawed', 'hoofed'],
};
/** A part's index in a look. */
export const P = (part: Part) => PARTS.indexOf(part);

/** One value (0–2) per part, in `PARTS` order. */
export type Look = readonly [number, number, number, number];
export const LOOKS: readonly Look[] = Array.from({ length: 81 }, (_, i) => [
  Math.floor(i / 27),
  Math.floor(i / 9) % 3,
  Math.floor(i / 3) % 3,
  i % 3,
]);
export const lookId = (l: Look) => l[0] * 27 + l[1] * 9 + l[2] * 3 + l[3];

/** Twelve invented names, each with a different first letter. */
export const NAMES = [
  'Dabbin',
  'Fennow',
  'Lurkin',
  'Mollin',
  'Ossip',
  'Plish',
  'Quorl',
  'Snoon',
  'Tibbet',
  'Wumble',
  'Yarrel',
  'Zennet',
] as const;

export interface Plan {
  level: number;
  name: string;
  /** Creatures in the guide, and sketches on the page. */
  guide: number;
  sketches: number;
  /** How many sketches hide one part each. */
  hidden: number;
  /** The longest path from question 1 to a name a kept board may have. */
  longest: number;
  /** Sketches that must fit more than one name from the key alone. */
  open: number;
}

/** Levels 1–2 are built (batch `key-it-out 1`); 3–4 add habits, notes and the table (batch 2). */
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'By the key', guide: 6, sketches: 6, hidden: 0, longest: 4, open: 0 },
  { level: 2, name: 'Unfinished sketches', guide: 9, sketches: 9, hidden: 4, longest: 5, open: 3 },
];
export const planFor = (level: number): Plan => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

const DESCRIBE = [
  'By the key: six sketches, every part showing; follow the key to each name',
  'Unfinished sketches: nine sketches, four with a hidden part, so the key leaves names open',
];
export const describeLevel = (level: number) => DESCRIBE[planFor(level).level - 1];

// ---- the board ----

/** Where a branch of the key goes: the question at index `q` (printed as q + 1), or the name `name`. */
export type Branch = { q: number } | { name: number };

export interface Question {
  part: number;
  value: number;
  yes: Branch;
  no: Branch;
}

export interface Creature {
  name: number;
  look: Look;
}

export interface Sketch {
  /** The name of the creature it shows: the answer. */
  name: number;
  look: Look;
  /** Part indices the sketch hides. */
  hidden: readonly number[];
}

/** One step on a name's path: question `q` answered yes or no. */
export interface Step {
  q: number;
  yes: boolean;
}

export interface Board {
  level: number;
  /** The guide's creatures, in alphabetical order. */
  guide: readonly Creature[];
  key: readonly Question[];
  sketches: readonly Sketch[];
  /** Each guide name's path from question 1, keyed by name. */
  paths: ReadonlyMap<number, readonly Step[]>;
}

export const isQ = (b: Branch): b is { q: number } => 'q' in b;

/**
 * Build a key from the top: for the creatures still together, take any question that sends at least one each way, then
 * do the same on each side. Questions are numbered as printed keys number them: a question, then everything under its
 * Yes, then everything under its No, so Yes at question k leads to question k + 1 or to a name.
 */
export function buildKey(creatures: readonly Creature[], rng: Rng): Question[] {
  const key: Question[] = [];
  const build = (group: readonly Creature[]): Branch => {
    if (group.length === 1) return { name: group[0].name };
    const options: [number, number][] = [];
    for (let p = 0; p < 4; p++)
      for (let v = 0; v < 3; v++) {
        const n = group.filter((c) => c.look[p] === v).length;
        if (n > 0 && n < group.length) options.push([p, v]);
      }
    const [part, value] = rng.pick(options);
    const at = key.length;
    key.push({ part, value, yes: { q: -1 }, no: { q: -1 } });
    const yes = build(group.filter((c) => c.look[part] === value));
    const no = build(group.filter((c) => c.look[part] !== value));
    key[at] = { part, value, yes, no };
    return { q: at };
  };
  build(creatures);
  return key;
}

/** Every name's path through the key. */
export function keyPaths(key: readonly Question[]): Map<number, Step[]> {
  const out = new Map<number, Step[]>();
  const walk = (b: Branch, path: Step[]) => {
    if (!isQ(b)) {
      out.set(b.name, path);
      return;
    }
    walk(key[b.q].yes, [...path, { q: b.q, yes: true }]);
    walk(key[b.q].no, [...path, { q: b.q, yes: false }]);
  };
  if (key.length) walk({ q: 0 }, []);
  return out;
}

/** The first step on `name`'s path the sketch contradicts: a shown part that answers the question the other way. */
export function contradiction(board: Board, sketch: number, name: number): Step | null {
  const s = board.sketches[sketch];
  for (const step of board.paths.get(name) ?? []) {
    const q = board.key[step.q];
    if (s.hidden.includes(q.part)) continue;
    if ((s.look[q.part] === q.value) !== step.yes) return step;
  }
  return null;
}

/** A name fits a sketch when nothing the sketch shows contradicts it. */
export const fits = (board: Board, sketch: number, name: number) =>
  board.paths.has(name) && !contradiction(board, sketch, name);

/** The guide's names that fit each sketch, from the key alone. */
export const fitSets = (board: Board): number[][] =>
  board.sketches.map((_, i) => board.guide.map((c) => c.name).filter((n) => fits(board, i, n)));

/** How many ways (up to `cap`) to give every sketch a fitting name, no name twice. */
export function countAnswers(board: Board, cap = 2): number {
  const sets = fitSets(board);
  const used = new Set<number>();
  let found = 0;
  const go = (i: number) => {
    if (found >= cap) return;
    if (i === sets.length) {
      found++;
      return;
    }
    for (const n of sets[i])
      if (!used.has(n)) {
        used.add(n);
        go(i + 1);
        used.delete(n);
      }
  };
  go(0);
  return found;
}

export type StepKind = 'one-name' | 'one-sketch';
export interface ChainStep {
  sketch: number;
  name: number;
  kind: StepKind;
}

/**
 * The chain: the solver, the hint order and the difficulty filter in one. Settle the lowest-numbered sketch that fits
 * exactly one unsettled name; failing that, when names and sketches are equal in number, the first name in alphabetical
 * order that fits exactly one unsettled sketch. Returns the steps taken; it solved the board when it took one per sketch.
 */
export function chain(board: Board): ChainStep[] {
  const sets = fitSets(board);
  const names = board.guide.map((c) => c.name).sort((a, b) => a - b);
  const settled = new Map<number, number>(); // sketch -> name
  const taken = new Set<number>();
  const steps: ChainStep[] = [];
  while (settled.size < board.sketches.length) {
    let step: ChainStep | null = null;
    for (let i = 0; i < sets.length && !step; i++) {
      if (settled.has(i)) continue;
      const left = sets[i].filter((n) => !taken.has(n));
      if (left.length === 1) step = { sketch: i, name: left[0], kind: 'one-name' };
    }
    if (!step && names.length === board.sketches.length)
      for (const n of names) {
        if (taken.has(n)) continue;
        const can = sets.flatMap((s, i) => (!settled.has(i) && s.includes(n) ? [i] : []));
        if (can.length === 1) {
          step = { sketch: can[0], name: n, kind: 'one-sketch' };
          break;
        }
      }
    if (!step) break;
    settled.set(step.sketch, step.name);
    taken.add(step.name);
    steps.push(step);
  }
  return steps;
}

/** The longest path in the key, in questions. */
export const longestPath = (board: Board) => Math.max(...[...board.paths.values()].map((p) => p.length));

/** Whether a drawn board meets its level's row: one answer, solved by the chain, and the level's filters. */
export function keeps(board: Board): boolean {
  const plan = planFor(board.level);
  if (longestPath(board) > plan.longest) return false;
  if (fitSets(board).filter((s) => s.length > 1).length < plan.open) return false;
  const steps = chain(board);
  if (steps.length !== board.sketches.length) return false;
  if (steps.some((s) => board.sketches[s.sketch].name !== s.name)) return false;
  return countAnswers(board) === 1;
}

/** Draw one board for the level, keep or not. */
export function draw(level: number, rng: Rng): Board {
  const plan = planFor(level);
  const names = rng
    .shuffle(NAMES.map((_, i) => i))
    .slice(0, plan.guide)
    .sort((a, b) => a - b);
  const looks = rng.shuffle(LOOKS.map((_, i) => i)).slice(0, plan.guide);
  const guide = names.map((name, i) => ({ name, look: LOOKS[looks[i]] }));
  const key = buildKey(guide, rng);
  const shown = rng.shuffle(guide.slice()).slice(0, plan.sketches);
  const hiding = new Set(rng.shuffle(shown.map((_, i) => i)).slice(0, plan.hidden));
  const sketches = shown.map((c, i) => ({
    name: c.name,
    look: c.look,
    hidden: hiding.has(i) ? [rng.int(0, 3)] : [],
  }));
  return { level: plan.level, guide, key, sketches, paths: keyPaths(key) };
}

/** Redraw until the level's filter keeps a board; the tests check one is found within 200 draws. */
export function makeBoard(level: number, rng: Rng): Board {
  for (let i = 0; i < 199; i++) {
    const b = draw(level, rng);
    if (keeps(b)) return b;
  }
  return draw(level, rng);
}

// ---- the page ----

export interface Page {
  /** The name on each sketch's plate, or null. */
  names: (number | null)[];
  stamped: boolean[];
}

export const newPage = (board: Board): Page => ({
  names: board.sketches.map(() => null),
  stamped: board.sketches.map(() => false),
});

export const right = (board: Board, page: Page, i: number) => page.names[i] === board.sketches[i].name;

/** The sketch carrying `name`, or -1. */
export const holder = (page: Page, name: number) => page.names.indexOf(name);

/**
 * Give `name` to sketch `i`. A name sits on one sketch only, so it moves off any other unstamped sketch. A stamped sketch
 * and a stamped name never move. Returns the new page, or null when nothing changed.
 */
export function give(page: Page, i: number, name: number): Page | null {
  if (page.stamped[i] || page.names[i] === name) return null;
  const from = holder(page, name);
  if (from >= 0 && page.stamped[from]) return null;
  const names = page.names.slice();
  if (from >= 0) names[from] = null;
  names[i] = name;
  return { names, stamped: page.stamped };
}

/** Lift the name off unstamped sketch `i`. */
export function lift(page: Page, i: number): Page | null {
  if (page.stamped[i] || page.names[i] === null) return null;
  const names = page.names.slice();
  names[i] = null;
  return { names, stamped: page.stamped };
}

/** The unstamped sketches that carry their right names. */
export const rightOpen = (board: Board, page: Page) =>
  page.names.flatMap((_, i) => (!page.stamped[i] && right(board, page, i) ? [i] : []));

/** After a naming: when three unstamped sketches carry their right names, stamp exactly those three. */
export function stamp(board: Board, page: Page): { page: Page; stamped: number[] } {
  const open = rightOpen(board, page);
  if (open.length < 3) return { page, stamped: [] };
  const stamped = page.stamped.slice();
  for (const i of open) stamped[i] = true;
  return { page: { names: page.names, stamped }, stamped: open };
}

export const done = (page: Page) => page.stamped.every(Boolean);

/** Every unstamped sketch carries a name, and the page is not finished: a worked answer that does not hold. */
export const fullWrong = (page: Page) =>
  !done(page) && page.names.every((n, i) => page.stamped[i] || n !== null);

/** A page's identity, for counting one miss per distinct full wrong page and repeating a hint for free. */
export const pageKey = (page: Page) => page.names.map((n) => (n === null ? '-' : n)).join(',');

export class Misses {
  private readonly seen = new Set<string>();
  /** True when this full wrong page has not been counted before in the round. */
  count(page: Page): boolean {
    const key = pageKey(page);
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }
}

export interface Fault {
  sketch: number;
  name: number;
  /** The question on the name's path the sketch contradicts. */
  q: number;
  /** The branch the name's path takes there. */
  yes: boolean;
  part: number;
  /** The value the question asks about, and the value the sketch shows. */
  value: number;
  shows: number;
}

/**
 * Why a full wrong page does not hold: the lowest-numbered unstamped sketch whose name does not fit, and what on the
 * page rules it out. Only the answer gives every sketch a fitting name, so a full wrong page always has one.
 */
export function fault(board: Board, page: Page): Fault | null {
  for (let i = 0; i < page.names.length; i++) {
    const name = page.names[i];
    if (page.stamped[i] || name === null) continue;
    const step = contradiction(board, i, name);
    if (!step) continue;
    const q = board.key[step.q];
    return {
      sketch: i,
      name,
      q: step.q,
      yes: step.yes,
      part: q.part,
      value: q.value,
      shows: board.sketches[i].look[q.part],
    };
  }
  return null;
}

export interface Hint extends ChainStep {
  /** For a one-name step: the other names the key leaves open for the sketch, each with the sketch it is settled on. */
  others: { name: number; on: number }[];
  /** Questions to light: the right name's path. */
  path: number[];
}

/**
 * The hint: walk the chain and stop at the first step whose sketch does not carry its name. The steps before it are
 * already right on the page, so the names they settle are where the hint says they are.
 */
export function hint(board: Board, page: Page): Hint | null {
  const steps = chain(board);
  const at = new Map(steps.map((s, k) => [s.name, k]));
  for (const [k, step] of steps.entries()) {
    if (page.names[step.sketch] === step.name) continue;
    const others =
      step.kind === 'one-name'
        ? fitSets(board)
            [step.sketch].filter((n) => n !== step.name)
            .map((n) => ({ name: n, on: steps[at.get(n)!].sketch }))
            .filter((o) => (at.get(o.name) ?? Infinity) < k)
        : [];
    return { ...step, others, path: (board.paths.get(step.name) ?? []).map((s) => s.q) };
  }
  return null;
}

// ---- words for the page ----

/** A part's value as the sketch shows it ("a fanned tail"). */
export const shownWords = (part: number, v: number): string => SHOWN[part][v];
const SHOWN = [
  ['a crest', 'horns', 'long ears'],
  ['a plain coat', 'spots', 'stripes'],
  ['a fanned tail', 'a curled tail', 'a tufted tail'],
  ['webbed feet', 'claws', 'hooves'],
];
/** The other side of a question ("a tail that is not fanned"). */
const BARRED = [
  ['no crest', 'no horns', 'no long ears'],
  ['a coat that is not plain', 'no spots', 'no stripes'],
  ['a tail that is not fanned', 'a tail that is not curled', 'a tail that is not tufted'],
  ['feet that are not webbed', 'no claws', 'no hooves'],
];
export const barredWords = (part: number, v: number) => BARRED[part][v];

/** The question in words. */
export const questionWords = (part: number, v: number): string => QUESTIONS[part][v];
const QUESTIONS = [
  ['Does it have a crest?', 'Does it have horns?', 'Does it have long ears?'],
  ['Is the coat plain?', 'Is the coat spotted?', 'Is the coat striped?'],
  ['Is the tail fanned?', 'Is the tail curled?', 'Is the tail tufted?'],
  ['Are the feet webbed?', 'Are the feet clawed?', 'Are the feet hoofed?'],
];

/** How a sketch hides a part. */
export const HIDDEN_WORDS = [
  'its head is smudged',
  'its coat is not filled in',
  'its tail is behind the reeds',
  'its feet are in the water',
];

/** The spoken fault line's ID: what the path needs or bars, and what the sketch shows. */
export const faultLine = (f: Fault) =>
  f.yes
    ? `key.fault.${PARTS[f.part]}.yes.${VALUES[PARTS[f.part]][f.value]}.${VALUES[PARTS[f.part]][f.shows]}`
    : `key.fault.${PARTS[f.part]}.no.${VALUES[PARTS[f.part]][f.value]}`;

/** The whole working of a fault, with the sketch number and the name, for the note on screen. */
export function faultWorking(f: Fault): string {
  const through = f.yes ? shownWords(f.part, f.value) : barredWords(f.part, f.value);
  return `Sketch ${f.sketch + 1} is named ${NAMES[f.name]}. The key reaches ${NAMES[f.name]} through ${through}. This one has ${shownWords(f.part, f.shows)}.`;
}

const join = (xs: string[]) =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** The whole working of a hint, for the note on screen. */
export function hintWorking(board: Board, h: Hint): string {
  const n = h.sketch + 1;
  const name = NAMES[h.name];
  if (h.kind === 'one-sketch') {
    return `Only sketch ${n} can be ${name}. Every other open sketch shows something the key rules out for ${name}. Name sketch ${n} ${name}.`;
  }
  const s = board.sketches[h.sketch];
  const open = fitSets(board)[h.sketch];
  const shows = [0, 1, 2, 3].filter((p) => !s.hidden.includes(p)).map((p) => shownWords(p, s.look[p]));
  const hides = s.hidden.map((p) => HIDDEN_WORDS[p]);
  let text = `Sketch ${n} shows ${join(shows)}${hides.length ? `, and ${join(hides)}` : ''}.`;
  if (open.length > 1) {
    text += ` The key leaves ${join(open.map((o) => NAMES[o]))}.`;
    for (const o of h.others) text += ` ${NAMES[o.name]} is sketch ${o.on + 1}.`;
  }
  return `${text} Name sketch ${n} ${name}.`;
}
