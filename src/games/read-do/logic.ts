import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const COLORS = ['red', 'blue', 'yellow', 'green', 'pink'] as const;
export const ANIMALS = ['duck', 'cat', 'pig', 'dog'] as const;
export const ACTIONS = ['jump', 'sleep'] as const;
export const SIZES = ['big', 'small'] as const;
export type Animal = typeof ANIMALS[number];
export type Choice =
  | { kind: 'hat'; color: typeof COLORS[number] }
  | { kind: 'size'; size: typeof SIZES[number]; animal: Animal }
  | { kind: 'action'; animal: Animal; action: typeof ACTIONS[number] };
export const WORDS = ['red', 'blue', 'yellow', 'green', 'pink', 'big', 'small', 'duck', 'cat', 'pig', 'dog', 'the', 'can', 'jump', 'sleep', 'jumps', 'sleeps'] as const;
export type Word = typeof WORDS[number];
export interface Task { words: Word[]; choices: Choice[]; answer: Choice }
export const PLANS = [
  { name: 'Read a color word and choose a hat', rounds: 3 },
  { name: 'Read big or small and choose that animal\'s picture', rounds: 3 },
  { name: 'Read a sentence and make one of two animals jump or sleep', rounds: 4 },
  { name: 'Start the sign: give its first word a capital, then Send', rounds: 3 },
  { name: 'Finish the sign: stamp a full stop on its end, then Send', rounds: 3 },
  { name: 'Ready for a reader: a capital at the start and a full stop at the end', rounds: 3 },
  { name: 'Build a sign from word tiles so the animals do what the pet wishes', rounds: 3 },
  { name: 'Fix a sign by putting one word in or taking one out', rounds: 3 },
  { name: 'Fix a sign by swapping one word for another', rounds: 3 },
] as const;

export const LEVELS: BandLevels = { prek: { min: 1, max: 5, order: [1, 2, 4, 5] }, school: { min: 1, max: 9 } };
export const planFor = (level: number) => PLANS[Math.max(1, Math.min(PLANS.length, level)) - 1];
export function meaning(c: Choice): Word[] {
  if (c.kind === 'hat') return [c.color];
  if (c.kind === 'size') return [c.size, c.animal];
  return ['the', c.animal, 'can', c.action];
}
export const matches = (task: Task, choice: Choice) => meaning(choice).join(' ') === task.words.join(' ');
export const answerIndex = (task: Task) => task.choices.findIndex(c => matches(task, c));

const task = (answer: Choice, choices: Choice[], rng: Rng): Task => ({ answer, words: meaning(answer), choices: rng.shuffle(choices) });

/**
 * Level 1: three different answer colors from five, each with two other seeded hats. Level 2: big, small and a
 * seeded third size, each on a different seeded animal, with both pictures that animal (only the size word decides).
 * Level 3: a seeded pair of animals, every animal-and-action sentence once, so both words still matter.
 */
export function makeTasks(level: number, rng: Rng): Task[] {
  if (level <= 1) return rng.shuffle([...COLORS]).slice(0, 3).map(color => {
    const others = rng.shuffle(COLORS.filter(c => c !== color)).slice(0, 2);
    return task({ kind: 'hat', color }, [color, ...others].map(c => ({ kind: 'hat', color: c })), rng);
  });
  if (level === 2) {
    const animals = rng.shuffle([...ANIMALS]).slice(0, 3);
    const sizes = rng.shuffle<typeof SIZES[number]>(['big', 'small', rng.pick(SIZES)]);
    return animals.map((animal, i) => task({ kind: 'size', size: sizes[i], animal }, SIZES.map(size => ({ kind: 'size', size, animal })), rng));
  }
  const pair = rng.shuffle([...ANIMALS]).slice(0, 2);
  const choices: Choice[] = pair.flatMap(animal => ACTIONS.map(action => ({ kind: 'action', animal, action })));
  return rng.shuffle([...choices]).map(answer => task(answer, [...choices], rng));
}

/** Levels 4–6 (SS1 A–C): which convention Send checks. A ignores the stop, B ignores the capital, C needs both. */
export type Step = 'cap' | 'stop' | 'both';
export const VERBS = ['jumps', 'sleeps'] as const;
export const stepFor = (level: number): Step | null => level === 4 ? 'cap' : level === 5 ? 'stop' : level === 6 ? 'both' : null;
/** The edit state of a sign: whether its first word has its capital and whether the full stop is in the end socket. */
export interface Marks { capital: boolean; stop: boolean }
export interface Sign { animal: Animal; verb: typeof VERBS[number]; words: Word[]; start: Marks }
/** The convention still missing for the step, the capital first; null when Send accepts the sign. */
export function missing(step: Step, marks: Marks): 'cap' | 'stop' | null {
  if (step !== 'stop' && !marks.capital) return 'cap';
  if (step !== 'cap' && !marks.stop) return 'stop';
  return null;
}
/** The sign as printed in its current state, e.g. "The duck jumps." */
export const printed = (sign: Sign, marks: Marks) =>
  (marks.capital ? 'The' : 'the') + ' ' + sign.words.slice(1).join(' ') + (marks.stop ? '.' : '');
export const actionOf = (sign: Sign): Choice => ({ kind: 'action', animal: sign.animal, action: sign.verb === 'jumps' ? 'jump' : 'sleep' });

/**
 * Three seeded signs from the eight *the + animal + jumps/sleeps* clauses: three different animals and both actions,
 * so no word leads every sign. The step fixes what is missing (A: the capital; B: the stop; C: both).
 */
export function makeSigns(level: number, rng: Rng): Sign[] {
  const step = stepFor(level) ?? 'both';
  const start: Marks = { capital: step === 'stop', stop: step === 'cap' };
  const animals = rng.shuffle([...ANIMALS]).slice(0, 3);
  const verbs = rng.shuffle<typeof VERBS[number]>(['jumps', 'sleeps', rng.pick(VERBS)]);
  return animals.map((animal, i) => ({ animal, verb: verbs[i], words: ['the', animal, verbs[i]], start: { ...start } }));
}

/** Level 7 (WC3, *Make the sign*): she writes the words between a locked *The* and a locked full stop. */
export type Size = typeof SIZES[number];
export type Verb = typeof VERBS[number];
export type SlotWord = Size | Animal | Verb;
export interface Actor { animal: Animal; size: Size }
export interface Wish { actor: Actor; verb: Verb }
/** One sign to write: who stands on stage, what the pet wishes, and the six tiles she has. */
export interface WishSign { stage: Actor[]; wish: Wish; tray: SlotWord[] }
export const MAX_SLOTS = 3;
export type Outcome =
  | { kind: 'act'; actor: Actor; verb: Verb }
  | { kind: 'which'; animal: Animal }
  | { kind: 'none'; size: Size | null; animal: Animal }
  | { kind: 'unreadable' };
const isSize = (w: SlotWord): w is Size => (SIZES as readonly string[]).includes(w);
const isAnimal = (w: SlotWord): w is Animal => (ANIMALS as readonly string[]).includes(w);
const isVerb = (w: SlotWord): w is Verb => (VERBS as readonly string[]).includes(w);

/** What the animals do when a reader acts the sign exactly: `The (big|small)? animal action .` or nothing. */
export function act(sign: readonly SlotWord[], stage: readonly Actor[]): Outcome {
  const [size, animal, verb] = sign.length === 3 ? sign : sign.length === 2 ? [null, ...sign] : [];
  if (!animal || !verb || !isAnimal(animal) || !isVerb(verb) || (size !== null && !isSize(size))) return { kind: 'unreadable' };
  const fit = stage.filter(a => a.animal === animal && (size === null || a.size === size));
  if (fit.length === 0) return { kind: 'none', size, animal };
  if (fit.length > 1) return { kind: 'which', animal };
  return { kind: 'act', actor: fit[0], verb };
}
export const sameAct = (o: Outcome, wish: Wish) =>
  o.kind === 'act' && o.verb === wish.verb && o.actor.animal === wish.actor.animal && o.actor.size === wish.actor.size;
export const accepts = (sign: readonly SlotWord[], s: WishSign) => sameAct(act(sign, s.stage), s.wish);
/** Every sign a reader would act as the wish, shortest first (a solo stage has two: with and without its size). */
export const acceptedSigns = (s: WishSign): SlotWord[][] =>
  [[s.wish.actor.animal, s.wish.verb], [s.wish.actor.size, s.wish.actor.animal, s.wish.verb]].filter(w => accepts(w, s));

/** Where each of `part`'s words sits in `whole`, in order, or null when `part` is not an in-order subsequence. */
function embed(part: readonly SlotWord[], whole: readonly SlotWord[]): number[] | null {
  const at: number[] = [];
  let j = 0;
  for (const w of part) {
    while (j < whole.length && whole[j] !== w) j++;
    if (j === whole.length) return null;
    at.push(j++);
  }
  return at;
}
export type Hint = { kind: 'send' } | { kind: 'add'; word: SlotWord; gap: number } | { kind: 'out'; index: number } | { kind: 'swap'; index: number; word: SlotWord };
/**
 * The next step toward the wish: Send once accepted; at level 9 only, the one word to swap when her sign is one
 * tray word away from an accepted sign of the same length; else the first missing word of the shortest accepted sign
 * that still contains hers in order, and the gap (0 = before her first word) it goes in; else the leftmost word
 * where her sign stops fitting any accepted sign, to take out.
 */
export function hintFor(sign: readonly SlotWord[], s: WishSign, level = 7): Hint {
  if (accepts(sign, s)) return { kind: 'send' };
  const goals = acceptedSigns(s);
  if (level >= 9) for (const goal of goals) {
    if (goal.length !== sign.length) continue;
    const diff = goal.flatMap((w, i) => (w === sign[i] ? [] : [i]));
    if (diff.length === 1 && !sign.includes(goal[diff[0]])) return { kind: 'swap', index: diff[0], word: goal[diff[0]] };
  }
  for (const goal of goals) {
    const at = embed(sign, goal);
    if (!at) continue;
    const j = goal.findIndex((_, k) => !at.includes(k));
    return { kind: 'add', word: goal[j], gap: at.filter(k => k < j).length };
  }
  const index = sign.findIndex((_, i) => !goals.some(g => embed(sign.slice(0, i + 1), g)));
  return { kind: 'out', index };
}
/** Applies a hint, as the bot and a child following the glow would. */
export function follow(sign: readonly SlotWord[], hint: Hint): SlotWord[] {
  if (hint.kind === 'add') return [...sign.slice(0, hint.gap), hint.word, ...sign.slice(hint.gap)];
  if (hint.kind === 'out') return sign.filter((_, i) => i !== hint.index);
  if (hint.kind === 'swap') return sign.map((w, i) => (i === hint.index ? hint.word : w));
  return [...sign];
}

/**
 * Three seeded wishes: a solo animal of a seeded size, then a big and small pair of a second animal, then a pair of
 * a third with the other size wished. Three different animals, both verbs, both pair sizes. Each tray is both sizes,
 * the stage animal, a seeded decoy not on stage, and both verbs, shuffled.
 */
export function makeWishes(rng: Rng): WishSign[] {
  const animals = rng.shuffle([...ANIMALS]);
  const verbs = rng.shuffle<Verb>(['jumps', 'sleeps', rng.pick(VERBS)]);
  const pairSize = rng.pick(SIZES);
  const sizes: Size[] = [rng.pick(SIZES), pairSize, pairSize === 'big' ? 'small' : 'big'];
  return [0, 1, 2].map(i => {
    const animal = animals[i];
    const stage: Actor[] = i === 0 ? [{ animal, size: sizes[0] }] : [{ animal, size: 'big' }, { animal, size: 'small' }];
    const decoy = rng.pick(ANIMALS.filter(a => a !== animal));
    const tray = rng.shuffle<SlotWord>(['big', 'small', animal, decoy, 'jumps', 'sleeps']);
    return { stage, wish: { actor: { animal, size: sizes[i] }, verb: verbs[i] }, tray };
  });
}

/**
 * Levels 8–9 (KE1, *Mend the sign*): authored broken signs. I1–I3 need one word put in, D1–D3 one taken out, and
 * S1–S3 one swapped (a wrong action, animal or size). `start` is the printed sign; the tray holds all six words in
 * their seeded home slots, so a word in the sign keeps a home to float back to.
 */
export const INSERTS = ['I1', 'I2', 'I3'] as const;
export const DELETES = ['D1', 'D2', 'D3'] as const;
export const SWAPS = ['S1', 'S2', 'S3'] as const;
export type Pattern = typeof INSERTS[number] | typeof DELETES[number] | typeof SWAPS[number];
export interface MendSign extends WishSign { pattern: Pattern; start: SlotWord[] }
const otherSize = (s: Size): Size => (s === 'big' ? 'small' : 'big');
const otherVerb = (v: Verb): Verb => (v === 'jumps' ? 'sleeps' : 'jumps');

/** One authored broken sign for a pattern, its stage animal `X`, decoy `Y` and wished verb `a`. */
export function mendSign(pattern: Pattern, X: Animal, Y: Animal, a: Verb, rng: Rng): MendSign {
  const pair = pattern === 'I1' || pattern === 'S3';
  const s = rng.pick(SIZES);
  const stage: Actor[] = pair ? [{ animal: X, size: 'big' }, { animal: X, size: 'small' }] : [{ animal: X, size: s }];
  const start: SlotWord[] =
    pattern === 'I1' ? [X, a] :
    pattern === 'I2' ? [X] :
    pattern === 'I3' ? [a] :
    pattern === 'D1' ? [otherSize(s), X, a] :
    pattern === 'D2' ? [X, Y, a] :
    pattern === 'D3' ? (rng.chance(0.5) ? [X, a, otherVerb(a)] : [X, otherVerb(a), a]) :
    pattern === 'S1' ? [X, otherVerb(a)] :
    pattern === 'S2' ? [Y, a] :
    [otherSize(s), X, a];
  const tray = rng.shuffle<SlotWord>(['big', 'small', X, Y, 'jumps', 'sleeps']);
  return { pattern, stage, wish: { actor: { animal: X, size: s }, verb: a }, tray, start };
}

/**
 * A round of three broken signs on three different stage animals, with both verbs wished. Level 8 opens with I1 (a
 * big and a small animal, the sign naming neither), then a seeded delete, then a seeded insert or other delete;
 * level 9 is S1, S2 and S3 in seeded order.
 */
export function makeMendSigns(rng: Rng, level: number): MendSign[] {
  const animals = rng.shuffle([...ANIMALS]);
  const verbs = rng.shuffle<Verb>(['jumps', 'sleeps', rng.pick(VERBS)]);
  let patterns: Pattern[];
  if (level >= 9) patterns = rng.shuffle<Pattern>([...SWAPS]);
  else {
    const del = rng.pick(DELETES);
    patterns = ['I1', del, rng.pick<Pattern>(['I2', 'I3', ...DELETES.filter(d => d !== del)])];
  }
  return patterns.map((p, i) => mendSign(p, animals[i], rng.pick(ANIMALS.filter(a => a !== animals[i])), verbs[i], rng));
}

/** Where a held tray tile lands: swapped onto a slot word, or into a gap (0 = before the first word). */
export type Drop = { kind: 'swap'; index: number } | { kind: 'gap'; gap: number };
export const SWAP_IN = 27;
export const SWAP_OUT = 40;
/**
 * Resolves a held tile's x against the sign's slot words at rest (their centres, left to right). At level 9 a tile
 * within 27 units of a word's centre swaps with it, and keeps swapping until it is more than 40 away; otherwise it
 * goes in the nearest gap, which is the number of word centres left of it. `The` and the stop are never in `rest`.
 */
export function resolveDrop(x: number, rest: readonly number[], level: number, previous: Drop | null = null): Drop {
  if (level >= 9) {
    if (previous?.kind === 'swap' && previous.index < rest.length && Math.abs(x - rest[previous.index]) <= SWAP_OUT) return previous;
    const index = rest.findIndex(c => Math.abs(x - c) <= SWAP_IN);
    if (index >= 0) return { kind: 'swap', index };
  }
  return { kind: 'gap', gap: rest.filter(c => c < x).length };
}

export interface Box { x: number; y: number; w: number; h: number }
export interface SignLayout {
  /** `The`, the three slot places and the stop. */
  row: Box[];
  speaker: Box;
  wish: Box;
  show: Box;
  send: Box;
  tray: Box[];
  /** Where the stage's animals stand (not a target; kept clear of the controls). */
  stage: Box;
  /** A dragged tile's centre counts as over the sign inside this. */
  drop: Box;
}
const box = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h });
/**
 * Levels 7–9's layout from the view (the same geometry at each): the row and tray are 116 apart in the 1024-unit
 * design width; Show it and Send stand to the right.
 */
export function signLayout(v: { w: number; h: number }, _level = 7): SignLayout {
  const cx = v.w / 2, mid = v.h * 0.43;
  const row = [0, 1, 2, 3, 4].map(i => box(cx + (i - 2) * 116, 185, 108, 100));
  return {
    row,
    speaker: box(cx + 365, 185, 110, 100),
    wish: box(cx - 330, mid, 200, 160),
    show: box(cx + 330, mid - 40, 150, 100),
    send: box(cx + 330, mid + 80, 150, 100),
    tray: [0, 1, 2, 3, 4, 5].map(i => box(cx + (i - 2.5) * 116, v.h - 120, 108, 100)),
    stage: { x: cx - 220, y: mid - 90, w: 440, h: 200 },
    drop: { x: row[0].x, y: 95, w: row[4].x + row[4].w + 60 - row[0].x, h: 180 },
  };
}
