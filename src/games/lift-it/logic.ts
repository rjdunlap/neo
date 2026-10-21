import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/*
 * Lift It's rules: an ideal pulley stated as a toy. Ropes and wheels weigh nothing and nothing rubs; the pull a crate needs
 * is its weight over the strands that hold it, and the rope comes that many times as far. See docs/definitions/lift-it.md.
 */

export type Rig = 'direct' | 'fixed' | 'movable' | 'both';
export const RIGS: readonly Rig[] = ['direct', 'fixed', 'movable', 'both'];
export type HookId = 'branch' | 'crate';
export interface Hooks { branch: boolean; crate: boolean }

export type Friend = 'bunny' | 'duck' | 'mouse' | 'bear' | 'frog';
export const FRIENDS: readonly Friend[] = ['bunny', 'duck', 'mouse', 'bear', 'frog'];

/** Who a request at levels 5–6 names to do the pulling. */
export type Ask = 'ground' | 'ledge';

/** Drag units per knot of rope. */
export const KNOT = 120;

export function rigOf(hooks: Hooks): Rig {
  if (hooks.branch && hooks.crate) return 'both';
  if (hooks.crate) return 'movable';
  if (hooks.branch) return 'fixed';
  return 'direct';
}

export function hooksOf(rig: Rig): Hooks {
  return { branch: rig === 'fixed' || rig === 'both', crate: rig === 'movable' || rig === 'both' };
}

export function wheels(rig: Rig): number {
  const h = hooksOf(rig);
  return Number(h.branch) + Number(h.crate);
}

/** Strands holding the crate: two once a wheel hangs on it. */
export function ratio(rig: Rig): 1 | 2 {
  return rig === 'movable' || rig === 'both' ? 2 : 1;
}

/** Which way the hand moves: up on the crate or at the ledge, down at the ground. */
export function pullDirection(rig: Rig): 'up' | 'down' {
  return rig === 'direct' || rig === 'movable' ? 'up' : 'down';
}

/** Where the rope's end is, and so who pulls it. */
export function pullersAt(rig: Rig): Ask {
  return rig === 'movable' ? 'ledge' : 'ground';
}

export interface Line {
  /** Weight in stones, 1–6. */
  w: number;
  /** Ledge height in rungs, 1–3. */
  h: number;
  /** Friends on the ground and on the ledge (beside the one waiting). */
  g: number;
  l: number;
  /** The friend waiting on the ledge, and the kind of friend who pulls. */
  waiting: Friend;
  puller: Friend;
  /** Levels 5–6: who the request says pulls. */
  ask?: Ask;
}

export function paws(rig: Rig, line: Line): number {
  return Math.ceil(line.w / ratio(rig));
}

export function pullers(rig: Rig, line: Line): number {
  return pullersAt(rig) === 'ledge' ? line.l : line.g;
}

export function works(rig: Rig, line: Line): boolean {
  return pullers(rig, line) >= paws(rig, line);
}

/** Knots of rope that pass the hand for the whole haul. */
export function travel(rig: Rig, line: Line): number {
  return line.h * ratio(rig);
}

export function workingRigs(line: Line, among: readonly Rig[] = RIGS): Rig[] {
  return among.filter((r) => works(r, line));
}

/** Does a rig end at the friends a request names (always true without a request)? */
export function endsRight(rig: Rig, line: Line): boolean {
  if (!line.ask) return true;
  return pullersAt(rig) === line.ask && rig !== 'direct';
}

/**
 * The rig the hint shows and the bot builds: a working rig among `among` that ends at the asked pullers, with the fewest
 * wheels; pushing by hand only when nothing else works, and ties go to the branch wheel.
 */
export function bestRig(line: Line, among: readonly Rig[] = RIGS): Rig | null {
  const ok = among.filter((r) => works(r, line) && endsRight(r, line));
  const order: Rig[] = ['fixed', 'movable', 'both', 'direct'];
  ok.sort((a, b) => (a === 'direct' ? 9 : wheels(a)) - (b === 'direct' ? 9 : wheels(b)) || order.indexOf(a) - order.indexOf(b));
  return ok[0] ?? null;
}

/* Hauling ----------------------------------------------------------------------------------------- */

export interface Haul {
  /** Rungs the crate has risen, 0 to h. */
  rung: number;
  /** Knots of rope pulled so far. */
  knots: number;
}

/**
 * A pull of `along` drag units in the rig's pull direction (negative is the wrong way). A working rig raises the crate
 * `along / KNOT / ratio` rungs, never past the ledge and never down; anything else changes nothing.
 */
export function applyPull(haul: Haul, rig: Rig, line: Line, along: number): Haul {
  if (along <= 0 || !works(rig, line) || haul.rung >= line.h) return haul;
  const rung = Math.min(line.h, haul.rung + along / KNOT / ratio(rig));
  return { rung, knots: rung * ratio(rig) };
}

/* Plans ------------------------------------------------------------------------------------------- */

export interface Plan {
  id: number;
  name: string;
  /** Hooks a wheel can hang on, and wheels in the tray. */
  hooks: readonly HookId[];
  tray: number;
  /** Level 1: the rig is built and stays. */
  prebuilt?: Rig;
  /** Knots tick past a counter (levels 4–6). */
  counter: boolean;
  /** Questions before the haul: a free knots guess (4), or paws and knots cards (6). */
  ask: 'none' | 'knots' | 'numbers';
  /** Levels 5–6: a request names the pullers, and misses count. */
  request: boolean;
  lines: number;
}

export const PLANS: readonly Plan[] = [
  { id: 1, name: 'Pull!', hooks: [], tray: 0, prebuilt: 'fixed', counter: false, ask: 'none', request: false, lines: 3 },
  { id: 2, name: 'Push or pull', hooks: ['branch'], tray: 1, counter: false, ask: 'none', request: false, lines: 3 },
  { id: 3, name: 'Too heavy', hooks: ['branch', 'crate'], tray: 2, counter: false, ask: 'none', request: false, lines: 3 },
  { id: 4, name: 'Twice the rope', hooks: ['branch', 'crate'], tray: 2, counter: true, ask: 'knots', request: false, lines: 3 },
  { id: 5, name: 'Who pulls?', hooks: ['branch', 'crate'], tray: 2, counter: false, ask: 'none', request: true, lines: 3 },
  { id: 6, name: 'By the numbers', hooks: ['branch', 'crate'], tray: 2, counter: true, ask: 'numbers', request: true, lines: 3 },
];

export function planFor(level: number): Plan {
  return PLANS.find((p) => p.id === level) ?? PLANS[0];
}

/** Whether a level counts misses (5–6 only; levels 1–4 adapt through hints alone). */
export const countsMisses = (plan: Plan) => plan.request;

/** The rigs she can make at a plan: the prebuilt one, or what its hooks allow; no hands-only push once a request names a rope. */
export function rigsFor(plan: Plan): Rig[] {
  if (plan.prebuilt) return [plan.prebuilt];
  const all = RIGS.filter((r) => {
    const h = hooksOf(r);
    return (!h.branch || plan.hooks.includes('branch')) && (!h.crate || plan.hooks.includes('crate'));
  });
  return plan.request ? all.filter((r) => r !== 'direct') : all;
}

/** Does one line meet its plan's filter (the definition's table)? */
export function lineFits(plan: Plan, line: Line): boolean {
  const { w, h, g, l } = line;
  if (line.waiting === line.puller) return false;
  if (w < 1 || w > 6 || h < 1 || h > 3 || g < 0 || g > 3 || l < 0 || l > 2) return false;
  if (!!line.ask !== plan.request) return false;
  const among = rigsFor(plan);
  if (!bestRig(line, among)) return false;
  switch (plan.id) {
    case 1:
      return w === 1 && g === 1 && h === 2 && works('fixed', line);
    case 2:
      return w === 2 && g === 2 && h === 2 && l === 0 && works('direct', line) && works('fixed', line) && paws('direct', line) === paws('fixed', line);
    case 3:
      return w === 4 && g === 2 && l === 2 && h === 2 && !works('direct', line) && !works('fixed', line) && works('movable', line) && works('both', line) && l >= paws('movable', line);
    case 4:
      return w >= 2 && w <= 4 && h <= 2 && g >= 1;
    case 5:
    case 6: {
      if (plan.id === 6 && (w < 3 || h < 2)) return false;
      if (line.ask === 'ground' && (works('fixed', line) || !works('both', line))) return false;
      if (line.ask === 'ledge' && (!works('movable', line) || works('both', line))) return false;
      // Level 6's paws card is exact: every rig that answers the request divides the weight evenly.
      if (plan.id === 6 && among.some((r) => works(r, line) && endsRight(r, line) && w % ratio(r) !== 0)) return false;
      return true;
    }
  }
  return false;
}

/** Does a whole round meet its plan's filter? */
export function roundFits(plan: Plan, lines: readonly Line[]): boolean {
  if (lines.length !== plan.lines || !lines.every((l) => lineFits(plan, l))) return false;
  if (plan.id === 4) {
    // At least one line a one-strand rig can lift, and one only two strands can.
    const among = rigsFor(plan);
    if (!lines.some((l) => workingRigs(l, among).some((r) => ratio(r) === 1))) return false;
    if (!lines.some((l) => !workingRigs(l, among).some((r) => ratio(r) === 1))) return false;
  }
  if (plan.request && !lines.some((l) => l.ask === 'ground') ) return false;
  if (plan.id === 6 && !lines.some((l) => l.w === 6 && l.g === 3)) return false;
  return true;
}

/** Each level's authored first lines, from the definition's first rounds. */
export function authored(plan: Plan): Line[] {
  switch (plan.id) {
    case 1:
      return [{ w: 1, h: 2, g: 1, l: 0, waiting: 'bunny', puller: 'duck' }];
    case 2:
      return [{ w: 2, h: 2, g: 2, l: 0, waiting: 'frog', puller: 'mouse' }];
    case 3:
      return [{ w: 4, h: 2, g: 2, l: 2, waiting: 'bunny', puller: 'bear' }];
    case 4:
      return [{ w: 4, h: 1, g: 2, l: 2, waiting: 'duck', puller: 'bear' }];
    case 5:
      return [
        { w: 4, h: 2, g: 3, l: 0, waiting: 'bunny', puller: 'mouse', ask: 'ground' },
        { w: 2, h: 2, g: 0, l: 2, waiting: 'duck', puller: 'frog', ask: 'ledge' },
      ];
    default:
      return [{ w: 6, h: 3, g: 3, l: 0, waiting: 'frog', puller: 'bear', ask: 'ground' }];
  }
}

function seededLine(plan: Plan, rng: Rng, want?: Ask): Line {
  const [waiting, puller] = rng.shuffle([...FRIENDS]);
  const base = { waiting, puller };
  switch (plan.id) {
    case 1:
      return { ...base, w: 1, h: 2, g: 1, l: 0 };
    case 2:
      return { ...base, w: 2, h: 2, g: 2, l: 0 };
    case 3:
      return { ...base, w: 4, h: 2, g: 2, l: 2 };
    case 4:
      return { ...base, w: rng.int(2, 4), h: rng.int(1, 2), g: rng.int(1, 3), l: rng.int(0, 2) };
    default: {
      const ask = want ?? (rng.chance(0.5) ? 'ground' : 'ledge');
      const w = plan.id === 6 ? rng.int(3, 6) : rng.int(2, 5);
      const h = plan.id === 6 ? rng.int(2, 3) : rng.int(1, 3);
      return { ...base, w, h, g: rng.int(0, 3), l: rng.int(0, 2), ask };
    }
  }
}

/** The fallback round, used only if every seeded try misses the filter (a test asserts it never happens over 500 seeds). */
export function fallbackRound(plan: Plan): Line[] {
  const first = authored(plan);
  const more: Record<number, Line[]> = {
    1: [{ w: 1, h: 2, g: 1, l: 0, waiting: 'frog', puller: 'bear' }, { w: 1, h: 2, g: 1, l: 0, waiting: 'mouse', puller: 'bunny' }],
    2: [{ w: 2, h: 2, g: 2, l: 0, waiting: 'bear', puller: 'duck' }, { w: 2, h: 2, g: 2, l: 0, waiting: 'bunny', puller: 'frog' }],
    3: [{ w: 4, h: 2, g: 2, l: 2, waiting: 'mouse', puller: 'frog' }, { w: 4, h: 2, g: 2, l: 2, waiting: 'duck', puller: 'bunny' }],
    4: [{ w: 2, h: 2, g: 2, l: 1, waiting: 'mouse', puller: 'frog' }, { w: 3, h: 2, g: 3, l: 2, waiting: 'bear', puller: 'bunny' }],
    5: [{ w: 3, h: 3, g: 2, l: 1, waiting: 'frog', puller: 'bear', ask: 'ground' }],
    6: [{ w: 4, h: 2, g: 0, l: 2, waiting: 'mouse', puller: 'duck', ask: 'ledge' }, { w: 4, h: 3, g: 2, l: 0, waiting: 'bunny', puller: 'frog', ask: 'ground' }],
  };
  return [...first, ...more[plan.id]].slice(0, plan.lines);
}

/**
 * A round from the plan, seeded. `first` leads with the level's authored lines (each level's first round of a session).
 * Each line gets up to 50 seeded tries against its filter, the round up to 50 tries against the round's, then the fallback.
 */
export function makeRound(plan: Plan, rng: Rng, first: boolean): { lines: Line[]; fellBack: boolean } {
  for (let attempt = 0; attempt < 50; attempt++) {
    const lines: Line[] = first ? authored(plan).slice(0, plan.lines) : [];
    // Request levels: one ground line at least, then a mix.
    const wants: (Ask | undefined)[] = plan.request ? rng.shuffle<Ask>(['ground', 'ledge', rng.chance(0.5) ? 'ground' : 'ledge']) : [];
    for (let i = lines.length; i < plan.lines; i++) {
      let line: Line | null = null;
      for (let t = 0; t < 50 && !line; t++) {
        const want = wants[i];
        const c = seededLine(plan, rng, want);
        if (plan.id === 6 && i === plan.lines - 1 && !lines.some((l) => l.w === 6 && l.g === 3)) Object.assign(c, { w: 6, g: 3, ask: 'ground' });
        if (lineFits(plan, c)) line = c;
      }
      if (!line) break;
      lines.push(line);
    }
    if (roundFits(plan, lines)) return { lines, fellBack: false };
  }
  return { lines: fallbackRound(plan), fellBack: true };
}

/* Number cards (levels 4 and 6) --------------------------------------------------------------------- */

/** The knots cards: one, two and three times the height, so the two ratios always give different right cards. */
export function knotsCards(line: Line): number[] {
  return [line.h, 2 * line.h, 3 * line.h];
}

/** Level 4's guess: the travel of a one-strand and a two-strand rig. */
export function guessCards(line: Line): number[] {
  return [line.h, 2 * line.h];
}

/** The paws cards for a rig: the right count and two others (the crate's whole weight, half, one fewer, one more). */
export function pawsCards(rig: Rig, line: Line): number[] {
  const a = paws(rig, line);
  const out = [a];
  for (const c of [line.w, line.w / 2, a - 1, a + 1, a + 2]) {
    if (out.length >= 3) break;
    if (Number.isInteger(c) && c >= 1 && !out.includes(c)) out.push(c);
  }
  return out.sort((x, y) => x - y);
}

/* Layout ------------------------------------------------------------------------------------------- */

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

export const petCorner = (v: View): Rect => ({ x: 0, y: v.h - 205, w: 200, h: 205 });
export const shellButtons = (v: View): Rect[] => [{ x: 0, y: 0, w: 130, h: 130 }, { x: v.w - 130, y: 0, w: 130, h: 130 }];

export const CRATE_W = 150;
export const CRATE_H = 110;
export const WHEEL_R = 50;
/** Hit radii: hooks 120 across, the handle 130, tray wheels 120. Cards are 120 square. */
export const HOOK_HIT = 60;
export const HANDLE_HIT = 65;
export const TRAY_HIT = 60;
export const CARD = 120;
/** A friend's box around its feet, at the drawn scale. */
export const FRIEND_HALF = 38;
export const FRIEND_UP = 100;
export const BRANCH_Y = 40;

export interface LiftLayout {
  groundY: number;
  rung: number;
  /** The crate's centre line. */
  cx: number;
  trunkX: number;
  /** The ring the standing end ties to, and the branch wheel's centre. */
  ring: Pt;
  branchHook: Pt;
  groundHandle: Pt;
  tray: Pt[];
  /** The ground friends' feet. */
  ground: Pt[];
}

export function liftLayout(v: View): LiftLayout {
  const groundY = v.h - 128;
  const rung = Math.min(170, (groundY - (BRANCH_Y + 150 + CRATE_H)) / 3);
  const cx = Math.max(290, Math.round(v.w * 0.4));
  return {
    groundY,
    rung,
    cx,
    trunkX: v.w - 70,
    ring: { x: cx - WHEEL_R, y: BRANCH_Y + 14 },
    branchHook: { x: cx + 2 * WHEEL_R, y: BRANCH_Y + 60 },
    groundHandle: { x: cx + 3 * WHEEL_R, y: groundY - 190 },
    tray: [{ x: v.w - 200, y: v.h - 64 }, { x: v.w - 70, y: v.h - 64 }],
    ground: [0, 1, 2].map((i) => ({ x: cx + 230 + i * 80, y: groundY })),
  };
}

/** The ledge's top for a height. */
export const ledgeY = (L: LiftLayout, h: number) => L.groundY - h * L.rung;
/** The crate's bottom when it has risen `rung` rungs. */
export const crateBottom = (L: LiftLayout, rung: number) => L.groundY - rung * L.rung;
/** The crate wheel's centre (and its hook) when the crate has risen `rung` rungs. */
export const crateHook = (L: LiftLayout, rung: number): Pt => ({ x: L.cx, y: crateBottom(L, rung) - CRATE_H - WHEEL_R });
/** The ledge handle and the two ledge pullers below it; the waiting friend at the ledge's lip. */
export function ledgeSpots(L: LiftLayout, v: View, h: number): { handle: Pt; pullers: Pt[]; waiting: Pt; from: number } {
  const y = ledgeY(L, h);
  const hx = Math.min(L.cx + 400, v.w - 110);
  return { handle: { x: hx, y: y - 170 }, pullers: [{ x: hx - 40, y }, { x: hx + 40, y }], waiting: { x: L.cx + 240, y }, from: L.cx + 200 };
}

/** Where the handle sits for a rig before a stroke (the crate's middle for a push). */
export function handleAt(L: LiftLayout, v: View, rig: Rig, line: Line, rung: number): Pt {
  if (rig === 'direct') return { x: L.cx, y: crateBottom(L, rung) - CRATE_H / 2 };
  if (rig === 'movable') return ledgeSpots(L, v, line.h).handle;
  return L.groundHandle;
}

/** The card row, centred in the open sky left of the tree. */
export function cardSpots(v: View, n: number): Pt[] {
  const gap = 30;
  const x0 = v.w / 2 - ((n - 1) * (CARD + gap)) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (CARD + gap), y: Math.round(v.h * 0.42) }));
}

export const rectsOverlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const circleBox = (p: Pt, r: number): Rect => ({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r });
export const friendBox = (p: Pt): Rect => ({ x: p.x - FRIEND_HALF, y: p.y - FRIEND_UP, w: FRIEND_HALF * 2, h: FRIEND_UP + 4 });
