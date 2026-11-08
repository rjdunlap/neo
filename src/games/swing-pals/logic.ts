import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/*
 * Swing Pals' rules: a small-swing pendulum stated as a toy. Only the rope sets the beat; a push always helps and never
 * takes height away; the bell latches. See docs/definitions/swing-pals.md.
 */

export type Hook = 'short' | 'middle' | 'long';
export const HOOKS: readonly Hook[] = ['short', 'middle', 'long'];
/** Rope lengths 1 : 2.25 : 4, so a full back-and-forth takes 1, 1.5 and 2 seconds. */
export const LENGTH: Record<Hook, number> = { short: 1, middle: 2.25, long: 4 };

export type Friend = 'bunny' | 'duck' | 'mouse' | 'bear' | 'frog' | 'cat' | 'dog' | 'pig' | 'cow';
export const FRIENDS: readonly Friend[] = [
  'bunny',
  'duck',
  'mouse',
  'bear',
  'frog',
  'cat',
  'dog',
  'pig',
  'cow',
];
export type Weight = 'light' | 'middle' | 'heavy';
export const WEIGHT: Record<Friend, Weight> = {
  mouse: 'light',
  duck: 'light',
  cat: 'light',
  bunny: 'middle',
  frog: 'middle',
  dog: 'middle',
  bear: 'heavy',
  pig: 'heavy',
  cow: 'heavy',
};
/** How big a friend is drawn: weight is shown by size, never by a number. A friend is about 250 × scale units tall. */
export const FRIEND_SCALE: Record<Weight, number> = { light: 0.44, middle: 0.5, heavy: 0.6 };
/** How far each friend's art reaches above its feet at scale 1 (ears, horns and tufts from `art/critter.ts`). */
export const ART_TOP: Record<Friend, number> = {
  bunny: 356,
  duck: 268,
  mouse: 256,
  bear: 256,
  frog: 250,
  cat: 292,
  dog: 250,
  pig: 292,
  cow: 276,
};
/** A friend's drawn height in units: the size she reads weight from. */
export function friendHeight(f: Friend): number {
  return ART_TOP[f] * FRIEND_SCALE[WEIGHT[f]];
}

/** What waits at the front of the arc on the push levels, one kind for a whole round. Each rings the friend's note. */
export type Goal = 'bell' | 'chimes' | 'apple' | 'nest';
export const GOALS: readonly Goal[] = ['bell', 'chimes', 'apple', 'nest'];

/** Pushes from still to the bell. */
export const STEPS = 4;
/** The bell's height in degrees: one swing on the screen, or two. */
export const BELL_ONE = 25;
export const BELL_TWO = 18;
/** An unpushed swing whose bell has rung settles by this much each swing. */
export const SETTLE = 0.85;

/** Seconds for one full back-and-forth on a hook. It takes nothing else: weight and height do not change the beat. */
export function period(hook: Hook): number {
  return Math.sqrt(LENGTH[hook]);
}

/**
 * The swing's angle in degrees at time t, released from the back (negative, toward the pusher) at t0 with height A.
 * Positive is forward, toward the bell.
 */
export function angleAt(hook: Hook, A: number, t0: number, t: number): number {
  return -A * Math.cos((2 * Math.PI * (t - t0)) / period(hook));
}

/** Where a swing is in its back-and-forth, from −1 (back) to 1 (front), whatever its height. */
export function phaseAt(hook: Hook, t0: number, t: number): number {
  return angleAt(hook, 1, t0, t);
}

/* Pushes (levels 1–3) ---------------------------------------------------------------------------- */

export interface Swing {
  hook: Hook;
  friend: Friend;
  /** Pushes landed, 0 (still) to STEPS (the bell). */
  steps: number;
  /** When the beat started (the swing left the back), or null while it hangs still. */
  t0: number | null;
  /** A push waiting for the friend to come back. */
  waiting: boolean;
  rung: boolean;
}

export function stillSwing(hook: Hook, friend: Friend, steps = 0, t0: number | null = null): Swing {
  return { hook, friend, steps, t0: steps > 0 ? (t0 ?? 0) : null, waiting: false, rung: false };
}

/** Each push raises the height by one step, a quarter of the way to the bell. */
export function pushStep(_level: number): number {
  return 1;
}

/** Whether a tap waits for the friend to come back (level 2 on) or pushes at once (level 1). */
export function pushWaits(level: number): boolean {
  return level >= 2;
}

/** The next time at or after t that a swinging friend is back at the pusher. */
export function nextBackTime(swing: Swing, t: number): number {
  if (swing.t0 === null) return t;
  const T = period(swing.hook);
  const k = Math.ceil((t - swing.t0) / T - 1e-9);
  return swing.t0 + Math.max(0, k) * T;
}

/** A push lands: one step higher, up to the bell, which then stays rung. */
export function land(swing: Swing, t: number): Swing {
  const steps = Math.min(STEPS, swing.steps + pushStep(0));
  return { ...swing, steps, waiting: false, t0: swing.t0 ?? t, rung: swing.rung || steps >= STEPS };
}

/**
 * A tap on a swing. From still the push lands at once and starts the beat, at every level. At level 1 every tap lands at
 * once. From level 2 a tap waits for the back point (`landsAt`); taps while one waits merge into it. A rung swing takes no
 * push. Nothing here lowers the height.
 */
export function applyPush(
  swing: Swing,
  tapTime: number,
  level: number,
): { swing: Swing; landsAt: number | null } {
  if (swing.rung) return { swing, landsAt: null };
  if (swing.t0 === null || !pushWaits(level)) return { swing: land(swing, tapTime), landsAt: tapTime };
  if (swing.waiting) return { swing, landsAt: null };
  return { swing: { ...swing, waiting: true }, landsAt: nextBackTime(swing, tapTime) };
}

/** The height a swing is drawn at, in degrees. */
export function heightOf(swing: Swing, bell: number): number {
  return (swing.steps / STEPS) * bell;
}

/* Swing together (levels 4–6) -------------------------------------------------------------------- */

export interface Line {
  /** The pet's swing: fixed. */
  petHook: Hook;
  petFriend: Friend;
  /** Release heights as a share of the bell height. */
  petHeight: number;
  /** Her swing: where it starts, who rides it, how high it lets go. */
  hook: Hook;
  friend: Friend;
  height: number;
  /** Level 8: the beat asked for, hers against the pet's. Unset means together. */
  request?: Request;
}

/** Level 8's requests: hers back twice for each of the pet's, half as often, or together. */
export type Request = 'twice' | 'half' | 'together';
/** How many of her swings come back for each of the pet's each request asks for. */
export const WANTED: Record<Request, number> = { twice: 2, half: 0.5, together: 1 };

/** How many times her swing on `hook` comes back for each return of the pet's swing on `petHook`. */
export function beatRatio(petHook: Hook, hook: Hook): number {
  return period(petHook) / period(hook);
}

export type Together = { match: true } | { match: false; side: 'quicker' | 'slower' };

/** Do the two swings move together with her rope on `hook`? Only the hook decides; a mismatch says which way it is off. */
export function together(line: Line, hook: Hook): Together {
  const right = rightHook(line);
  if (hook === right) return { match: true };
  return { match: false, side: LENGTH[hook] < LENGTH[right] ? 'quicker' : 'slower' };
}

/** The one hook that gives the asked-for beat: the pet's own, or (level 8) the one at twice or half its beat. */
export function rightHook(line: Line): Hook {
  const want = WANTED[line.request ?? 'together'];
  return HOOKS.find((h) => Math.abs(beatRatio(line.petHook, h) - want) < 1e-9) ?? line.petHook;
}

/**
 * How long the swings move before they settle: two of the pet's swings, at most four seconds; at level 8, two of the
 * slower of the pet's swing and the right one, so a "half" line still shows her long rope come back twice.
 */
export function watchTime(line: Line): number {
  return Math.min(4, 2 * Math.max(period(line.petHook), period(rightHook(line))));
}

/** The times (after letting go together, up to `watch`) when both swings are back at the pusher at once: the claps. */
export function clapTimes(petHook: Hook, hook: Hook, watch: number): number[] {
  const out: number[] = [];
  const Tp = period(petHook),
    Th = period(hook);
  for (let k = 1; k * Tp <= watch + 1e-9; k++) {
    const t = k * Tp;
    if (Math.abs(t / Th - Math.round(t / Th)) < 1e-9) out.push(t);
  }
  return out;
}

/** The times her swing comes back during the watch (level 8 taps a soft note at each). */
export function backTimes(hook: Hook, watch: number): number[] {
  const out: number[] = [];
  for (let k = 1; k * period(hook) <= watch + 1e-9; k++) out.push(k * period(hook));
  return out;
}

/* Who comes back first? (level 7) ---------------------------------------------------------------- */

/** Two friends on two different hooks, released together; she predicts which comes back first. Left first. */
export interface Race {
  hooks: [Hook, Hook];
  friends: [Friend, Friend];
  /** Release heights as a share of the bell height. */
  heights: [number, number];
}

/** Which side comes back first: the shorter rope, whatever the weights and heights. */
export function firstBack(race: Race): 0 | 1 {
  return LENGTH[race.hooks[0]] < LENGTH[race.hooks[1]] ? 0 : 1;
}

/** How long a race is watched: until the slower friend's first return, and a breath more. */
export function raceWatch(race: Race): number {
  return Math.max(period(race.hooks[0]), period(race.hooks[1])) + 0.3;
}

const RANK: Record<Weight, number> = { light: 0, middle: 1, heavy: 2 };
/** The tempting wrong guess: the heavier friend or the bigger push is on the shorter rope. */
export function raceTempts(race: Race): boolean {
  const s = firstBack(race),
    o = s === 0 ? 1 : 0;
  return RANK[WEIGHT[race.friends[s]]] > RANK[WEIGHT[race.friends[o]]] || race.heights[s] > race.heights[o];
}

export function authoredRace(): Race {
  return { hooks: ['short', 'long'], friends: ['mouse', 'bear'], heights: [EVEN, EVEN] };
}

/* Twice as quick (level 8) ------------------------------------------------------------------------ */

export function authoredRequest(): Line {
  return {
    petHook: 'long',
    petFriend: 'bunny',
    petHeight: EVEN,
    hook: 'middle',
    friend: 'duck',
    height: EVEN,
    request: 'twice',
  };
}

/** The widest gap in phase (each swing's position over its own height) between two hooks released together, over the watch. */
export function widestApart(a: Hook, b: Hook, watch: number, step = 0.01): number {
  let most = 0;
  for (let t = 0; t <= watch + 1e-9; t += step)
    most = Math.max(most, Math.abs(phaseAt(a, 0, t) - phaseAt(b, 0, t)));
  return most;
}

/* Plans -------------------------------------------------------------------------------------------- */

export interface Plan {
  id: number;
  name: string;
  mode: 'push' | 'together' | 'predict';
  /** Lines (friends or pairs) in a round. */
  lines: number;
  /** Level 3: two swings, short and long. */
  two: boolean;
  /** Level 5: friends of different weights. */
  weights: boolean;
  /** Level 6: different release heights. */
  heights: boolean;
  /** Level 8: each line asks for twice, half or the same beat. */
  requests?: boolean;
}

export const PLANS: readonly Plan[] = [
  { id: 1, name: 'Push!', mode: 'push', lines: 3, two: false, weights: false, heights: false },
  {
    id: 2,
    name: 'Push when they come back',
    mode: 'push',
    lines: 3,
    two: false,
    weights: false,
    heights: false,
  },
  { id: 3, name: 'Short rope, long rope', mode: 'push', lines: 2, two: true, weights: false, heights: false },
  { id: 4, name: 'Swing together', mode: 'together', lines: 3, two: true, weights: false, heights: false },
  { id: 5, name: 'Heavy or light', mode: 'together', lines: 3, two: true, weights: true, heights: false },
  {
    id: 6,
    name: 'Big push, small push',
    mode: 'together',
    lines: 3,
    two: true,
    weights: true,
    heights: true,
  },
  {
    id: 7,
    name: 'Who comes back first?',
    mode: 'predict',
    lines: 3,
    two: true,
    weights: true,
    heights: true,
  },
  {
    id: 8,
    name: 'Twice as quick',
    mode: 'together',
    lines: 3,
    two: true,
    weights: false,
    heights: false,
    requests: true,
  },
];

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  // Level 7 sits between 3 and 4 for pre-K, and after 6 for school.
  prek: { min: 3, max: 7, order: [3, 7, 4] },
  school: { min: 4, max: 8 },
};

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.id === level) ?? PLANS[0];
}

/** The bell height for a plan's screen. */
export function bellFor(plan: Plan): number {
  return plan.two ? BELL_TWO : BELL_ONE;
}

/** One push line: the swings in play (left first), each with the friend riding it. */
export interface PushLine {
  swings: Swing[];
}

export type Round =
  | { kind: 'push'; lines: PushLine[]; goal: Goal }
  | { kind: 'together'; lines: Line[] }
  | { kind: 'predict'; lines: Race[] };

/** Each level's authored first line, from the definition's first rounds. */
export function authoredPush(plan: Plan): PushLine {
  if (plan.id === 1) return { swings: [stillSwing('middle', 'bunny')] };
  if (plan.id === 2) return { swings: [stillSwing('middle', 'duck', 1, 0)] };
  return { swings: [stillSwing('short', 'mouse'), stillSwing('long', 'frog')] };
}

export const BIG = 1;
export const SMALL = 0.45;
export const EVEN = 0.8;

export function authoredTogether(plan: Plan): Line {
  if (plan.id === 4)
    return {
      petHook: 'long',
      petFriend: 'bunny',
      petHeight: EVEN,
      hook: 'short',
      friend: 'bunny',
      height: EVEN,
    };
  if (plan.id === 5)
    return {
      petHook: 'middle',
      petFriend: 'mouse',
      petHeight: EVEN,
      hook: 'long',
      friend: 'bear',
      height: EVEN,
    };
  return { petHook: 'short', petFriend: 'duck', petHeight: SMALL, hook: 'long', friend: 'frog', height: BIG };
}

/** The tempting hook named by each authored line, and the side it gives. */
export const AUTHORED_TEMPT: Record<number, { hook: Hook; side: 'quicker' | 'slower' }> = {
  4: { hook: 'short', side: 'quicker' },
  5: { hook: 'long', side: 'slower' },
  6: { hook: 'long', side: 'slower' },
};

function seededPush(plan: Plan, rng: Rng, line: number): PushLine {
  if (plan.two) {
    const [a, b] = rng.shuffle([...FRIENDS]);
    const ropes: Hook[] =
      line % 2 === 1 ? ['long', 'short'] : rng.chance(0.5) ? ['short', 'long'] : ['long', 'short'];
    return { swings: [stillSwing(ropes[0], a), stillSwing(ropes[1], b)] };
  }
  return { swings: [stillSwing('middle', rng.pick(FRIENDS))] };
}

type LineKind = 'tempt' | 'pair' | 'any';

function seededTogether(plan: Plan, rng: Rng, kind: LineKind): Line {
  const lights = FRIENDS.filter((f) => WEIGHT[f] === 'light');
  const heavies = FRIENDS.filter((f) => WEIGHT[f] === 'heavy');
  let petHook = rng.pick(HOOKS);
  let hook = rng.pick(HOOKS.filter((h) => h !== petHook));
  const petFriend0 = rng.pick(FRIENDS);
  let petFriend = petFriend0,
    friend = petFriend0;
  if (plan.weights) {
    if (kind === 'tempt') {
      // The heavy friend on her swing, starting on a longer rope than the matching one.
      petHook = rng.pick(['short', 'middle'] as Hook[]);
      hook = rng.pick(HOOKS.filter((h) => LENGTH[h] > LENGTH[petHook]));
      petFriend = rng.pick(lights);
      friend = rng.pick(heavies);
    } else if (kind === 'pair') {
      [petFriend, friend] = rng.chance(0.5)
        ? [rng.pick(lights), rng.pick(heavies)]
        : [rng.pick(heavies), rng.pick(lights)];
    } else {
      friend = rng.pick(FRIENDS.filter((f) => WEIGHT[f] !== WEIGHT[petFriend]));
    }
  }
  let petHeight = EVEN,
    height = EVEN;
  if (plan.heights) [petHeight, height] = rng.chance(0.5) ? [SMALL, BIG] : [BIG, SMALL];
  return { petHook, petFriend, petHeight, hook, friend, height };
}

function seededRace(rng: Rng, tempt: boolean): Race {
  const [a, b] = rng.shuffle([...HOOKS]);
  const hooks: [Hook, Hook] = [a, b];
  const quick = firstBack({ hooks, friends: ['bunny', 'bunny'], heights: [EVEN, EVEN] });
  const slow = quick === 0 ? 1 : 0;
  const friends: [Friend, Friend] = ['bunny', 'bunny'];
  const heights: [number, number] = [EVEN, EVEN];
  if (tempt && rng.chance(0.5)) {
    // The heavier friend on the shorter rope.
    const heavyOne = rng.pick(FRIENDS.filter((f) => WEIGHT[f] === 'heavy'));
    friends[quick] = heavyOne;
    friends[slow] = rng.pick(FRIENDS.filter((f) => WEIGHT[f] === 'light'));
    if (rng.chance(0.5)) [heights[quick], heights[slow]] = [BIG, SMALL];
  } else if (tempt) {
    // The bigger push on the shorter rope.
    [friends[0], friends[1]] = rng.shuffle([...FRIENDS]);
    [heights[quick], heights[slow]] = [BIG, SMALL];
  } else {
    [friends[0], friends[1]] = rng.shuffle([...FRIENDS]);
    if (rng.chance(0.5)) [heights[0], heights[1]] = rng.chance(0.5) ? [BIG, SMALL] : [SMALL, BIG];
  }
  return { hooks, friends, heights };
}

function seededRequest(rng: Rng, request: Request): Line {
  const [petFriend, friend] = rng.shuffle([...FRIENDS]);
  let petHook: Hook;
  if (request === 'twice') petHook = 'long';
  else if (request === 'half') petHook = 'short';
  else petHook = rng.pick(HOOKS);
  const line: Line = { petHook, petFriend, petHeight: EVEN, hook: petHook, friend, height: EVEN, request };
  // Her rope starts on a wrong hook: for twice or half that may be the pet's own, the together habit.
  line.hook = rng.pick(HOOKS.filter((h) => h !== rightHook(line)));
  return line;
}

const lightHeavy = (l: Line) => {
  const w = [WEIGHT[l.friend], WEIGHT[l.petFriend]];
  return w.includes('light') && w.includes('heavy');
};
/** The "heavy goes slow" temptation: the heavy friend on her swing, starting on a longer rope than the matching one. */
export const heavyTempts = (l: Line) =>
  WEIGHT[l.friend] === 'heavy' && WEIGHT[l.petFriend] !== 'heavy' && LENGTH[l.hook] > LENGTH[l.petHook];

/** Does a round meet its plan's filter (the definition's table)? */
export function roundFits(plan: Plan, round: Round): boolean {
  if (round.kind === 'predict') {
    const races = round.lines;
    if (plan.mode !== 'predict' || races.length !== plan.lines) return false;
    if (races.some((r) => r.hooks[0] === r.hooks[1] || r.friends[0] === r.friends[1])) return false;
    return races.some(raceTempts) && new Set(races.map((r) => r.hooks.join())).size >= 2;
  }
  if (round.kind === 'push') {
    if (round.lines.length !== plan.lines) return false;
    return round.lines.every((l) => {
      if (!plan.two) return l.swings.length === 1 && l.swings[0].hook === 'middle';
      const hooks = l.swings.map((s) => s.hook).sort();
      return (
        l.swings.length === 2 &&
        hooks[0] === 'long' &&
        hooks[1] === 'short' &&
        period('long') / period('short') >= 1.4
      );
    });
  }
  const lines = round.lines;
  if (lines.length !== plan.lines) return false;
  if (lines.some((l) => l.hook === rightHook(l))) return false;
  if (plan.requests) {
    const asked = new Set(lines.map((l) => l.request ?? 'together'));
    return (asked.has('twice') || asked.has('half')) && asked.size >= 2;
  }
  if (lines.some((l) => l.request)) return false;
  if (new Set(lines.map(rightHook)).size < 2) return false;
  if (plan.id === 4 && lines.some((l) => l.friend !== l.petFriend)) return false;
  if (plan.id === 5 && (lines.filter(lightHeavy).length < 2 || !lines.some(heavyTempts))) return false;
  if (plan.heights) {
    if (lines.some((l) => l.height === l.petHeight)) return false;
    const differ = (l: Line) =>
      [l.friend !== l.petFriend, l.height !== l.petHeight, l.hook !== l.petHook].filter(Boolean).length;
    if (lines.some((l) => differ(l) < 2)) return false;
  }
  return true;
}

/** The fallback round, used only if 50 seeded tries all miss the filter (a test asserts it never happens). */
export function fallbackRound(plan: Plan): Round {
  if (plan.mode === 'predict') {
    return {
      kind: 'predict',
      lines: [
        authoredRace(),
        { hooks: ['long', 'middle'], friends: ['duck', 'pig'], heights: [EVEN, EVEN] },
        { hooks: ['middle', 'short'], friends: ['frog', 'cat'], heights: [SMALL, BIG] },
      ],
    };
  }
  if (plan.requests) {
    return {
      kind: 'together',
      lines: [
        authoredRequest(),
        {
          petHook: 'short',
          petFriend: 'frog',
          petHeight: EVEN,
          hook: 'short',
          friend: 'cat',
          height: EVEN,
          request: 'half',
        },
        {
          petHook: 'middle',
          petFriend: 'pig',
          petHeight: EVEN,
          hook: 'long',
          friend: 'mouse',
          height: EVEN,
          request: 'together',
        },
      ],
    };
  }
  if (plan.mode === 'push') {
    const lines = [authoredPush(plan)];
    while (lines.length < plan.lines)
      lines.push(
        plan.two
          ? { swings: [stillSwing('long', 'duck'), stillSwing('short', 'bear')] }
          : { swings: [stillSwing('middle', 'duck')] },
      );
    return { kind: 'push', lines, goal: 'bell' };
  }
  const first = authoredTogether(plan);
  const more: Line[] =
    plan.id === 4
      ? [
          { ...first, petHook: 'short', hook: 'long', petFriend: 'duck', friend: 'duck' },
          { ...first, petHook: 'middle', hook: 'short', petFriend: 'frog', friend: 'frog' },
        ]
      : [
          {
            petHook: 'short',
            petFriend: 'mouse',
            petHeight: plan.heights ? BIG : EVEN,
            hook: 'long',
            friend: 'bear',
            height: plan.heights ? SMALL : EVEN,
          },
          {
            petHook: 'long',
            petFriend: 'bear',
            petHeight: plan.heights ? SMALL : EVEN,
            hook: 'middle',
            friend: 'duck',
            height: plan.heights ? BIG : EVEN,
          },
        ];
  return { kind: 'together', lines: [first, ...more] };
}

/**
 * A round from the plan, seeded. `authored` puts the level's authored first line first (each level's first round of a
 * session). Tries at most 50 seeded rounds against the plan's filter, then the fallback; `fellBack` says which. A push
 * round's leaf goal is seeded too, except that the authored round keeps the bell.
 */
export function makeRound(plan: Plan, rng: Rng, authored: boolean): { round: Round; fellBack: boolean } {
  const goal: Goal = authored ? 'bell' : rng.pick(GOALS);
  for (let attempt = 0; attempt < 50; attempt++) {
    let round: Round;
    if (plan.mode === 'predict') {
      // Every round holds a tempting race; the authored first race is not one, so a seeded one is.
      const kinds = authored ? [false, ...rng.shuffle([true, false])] : rng.shuffle([true, false, false]);
      const lines: Race[] = [];
      for (let i = 0; i < plan.lines; i++)
        lines.push(i === 0 && authored ? authoredRace() : seededRace(rng, kinds[i]));
      round = { kind: 'predict', lines };
    } else if (plan.requests) {
      // Both requests and the plain together line, in a seeded order; the authored first line is "twice".
      const asks: Request[] = authored
        ? ['twice', ...rng.shuffle(['half', 'together'] as Request[])]
        : rng.shuffle(['twice', 'half', 'together'] as Request[]);
      const lines: Line[] = [];
      for (let i = 0; i < plan.lines; i++)
        lines.push(i === 0 && authored ? authoredRequest() : seededRequest(rng, asks[i]));
      round = { kind: 'together', lines };
    } else if (plan.mode === 'push') {
      const lines: PushLine[] = [];
      for (let i = 0; i < plan.lines; i++)
        lines.push(i === 0 && authored ? authoredPush(plan) : seededPush(plan, rng, i));
      round = { kind: 'push', lines, goal };
    } else {
      // Level 5–6 rounds hold one tempting line and one more light-and-heavy pair; the authored first line is the tempting one.
      const kinds: LineKind[] = authored
        ? ['tempt', ...rng.shuffle(['pair', 'any'] as LineKind[])]
        : rng.shuffle(['tempt', 'pair', 'any'] as LineKind[]);
      const lines: Line[] = [];
      for (let i = 0; i < plan.lines; i++)
        lines.push(i === 0 && authored ? authoredTogether(plan) : seededTogether(plan, rng, kinds[i]));
      round = { kind: 'together', lines };
    }
    if (roundFits(plan, round)) return { round, fellBack: false };
  }
  const round = fallbackRound(plan);
  return { round: round.kind === 'push' ? { ...round, goal } : round, fellBack: true };
}

/* Layout ------------------------------------------------------------------------------------------- */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Pt {
  x: number;
  y: number;
}

/** The pet's corner at the bottom left, and the shell's corner buttons (as `petCorner` and `landButtons` in lands.ts). */
export const petCorner = (v: View): Rect => ({ x: 0, y: v.h - 205, w: 200, h: 205 });
export const shellButtons = (v: View): Rect[] => [
  { x: 0, y: 0, w: 130, h: 130 },
  { x: v.w - 130, y: 0, w: 130, h: 130 },
];
/** A friend on the seat, around the seat point: half its width, and how far above and below it reaches. */
export const FRIEND_HALF = 60;
export const FRIEND_UP = 155;
export const FRIEND_DOWN = 12;
/** The hook targets at levels 4–6. */
export const HOOK_R = 60;
/** The short hook sits this far forward of the others, so the three targets never overlap. */
export const SHORT_SHIFT = 70;
/** The apple's basket: its middle this far above the bottom of the view, and its half-size. */
export const BASKET_UP = 62;
export const BASKET_HALF = { w: 46, h: 30 };

export interface Column {
  /** Pivot of each hook. */
  pivot: Record<Hook, Pt>;
  /** Where the mitten pops out, behind the seat at the back of the arc, for each hook. */
  mitten: Record<Hook, Pt>;
  /** The bell, above the friend's head at the front of the arc at the bell height, for each hook. */
  bell: Record<Hook, Pt>;
  /** Where the apple goal's basket sits on the grass, under the bell. */
  basket: Record<Hook, Pt>;
  /** Her push target (levels 1–3). */
  zone: Rect;
}

export interface SwingLayout {
  /** Units of rope for length 4 (the long rope). */
  scale: number;
  seatY: number;
  bell: number;
  columns: Column[];
}

export function ropeOf(layout: SwingLayout, hook: Hook): number {
  return (LENGTH[hook] / 4) * layout.scale;
}

/** The seat point on a hook at an angle, in degrees. */
export function seatAt(layout: SwingLayout, col: Column, hook: Hook, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  const L = ropeOf(layout, hook);
  return { x: col.pivot[hook].x + L * Math.sin(a), y: col.pivot[hook].y + L * Math.cos(a) };
}

/** The box a friend on the seat covers at that point. */
export function friendBox(p: Pt): Rect {
  return { x: p.x - FRIEND_HALF, y: p.y - FRIEND_UP, w: FRIEND_HALF * 2, h: FRIEND_UP + FRIEND_DOWN };
}

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export { overlaps as rectsOverlap };

/**
 * Where one or two swings hang in a view: seats all at one height, hooks at different heights above them, each swing in its
 * own column, every arc at the bell height clear of the pet's corner and the shell's buttons. Same line on every view.
 */
export function swingLayout(swings: 1 | 2, v: View): SwingLayout {
  const bell = swings === 1 ? BELL_ONE : BELL_TWO;
  const seatY = v.h - 150;
  const pet = petCorner(v);
  const x0 = seatY + FRIEND_DOWN > pet.y ? pet.x + pet.w + 10 : 20;
  const x1 = v.w - 20;
  const half = (x1 - x0) / (2 * swings);
  const sin = Math.sin((bell * Math.PI) / 180);
  const scale = Math.min(swings === 1 ? 560 : 460, seatY - 60, (half - FRIEND_HALF - 10) / sin);
  const columns: Column[] = [];
  for (let i = 0; i < swings; i++) {
    // One swing stands in the middle when its widest arc clears the pet; otherwise each swing takes its column's middle.
    const cx =
      swings === 1
        ? Math.min(
            x1 - FRIEND_HALF - 10 - sin * scale,
            Math.max(v.w / 2, x0 + FRIEND_HALF + 10 + sin * scale),
          )
        : x0 + half * (2 * i + 1);
    const pivot = {} as Record<Hook, Pt>;
    for (const h of HOOKS)
      pivot[h] = { x: cx + (h === 'short' ? SHORT_SHIFT : 0), y: seatY - (LENGTH[h] / 4) * scale };
    const col: Column = {
      pivot,
      mitten: {} as Record<Hook, Pt>,
      bell: {} as Record<Hook, Pt>,
      basket: {} as Record<Hook, Pt>,
      zone: { x: 0, y: 0, w: 0, h: 0 },
    };
    columns.push(col);
  }
  const layout: SwingLayout = { scale, seatY, bell, columns };
  for (const [i, col] of columns.entries()) {
    for (const h of HOOKS) {
      const back = seatAt(layout, col, h, -bell);
      const front = seatAt(layout, col, h, bell);
      col.mitten[h] = { x: back.x - FRIEND_HALF + 10, y: back.y - 40 };
      col.bell[h] = { x: front.x + 20, y: front.y - FRIEND_UP - 26 };
      col.basket[h] = { x: col.bell[h].x, y: v.h - BASKET_UP };
    }
    // Push targets: the whole play area under the shell's buttons for one swing; each swing's half, split at the midline.
    if (swings === 1) col.zone = { x: 0, y: 130, w: v.w, h: v.h - 130 };
    else {
      const mid = (columns[0].pivot.middle.x + columns[1].pivot.middle.x) / 2;
      col.zone =
        i === 0 ? { x: 0, y: 130, w: mid, h: v.h - 130 } : { x: mid, y: 130, w: v.w - mid, h: v.h - 130 };
    }
  }
  return layout;
}

/** Level 8's request strip, under the pet's swing (column 0). */
export function requestStrip(L: SwingLayout): Rect {
  return { x: L.columns[0].pivot.middle.x - 100, y: L.seatY + 32, w: 200, h: 60 };
}

/** Level 7's paw marker over a friend on the seat at `seat`: its middle, radius 30. */
export const MARK_R = 30;
export function markerAt(seat: Pt, friend: Friend): Pt {
  return { x: seat.x, y: seat.y - friendHeight(friend) - 40 };
}

/** The three hook targets of her swing (levels 4–6), centered on each pivot. */
export function hookTargets(col: Column): Record<Hook, Pt & { r: number }> {
  const out = {} as Record<Hook, Pt & { r: number }>;
  for (const h of HOOKS) out[h] = { ...col.pivot[h], r: HOOK_R };
  return out;
}

/* Bot ---------------------------------------------------------------------------------------------- */

/** Which swing of a push line the bot (and the level 1–3 hint) pushes next: the one furthest from its bell. */
export function nextToPush(swings: readonly Swing[]): number {
  let best = -1;
  for (const [i, s] of swings.entries()) if (!s.rung && (best < 0 || s.steps < swings[best].steps)) best = i;
  return best;
}
