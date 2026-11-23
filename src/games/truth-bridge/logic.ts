import type { BandLevels } from '../../progress/difficulty';

/**
 * Truth Bridge's rules (docs/definitions/truth-bridge.md). Islanders either speak straight or play Topsy, where
 * everything they say is the opposite of what is so. Each says one sentence about the group, and a board is valid
 * when exactly one marking of kinds makes every sentence fit its speaker.
 *
 * Levels 1–2 are built: boards the propagation step alone settles. Levels 3–4 (suppositions and planks) are the next
 * batch; their sentence kinds and solver steps are not here yet.
 */
export const LEVELS: BandLevels = { grownup: { min: 1, max: 2 } };

export const describeLevel = (level: number) =>
  level === 1
    ? 'Two at the gate: two islanders, one sentence each; mark who speaks straight and who is Topsy'
    : 'Three on the bridge: three islanders, where one sentence’s result is needed to read another';

export type Kind = 'straight' | 'topsy';
export const KINDS: readonly Kind[] = ['straight', 'topsy'];
export const other = (kind: Kind): Kind => (kind === 'straight' ? 'topsy' : 'straight');

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
  | { k: 'count'; n: 1 | 2 };

/** A seat pattern: sentence `i` is said by seat `i`. */
export type Pattern = readonly Sentence[];

/** Every sentence the speaker in `seat` can say among `seats` islanders, in a fixed order. */
export function sentencesFor(seat: number, seats: number): Sentence[] {
  const others = [...Array(seats).keys()].filter((s) => s !== seat);
  const out: Sentence[] = [];
  for (const x of others) for (const kind of KINDS) out.push({ k: 'is', x, kind });
  for (const x of others) for (const same of [true, false]) out.push({ k: 'mine', x, same });
  if (seats === 3) for (const same of [true, false]) out.push({ k: 'pair', same });
  for (const kind of KINDS) out.push({ k: 'all', kind });
  out.push({ k: 'some' });
  if (seats === 3) for (const n of [1, 2] as const) out.push({ k: 'count', n });
  return out;
}

/** Whether the sentence is so, for the speaker in `seat` and these kinds. */
export function isSo(s: Sentence, seat: number, kinds: readonly Kind[]): boolean {
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
  }
}

/** A sentence fits when it is so and its speaker speaks straight, or it is not so and its speaker is Topsy. */
export const fits = (s: Sentence, seat: number, kinds: readonly Kind[]): boolean =>
  isSo(s, seat, kinds) === (kinds[seat] === 'straight');

/** Every marking of `seats` islanders, Straight first. */
export function markings(seats: number): Kind[][] {
  let out: Kind[][] = [[]];
  for (let i = 0; i < seats; i++) out = out.flatMap((m) => KINDS.map((kind) => [...m, kind]));
  return out;
}

/** The markings in which every sentence fits. A valid board has exactly one. */
export const solutions = (pattern: Pattern): Kind[][] =>
  markings(pattern.length).filter((kinds) => pattern.every((s, seat) => fits(s, seat, kinds)));

/** What may still be so for one islander: a kind once settled, null while open. */
export type Domain = Kind | null;

/** One settlement: the sentence said by `speaker` settles the islander in `seat` as `kind`. */
export interface Step {
  speaker: number;
  seat: number;
  kind: Kind;
}

/**
 * The propagation step for one sentence: among the markings that agree with the domains and in which this sentence
 * fits its speaker, every islander who takes a single kind is settled. Null when no such marking exists.
 */
export function settle(pattern: Pattern, speaker: number, domains: readonly Domain[]): Step[] | null {
  const live = markings(pattern.length).filter(
    (kinds) =>
      kinds.every((kind, i) => domains[i] === null || domains[i] === kind) &&
      fits(pattern[speaker], speaker, kinds),
  );
  if (!live.length) return null;
  const steps: Step[] = [];
  domains.forEach((domain, seat) => {
    if (domain === null && live.every((kinds) => kinds[seat] === live[0][seat]))
      steps.push({ speaker, seat, kind: live[0][seat] });
  });
  return steps;
}

/**
 * Propagation: the sentences in seat order, again and again until nothing changes. Returns the steps in the order
 * they were made and the domains they leave, or null when the domains contradict a sentence.
 */
export function propagate(
  pattern: Pattern,
  start: readonly Domain[] = pattern.map(() => null),
): { steps: Step[]; domains: Domain[] } | null {
  const domains = [...start];
  const steps: Step[] = [];
  for (let changed = true; changed;) {
    changed = false;
    for (let speaker = 0; speaker < pattern.length; speaker++) {
      const made = settle(pattern, speaker, domains);
      if (!made) return null;
      for (const step of made) domains[step.seat] = step.kind;
      steps.push(...made);
      changed ||= made.length > 0;
    }
  }
  return { steps, domains };
}

/** Zero suppositions: propagation alone settles everyone. */
export const propagates = (pattern: Pattern): boolean =>
  propagate(pattern)?.domains.every((d) => d !== null) ?? false;

/** Flat: one pass of each sentence from scratch settles everyone, so no sentence needs another's result. */
export function flat(pattern: Pattern): boolean {
  const blank = pattern.map(() => null);
  const settled = new Set(
    pattern.flatMap((_, speaker) => (settle(pattern, speaker, blank) ?? []).map((s) => s.seat)),
  );
  return settled.size === pattern.length;
}

/** Every seat pattern for `seats` islanders. */
export function patterns(seats: number): Pattern[] {
  let out: Sentence[][] = [[]];
  for (let seat = 0; seat < seats; seat++)
    out = out.flatMap((p) => sentencesFor(seat, seats).map((s) => [...p, s]));
  return out;
}

export type PoolId = 'gate-flat' | 'gate-chained' | 'bridge';

const POOLS: Partial<Record<PoolId, Pattern[]>> = {};

/**
 * A level's boards, made once. Level 1 draws a flat board and then a chained one from the valid two-islander boards
 * propagation settles; level 2 draws from the chained three-islander boards.
 */
export function pool(id: PoolId): Pattern[] {
  return (POOLS[id] ??= patterns(id === 'bridge' ? 3 : 2).filter(
    (p) => solutions(p).length === 1 && propagates(p) && flat(p) === (id === 'gate-flat'),
  ));
}

/** The pools a level's round plays, in order: two boards at level 1, one at level 2. */
export const roundPools = (level: number): PoolId[] =>
  level === 1 ? ['gate-flat', 'gate-chained'] : ['bridge'];

/** A board on screen: who sits where and what each says. */
export interface Board {
  seats: Name[];
  pattern: Pattern;
  solution: Kind[];
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
  /** The first sentence, in seat order, that does not fit these marks. */
  | { kind: 'wrong'; speaker: number }
  | { kind: 'cross' };

/** What Cross finds. A complete wrong marking always has a sentence that does not fit, since only the solution fits all. */
export function check(board: Board, marks: Marks): Verdict {
  const blank = marks.indexOf(null);
  if (blank >= 0) return { kind: 'blank', seat: blank };
  const kinds = marks as Kind[];
  const speaker = board.pattern.findIndex((s, seat) => !fits(s, seat, kinds));
  return speaker < 0 ? { kind: 'cross' } : { kind: 'wrong', speaker };
}

/**
 * Whether Cross on these wrong marks counts: one miss per distinct wrong complete answer on a board, so crossing again
 * with the same marks replays the explanation, free. `seen` is the round's own set.
 */
export function countsAsMiss(seen: Set<string>, boardAt: number, marks: Marks): boolean {
  const key = `${boardAt}:${marks.join(',')}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

/**
 * The next hint: the marks that agree with the solution are taken as given and the rest as unknown, and the solver
 * runs to its first step, which settles an islander whose correct kind the player has not set. Null once every mark is right.
 */
export function hintFor(board: Board, marks: Marks): Step | null {
  const given = marks.map((mark, seat) => (mark === board.solution[seat] ? mark : null));
  return propagate(board.pattern, given)?.steps[0] ?? null;
}

/** The marks after following a hint: one more correct kind, none cleared. */
export const follow = (marks: Marks, step: Step): Domain[] =>
  marks.map((mark, seat) => (seat === step.seat ? step.kind : mark));

/** The voice-line id of a spoken sentence. */
export const sentenceLine = (board: Board, speaker: number) =>
  `bridge.s.${code(board.pattern[speaker], speaker, board.seats)}`;

/** The voice-line id of a miss: the speaker, the kind they are marked, and their sentence. */
export const missLine = (board: Board, speaker: number, marked: Kind) =>
  `bridge.miss.${board.seats[speaker]}.${marked}.${code(board.pattern[speaker], speaker, board.seats)}`;

/** The voice-line id of a hint: the speaker and sentence, and the islander and kind they settle. */
export const hintLine = (board: Board, step: Step) =>
  `bridge.hint.${board.seats[step.speaker]}.${code(board.pattern[step.speaker], step.speaker, board.seats)}.${board.seats[step.seat]}.${step.kind}`;
