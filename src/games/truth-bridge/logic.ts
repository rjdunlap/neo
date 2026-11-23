import type { BandLevels } from '../../progress/difficulty';

/**
 * Truth Bridge's rules (docs/definitions/truth-bridge.md). Islanders either speak straight or play Topsy, where
 * everything they say is the opposite of what is so. Each says one sentence about the group, and a board is valid
 * when exactly one marking of kinds makes every sentence fit its speaker.
 */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };

const descriptions = [
  'Two at the gate: two islanders, one sentence each; mark who speaks straight and who is Topsy',
  'Three on the bridge: three islanders, where one sentence’s result is needed to read another',
  'Try it both ways: rule out a possible mark by seeing which sentence stops fitting',
  'Which plank? Mark three islanders and work out which plank is sound from what they say',
];

export const describeLevel = (level: number) => descriptions[level - 1];

export type Kind = 'straight' | 'topsy';
export const KINDS: readonly Kind[] = ['straight', 'topsy'];
export const PLANKS = ['left', 'middle', 'right'] as const;
export type Plank = (typeof PLANKS)[number];
type Value = Kind | Plank;

export const kindWord = (kind: Kind) => (kind === 'straight' ? 'Straight' : 'Topsy');

/** The fixed cast, in the name order two-name sentences use. */
export const NAMES = ['bear', 'cat', 'duck'] as const;
export type Name = (typeof NAMES)[number];

/** One sentence, about seats. `x` is a seat other than the speaker's; `pair` is about the two others (three seats). */
export type Sentence =
  | { k: 'is'; x: number; kind: Kind }
  | { k: 'mine'; x: number; same: boolean }
  | { k: 'pair'; same: boolean }
  | { k: 'all'; kind: Kind }
  | { k: 'some' }
  | { k: 'count'; n: 1 | 2 }
  | { k: 'plank'; plank: Plank; sound: boolean };

/** A seat pattern: sentence `i` is said by seat `i`. */
export type Pattern = readonly Sentence[];

/** Every sentence the speaker in `seat` can say among `seats` islanders, in a fixed order. */
export function sentencesFor(seat: number, seats: number, withPlanks = false): Sentence[] {
  const others = [...Array(seats).keys()].filter((s) => s !== seat);
  const out: Sentence[] = [];
  for (const x of others) for (const kind of KINDS) out.push({ k: 'is', x, kind });
  for (const x of others) for (const same of [true, false]) out.push({ k: 'mine', x, same });
  if (seats === 3) for (const same of [true, false]) out.push({ k: 'pair', same });
  for (const kind of KINDS) out.push({ k: 'all', kind });
  out.push({ k: 'some' });
  if (seats === 3) for (const n of [1, 2] as const) out.push({ k: 'count', n });
  if (withPlanks)
    for (const plank of PLANKS) for (const sound of [true, false]) out.push({ k: 'plank', plank, sound });
  return out;
}

/** Whether the sentence is so, for the speaker in `seat` and these kinds. */
export function isSo(s: Sentence, seat: number, kinds: readonly Kind[], plank: Plank | null = null): boolean {
  switch (s.k) {
    case 'is':
      return kinds[s.x] === s.kind;
    case 'mine':
      return (kinds[s.x] === kinds[seat]) === s.same;
    case 'pair': {
      const [a, b] = kinds.filter((_, i) => i !== seat);
      return (a === b) === s.same;
    }
    case 'all':
      return kinds.every((kind) => kind === s.kind);
    case 'some':
      return kinds.includes('topsy');
    case 'count':
      return kinds.filter((kind) => kind === 'straight').length === s.n;
    case 'plank':
      return plank !== null && (plank === s.plank) === s.sound;
  }
}

/** A sentence fits when it is so and its speaker speaks straight, or it is not so and its speaker is Topsy. */
export const fits = (
  s: Sentence,
  seat: number,
  kinds: readonly Kind[],
  plank: Plank | null = null,
): boolean => isSo(s, seat, kinds, plank) === (kinds[seat] === 'straight');

/** Every marking of `seats` islanders, Straight first. */
export function markings(seats: number): Kind[][] {
  let out: Kind[][] = [[]];
  for (let i = 0; i < seats; i++) out = out.flatMap((m) => KINDS.map((kind) => [...m, kind]));
  return out;
}

export type Domain = Kind | null;

export interface Answer {
  kinds: Kind[];
  plank: Plank | null;
}

function answers(seats: number, withPlanks: boolean): Answer[] {
  return markings(seats).flatMap((kinds) =>
    (withPlanks ? PLANKS : [null]).map((plank) => ({ kinds, plank })),
  );
}

/** The complete answers in which every sentence fits. A valid board has exactly one. */
export const solutions = (pattern: Pattern): Answer[] =>
  answers(pattern.length, hasPlanks(pattern)).filter(({ kinds, plank }) =>
    pattern.every((s, seat) => fits(s, seat, kinds, plank)),
  );

const hasPlanks = (pattern: Pattern) => pattern.some((s) => s.k === 'plank');

type Target = { seat: number; kind: Kind } | { plank: Plank };
/** A sentence settles an unknown directly, or by contradicting a supposition about it. */
export type Step = Target & { speaker: number; suppose?: Value };

const valueAt = ({ kinds, plank }: Answer, index: number): Value =>
  index < kinds.length ? kinds[index] : plank!;

const targetAt = (seats: number, index: number, value: Value): Target =>
  index < seats ? { seat: index, kind: value as Kind } : { plank: value as Plank };

function domainsFor(seats: number, withPlanks: boolean): Value[][] {
  const domains: Value[][] = Array.from({ length: seats }, () => [...KINDS]);
  if (withPlanks) domains.push([...PLANKS]);
  return domains;
}

/** Under one sentence, keep all fitting answers that agree with the domains. Report the values they settle. */
function settle(domains: readonly Value[][], possible: readonly Answer[]) {
  const live = possible.filter((answer) => domains.every((values, i) => values.includes(valueAt(answer, i))));
  if (!live.length) return null;
  return domains.flatMap((values, index) => {
    if (values.length < 2) return [];
    const remaining = values.filter((value) => live.some((answer) => valueAt(answer, index) === value));
    return remaining.length < values.length ? [{ index, remaining }] : [];
  });
}

const FITTING = new WeakMap<Pattern, Answer[][]>();

function fittingAnswers(pattern: Pattern) {
  let fitting = FITTING.get(pattern);
  if (!fitting) {
    const all = answers(pattern.length, hasPlanks(pattern));
    fitting = pattern.map((s, speaker) => all.filter(({ kinds, plank }) => fits(s, speaker, kinds, plank)));
    FITTING.set(pattern, fitting);
  }
  return fitting;
}

/** Sweep the sentences in seat order until none settle another unknown, or a sentence cannot fit. */
function propagate(domains: Value[][], fitting: readonly Answer[][], steps: Step[]): number | null {
  const seats = fitting.length;
  for (let changed = true; changed;) {
    changed = false;
    for (let speaker = 0; speaker < seats; speaker++) {
      const made = settle(domains, fitting[speaker]);
      if (!made) return speaker;
      for (const { index, remaining } of made) {
        domains[index] = remaining;
        if (remaining.length === 1) steps.push({ speaker, ...targetAt(seats, index, remaining[0]) });
      }
      changed ||= made.length > 0;
    }
  }
  return null;
}

/** Try unknowns in seat order and values in domain order. If a trial stalls without a
 * contradiction, skip it. Only a contradiction can rule out its tested value.
 */
function solve(pattern: Pattern, domains = domainsFor(pattern.length, hasPlanks(pattern))) {
  const fitting = fittingAnswers(pattern);
  const steps: Step[] = [];
  let suppositions = 0;
  if (propagate(domains, fitting, steps) !== null) return null;
  while (true) {
    if (domains.every((values) => values.length === 1)) return { steps, suppositions };
    let ruledOut = false;
    unknown: for (const [index, values] of domains.entries()) {
      if (values.length === 1) continue;
      for (const suppose of values) {
        const trial = domains.slice();
        trial[index] = [suppose];
        const speaker = propagate(trial, fitting, []);
        if (speaker === null) continue;
        const remaining = values.filter((value) => value !== suppose);
        domains[index] = remaining;
        suppositions++;
        if (remaining.length === 1)
          steps.push({ speaker, suppose, ...targetAt(pattern.length, index, remaining[0]) });
        if (propagate(domains, fitting, steps) !== null) return null;
        ruledOut = true;
        break unknown;
      }
    }
    if (!ruledOut) return null;
  }
}

export const suppositionCount = (pattern: Pattern): number | undefined => solve(pattern)?.suppositions;
export const propagates = (pattern: Pattern): boolean => suppositionCount(pattern) === 0;

/** Flat: one pass of each sentence from scratch settles everyone, so no sentence needs another’s result. */
export function flat(pattern: Pattern): boolean {
  const blank = domainsFor(pattern.length, hasPlanks(pattern));
  const indices = new Set(
    fittingAnswers(pattern).flatMap((fitting) =>
      (settle(blank, fitting) ?? []).filter((s) => s.remaining.length === 1).map((s) => s.index),
    ),
  );
  return indices.size === blank.length;
}

/** Every seat pattern for this number of islanders. The plank pool requires at least one plank sentence. */
export function patterns(seats: number, withPlanks = false): Pattern[] {
  let out: Sentence[][] = [[]];
  for (let seat = 0; seat < seats; seat++) {
    const sentences = sentencesFor(seat, seats, withPlanks);
    out = out.flatMap((p) => sentences.map((s) => [...p, s]));
  }
  return withPlanks ? out.filter(hasPlanks) : out;
}

export const POOL_IDS = ['gate-flat', 'gate-chained', 'bridge', 'suppose', 'planks'] as const;
export type PoolId = (typeof POOL_IDS)[number];

const POOLS: Partial<Record<PoolId, Pattern[]>> = {};

/** Build each pool once, filtering on uniqueness before running the teaching solver. */
export function pool(id: PoolId): Pattern[] {
  const gate = id === 'gate-flat' || id === 'gate-chained';
  return (POOLS[id] ??= patterns(gate ? 2 : 3, id === 'planks').filter((p) => {
    if (solutions(p).length !== 1) return false;
    const count = suppositionCount(p);
    if (id === 'planks') return count === 0 || count === 1;
    if (id === 'suppose') return count === 1;
    return count === 0 && flat(p) === (id === 'gate-flat');
  }));
}

export const roundPools = (level: number): readonly PoolId[] =>
  level === 1 ? ['gate-flat', 'gate-chained'] : [POOL_IDS[level]];

/** A board on screen: who sits where and what each says. */
export interface Board {
  seats: Name[];
  pattern: Pattern;
  solution: Answer;
}

interface Picker {
  int(min: number, max: number): number;
}

/** A stable name for a board, to tell a repeat. */
export const boardKey = (seats: readonly Name[], pattern: Pattern): string =>
  `${seats.join(',')}|${pattern.map((s, speaker) => code(s, speaker, seats)).join('|')}`;

/** A seeded board from a pool: the pattern, which islanders appear and in which seats. Never the board named by `avoid`. */
export function boardFor(id: PoolId, rng: Picker, avoid?: string): Board {
  const from = pool(id);
  for (;;) {
    const pattern = from[rng.int(0, from.length - 1)];
    const cast: Name[] = [...NAMES];
    const seats: Name[] = [];
    while (seats.length < pattern.length) seats.push(...cast.splice(rng.int(0, cast.length - 1), 1));
    if (boardKey(seats, pattern) !== avoid) return { seats, pattern, solution: solutions(pattern)[0] };
  }
}

/**
 * A sentence's stable code with names applied, which is also its voice-line suffix: `is.cat.topsy`, `mine.duck.same`,
 * `pair.bear-cat.diff`, `all2.straight`, `all3.topsy`, `some`, `count.2`. Two names go in the fixed order.
 */
export function code(s: Sentence, speaker: number, seats: readonly Name[]): string {
  switch (s.k) {
    case 'is':
      return `is.${seats[s.x]}.${s.kind}`;
    case 'mine':
      return `mine.${seats[s.x]}.${s.same ? 'same' : 'diff'}`;
    case 'pair':
      return `pair.${seats
        .filter((_, i) => i !== speaker)
        .sort()
        .join('-')}.${s.same ? 'same' : 'diff'}`;
    case 'all':
      return `all${seats.length}.${s.kind}`;
    case 'some':
      return 'some';
    case 'count':
      return `count.${s.n}`;
    case 'plank':
      return `plank.${s.plank}.${s.sound ? 'sound' : 'rotten'}`;
  }
}

export const title = (name: Name): string => name[0].toUpperCase() + name.slice(1);

/** The words of a sentence code, as shown in the bubble and spoken. */
export function words(sentenceCode: string): string {
  const [kind, a, b] = sentenceCode.split('.');
  const who = (name: string) => title(name as Name);
  switch (kind) {
    case 'is':
      return b === 'straight' ? `${who(a)} speaks straight.` : `${who(a)} is Topsy.`;
    case 'mine':
      return b === 'same' ? `${who(a)} is my kind.` : `${who(a)} is not my kind.`;
    case 'pair': {
      const [x, y] = a.split('-').map(who);
      return b === 'same' ? `${x} and ${y} are the same kind.` : `${x} and ${y} are different kinds.`;
    }
    case 'all2':
      return a === 'straight' ? 'Both of us speak straight.' : 'Both of us are Topsy.';
    case 'all3':
      return a === 'straight' ? 'All of us speak straight.' : 'All of us are Topsy.';
    case 'some':
      return 'At least one of us is Topsy.';
    case 'plank':
      return `The ${a} plank is ${b}.`;
    default:
      return a === '1' ? 'Exactly one of us speaks straight.' : 'Exactly two of us speak straight.';
  }
}

/** The player's marks: a kind, or null while blank. */
export type Marks = readonly Domain[];

/** Tapping an islander cycles blank → Straight → Topsy → blank. */
export const cycle = (mark: Domain): Domain =>
  mark === null ? 'straight' : mark === 'straight' ? 'topsy' : null;

export type Verdict =
  /** The first blank islander: Cross names them, free. */
  | { kind: 'blank'; seat: number }
  | { kind: 'choose-plank' }
  /** The first sentence, in seat order, that does not fit these marks. */
  | { kind: 'wrong'; speaker: number }
  | { kind: 'cross' };

/** What Cross finds. A complete wrong marking always has a sentence that does not fit, since only the solution fits all. */
export function check(board: Board, marks: Marks, plank: Plank | null = null): Verdict {
  const blank = marks.indexOf(null);
  if (blank >= 0) return { kind: 'blank', seat: blank };
  if (board.solution.plank && !plank) return { kind: 'choose-plank' };
  const speaker = board.pattern.findIndex((s, seat) => !fits(s, seat, marks as Kind[], plank));
  return speaker < 0 ? { kind: 'cross' } : { kind: 'wrong', speaker };
}

/**
 * Whether Cross on these wrong marks counts: one miss per distinct wrong complete answer on a board, so crossing again
 * with the same marks replays the explanation, free. `seen` is the round's own set.
 */
export const answerKey = (boardAt: number, marks: Marks, plank: Plank | null) =>
  `${boardAt}:${marks.join(',')}:${plank ?? ''}`;

export function countsAsMiss(
  seen: Set<string>,
  boardAt: number,
  marks: Marks,
  plank: Plank | null = null,
): boolean {
  const key = answerKey(boardAt, marks, plank);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

/**
 * The next hint: the marks that agree with the solution are taken as given and the rest as unknown, and the solver
 * runs to its first step, which settles an islander whose correct kind the player has not set. Null once every mark is right.
 */
export function hintFor(board: Board, marks: Marks, plank: Plank | null = null): Step | null {
  const answer = board.solution;
  const domains = domainsFor(marks.length, answer.plank !== null);
  marks.forEach((mark, seat) => {
    if (mark === answer.kinds[seat]) domains[seat] = [mark];
  });
  if (plank && plank === answer.plank) domains[marks.length] = [plank];
  return solve(board.pattern, domains)?.steps[0] ?? null;
}

/** The voice-line id of a spoken sentence. */
export const sentenceLine = (board: Board, speaker: number) =>
  `bridge.s.${code(board.pattern[speaker], speaker, board.seats)}`;

/** The voice-line id of a miss: the speaker, the kind they are marked, and their sentence. */
export const missLine = (board: Board, speaker: number, marked: Kind) =>
  `bridge.miss.${board.seats[speaker]}.${marked}.${code(board.pattern[speaker], speaker, board.seats)}`;

/** The voice-line id of a hint. Suppositions name the mark tried and the sentence that broke. */
export function hintLine(board: Board, step: Step) {
  const speaker = board.seats[step.speaker];
  const said = code(board.pattern[step.speaker], step.speaker, board.seats);
  const target = 'seat' in step ? `${board.seats[step.seat]}.${step.kind}` : `plank.${step.plank}`;
  if (step.suppose) return `bridge.try.${speaker}.${target}.${step.suppose}`;
  return `bridge.hint.${speaker}.${said}.${target}`;
}

export function suppositionWords(board: Board, step: Step) {
  const speaker = title(board.seats[step.speaker]);
  if ('seat' in step) {
    const name = title(board.seats[step.seat]);
    return `Try ${name} as ${kindWord(step.suppose as Kind)}. Then ${speaker}’s words can’t fit. So ${name} is ${kindWord(step.kind)}.`;
  }
  return `Try the ${step.suppose} plank. Then ${speaker}’s words can’t fit. Choose the ${step.plank} plank.`;
}
