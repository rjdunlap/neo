import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import type { VOICE } from './voice';
export type Item =
  | 'ball'
  | 'leaf'
  | 'carrot'
  | 'berry'
  | 'shell'
  | 'ribbon'
  | 'flower'
  | 'acorn'
  | 'star'
  | 'kite'
  /** Level 6's two shells on a string: the stall's flat price, one picture, never a count or a balance. */
  | 'purse';
export type Friend = 'bunny' | 'duck' | 'otter' | 'frog';
export interface Trader {
  id: Friend;
  hold: Item;
  want: Item;
  done: boolean;
}
export interface Slot {
  hold: Item;
  active: boolean;
}
/** Level 6's shell stall: three fixed shelf places (null is empty), shut at stage 1 and open at stage 2. */
export interface Stall {
  open: boolean;
  shelf: (Item | null)[];
}
export interface Frame {
  stage: number;
  basket: Slot[];
  friends: Trader[];
  rewards: Item[];
  stall?: Stall;
}
export interface State {
  frame: Frame;
  history: Frame[];
}
export interface Case {
  level: number;
  id: string;
  stages: Frame[];
  goal?: Item;
}
export type Action =
  | { from: Friend | number; to: Friend }
  | { undo: true }
  /** Basket object onto the open stall: it goes to the first empty shelf place and the purse comes back. */
  | { sell: true }
  /** The purse onto shelf place `buy`: that good comes to the basket. */
  | { buy: number };
/** Undo holds at most three entries from level 5 on; level 6's sell-and-buy can cycle, so it drops the oldest. */
export const UNDO_CAP = 3;
const f = (id: Friend, hold: Item, want: Item): Trader => ({ id, hold, want, done: false });
const frame = (basket: Item[], friends: Trader[], stall?: Stall): Frame => ({
  stage: 0,
  basket: basket.map((hold) => ({ hold, active: true })),
  friends,
  rewards: [],
  ...(stall ? { stall } : {}),
});
/** Level 6: the same chain twice, the stall shut and then open with two goods on its shelf. */
const stallStages = (basket: Item, chain: Trader[], shelf: [Item, Item]): Frame[] => [
  frame([basket], structuredClone(chain), { open: false, shelf: [null, null, null] }),
  { ...frame([basket], structuredClone(chain), { open: true, shelf: [...shelf, null] }), stage: 1 },
];
export const CASES: readonly Case[] = [
  {
    level: 1,
    id: 'visits',
    stages: [
      frame(['ball', 'leaf'], [f('bunny', 'carrot', 'ball')]),
      frame(['berry', 'shell'], [f('duck', 'ribbon', 'berry')]),
      frame(['flower', 'acorn'], [f('otter', 'star', 'flower')]),
    ],
  },
  {
    level: 2,
    id: 'requests',
    stages: [frame(['ball', 'leaf'], [f('bunny', 'carrot', 'ball'), f('duck', 'ribbon', 'leaf')])],
  },
  {
    level: 3,
    id: 'pairs',
    stages: [
      frame(
        [],
        [
          f('otter', 'berry', 'shell'),
          f('duck', 'shell', 'berry'),
          f('bunny', 'leaf', 'flower'),
          f('frog', 'flower', 'leaf'),
        ],
      ),
    ],
  },
  {
    level: 4,
    id: 'kite',
    goal: 'kite',
    stages: [frame(['leaf'], [f('duck', 'shell', 'leaf'), f('frog', 'kite', 'shell')])],
  },
  {
    level: 4,
    id: 'flower',
    goal: 'flower',
    stages: [frame(['acorn'], [f('otter', 'ribbon', 'acorn'), f('bunny', 'flower', 'ribbon')])],
  },
  {
    level: 5,
    id: 'kite3',
    goal: 'kite',
    stages: [
      frame(
        ['acorn'],
        [
          f('otter', 'ribbon', 'acorn'),
          f('bunny', 'berry', 'ribbon'),
          f('frog', 'kite', 'berry'),
          f('duck', 'ball', 'ribbon'),
        ],
      ),
    ],
  },
  {
    level: 5,
    id: 'star3',
    goal: 'star',
    stages: [
      frame(
        ['leaf'],
        [
          f('duck', 'carrot', 'leaf'),
          f('frog', 'ball', 'carrot'),
          f('otter', 'star', 'ball'),
          f('bunny', 'flower', 'leaf'),
        ],
      ),
    ],
  },
  {
    level: 6,
    id: 'kite-stall',
    goal: 'kite',
    stages: stallStages(
      'acorn',
      [f('otter', 'ribbon', 'acorn'), f('bunny', 'flower', 'ribbon'), f('frog', 'kite', 'flower')],
      ['kite', 'ball'],
    ),
  },
  {
    level: 6,
    id: 'star-stall',
    goal: 'star',
    stages: stallStages(
      'leaf',
      [f('duck', 'carrot', 'leaf'), f('frog', 'berry', 'carrot'), f('otter', 'star', 'berry')],
      ['star', 'ball'],
    ),
  },
];
const copy = <T>(v: T): T => structuredClone(v);
export function roundFor(level: number, rng: Rng): Case {
  const c = copy(rng.pick(CASES.filter((c) => c.level === level)));
  if (level === 1) rng.shuffle(c.stages);
  for (const s of c.stages) {
    rng.shuffle(s.friends);
    rng.shuffle(s.basket);
  }
  // Level 6's second stage repeats the first with the same panels, so the two routes compare like with like.
  if (c.stages[1]?.stall) c.stages[1].friends = structuredClone(c.stages[0].friends);
  return c;
}
export const start = (c: Case): State => ({ frame: copy(c.stages[0]), history: [] });
/** A stage is over when every friend has traded or, in a goal case, the basket holds the goal (a side friend may stay). */
const stageDone = (c: Case, f: Frame) =>
  c.goal ? f.basket[0].hold === c.goal : f.friends.every((t) => t.done);
export function goal(c: Case, s: State) {
  return s.frame.stage === c.stages.length - 1 && stageDone(c, s.frame);
}
/** Level 5's dead end: nobody still trading wants what the basket carries, so only Undo leads on. */
export function deadEnd(c: Case, s: State): boolean {
  if (!c.goal || goal(c, s) || s.frame.stall?.open) return false;
  const carried = s.frame.basket[0].hold;
  return !s.frame.friends.some((f) => !f.done && f.want === carried);
}
export function accepted(c: Case, s: State, a: Action): boolean {
  if (goal(c, s)) return false;
  if ('undo' in a) return s.history.length > 0;
  const stall = s.frame.stall,
    carried = s.frame.basket[0]?.hold;
  if ('sell' in a) return !!stall?.open && carried !== 'purse' && stall.shelf.includes(null);
  if ('buy' in a) return !!stall?.open && carried === 'purse' && !!stall.shelf[a.buy];
  const t = s.frame.friends.find((f) => f.id === a.to && !f.done);
  if (!t) return false;
  if (typeof a.from === 'number')
    return c.level !== 3 && !!s.frame.basket[a.from]?.active && s.frame.basket[a.from].hold === t.want;
  const f = s.frame.friends.find((f) => f.id === a.from && !f.done);
  return c.level === 3 && !!f && f !== t && f.hold === t.want && t.hold === f.want;
}
/** A pure transaction. Automatic stage advance costs no action; its pre-state remains exactly undoable. */
export function step(c: Case, s: State, a: Action): State {
  if (!accepted(c, s, a)) return s;
  if ('undo' in a) return { frame: copy(s.history.at(-1)!), history: copy(s.history.slice(0, -1)) };
  const n = copy(s),
    b = n.frame;
  if ('sell' in a || 'buy' in a) {
    const shelf = b.stall!.shelf,
      place = 'sell' in a ? shelf.indexOf(null) : a.buy;
    [b.basket[0].hold, shelf[place]] = [
      'sell' in a ? 'purse' : shelf[place]!,
      'sell' in a ? b.basket[0].hold : null,
    ];
  } else {
    const t = b.friends.find((f) => f.id === a.to)!;
    if (typeof a.from === 'number') {
      const slot = b.basket[a.from];
      [slot.hold, t.hold] = [t.hold, slot.hold];
      // A goal case keeps carrying the basket object on to the next trade.
      slot.active = !!c.goal;
    } else {
      const f = b.friends.find((f) => f.id === a.from)!;
      [f.hold, t.hold] = [t.hold, f.hold];
      f.done = true;
    }
    t.done = true;
  }
  n.history.push(copy(s.frame));
  if (c.level >= 5 && n.history.length > UNDO_CAP) n.history.shift();
  if (stageDone(c, b) && b.stage < c.stages.length - 1) {
    n.frame = copy(c.stages[b.stage + 1]);
    n.frame.stage = b.stage + 1;
    n.frame.rewards = [...b.rewards, ...b.basket.filter((s) => !s.active).map((s) => s.hold)];
    // Undo never crosses into level 6's first stage; level 1 can still trade back an earlier visit.
    if (b.stall) n.history = [];
  }
  return n;
}
export function actions(c: Case, s: State): Action[] {
  if (goal(c, s)) return [];
  const out: Action[] = [];
  // Stall moves first, so where a stall route and a barter route are equally short the hint names the stall.
  const stall: Action[] = [{ sell: true }, ...[0, 1, 2].map((buy) => ({ buy }))];
  for (const a of stall) if (accepted(c, s, a)) out.push(a);
  const friends = [...s.frame.friends].sort((a, b) => a.id.localeCompare(b.id));
  const sources: (Friend | number)[] =
    c.level === 3
      ? friends.map((f) => f.id)
      : s.frame.basket
          .map((_, i) => i)
          .sort((a, b) => s.frame.basket[a].hold.localeCompare(s.frame.basket[b].hold));
  for (const from of sources)
    for (const t of friends) {
      const a = { from, to: t.id };
      if (accepted(c, s, a)) out.push(a);
    }
  if (s.history.length) out.push({ undo: true });
  return out;
}
export const identity = (s: State) => JSON.stringify(s);
export function reachable(c: Case, initial = start(c)): State[] {
  const queue = [initial],
    seen = new Set([identity(initial)]);
  for (let i = 0; i < queue.length; i++)
    for (const a of actions(c, queue[i])) {
      const n = step(c, queue[i], a),
        key = identity(n);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push(n);
      }
    }
  return queue;
}
/** Search includes history (Undo is a legal edge), never drawing order or transient animation state. */
export function solve(c: Case, initial: State): Action[] | null {
  const queue = [{ state: initial, path: [] as Action[] }],
    seen = new Set([identity(initial)]);
  for (let i = 0; i < queue.length; i++) {
    const { state, path } = queue[i];
    if (goal(c, state)) return path;
    for (const a of actions(c, state)) {
      const n = step(c, state, a),
        key = identity(n);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ state: n, path: [...path, a] });
      }
    }
  }
  return null;
}
export const hint = (c: Case, s: State) => solve(c, s)?.[0] ?? null;
export function taskKey(c: Case, s: State): string {
  const a = hint(c, s);
  if (!a) return `${c.id}:done`;
  if (c.level === 1) return `${c.id}:stage:${s.frame.stage}`;
  if (c.level === 4) return `${c.id}:carry:${s.frame.basket[0].hold}`;
  if (c.level >= 5) return `${c.id}:${s.frame.stage}:carry:${s.frame.basket[0].hold}`;
  // Stall actions only occur from level 5, answered above; this narrows the type for the line below.
  if ('sell' in a || 'buy' in a) return `${c.id}:stall`;
  return `${c.id}:${'undo' in a ? 'undo' : c.level === 3 ? [a.from, a.to].sort().join(':') : a.to}`;
}
export interface Line {
  line: keyof typeof VOICE;
  params: Record<string, string>;
}
/**
 * What Help says for the solver's next action. From level 5 a trade that does not itself bring the goal gets the
 * backward clue, naming who holds the goal and what they want; the glow still marks the next trade.
 */
export function hintLine(c: Case, s: State, a = hint(c, s)): Line | null {
  if (!a) return null;
  const f = s.frame,
    carried = f.basket[0]?.hold ?? '';
  if ('undo' in a) return { line: 'swap-meet.hint-undo', params: {} };
  if ('sell' in a) return { line: 'swap-meet.hint-sell', params: { thing: carried } };
  if ('buy' in a) return { line: 'swap-meet.hint-buy', params: { thing: f.stall!.shelf[a.buy]! } };
  if (typeof a.from === 'string')
    return { line: 'swap-meet.hint-pair', params: { friend: a.from, other: a.to } };
  const to = f.friends.find((t) => t.id === a.to)!,
    holder = f.friends.find((t) => t.hold === c.goal);
  if (c.level >= 5 && holder && to !== holder)
    return { line: 'swap-meet.clue', params: { friend: holder.id, goal: c.goal!, want: holder.want } };
  return { line: 'swap-meet.hint', params: { thing: f.basket[a.from].hold, friend: a.to } };
}
/** The length of the route she finally took: one more per accepted trade, one fewer per Undo. */
export const netTrades = (n: number, a: Action) => ('undo' in a ? n - 1 : n + 1);
/**
 * Level 6's closing question is unscored: whichever card she taps, the reply states both counts and one fact about the
 * routes, never about her. Stage 1 is a plain three-trade chain, so its route is always three.
 */
export function routeReply(first: number, second: number): Line {
  if (second < first) return { line: 'swap-meet.fewer', params: {} };
  if (second === first) return { line: 'swap-meet.same', params: {} };
  return { line: 'swap-meet.more', params: { second: String(second) } };
}
/** Help survives Undo and is capped at two distinct tasks. Inspection/cancel never calls reject. */
export class Tally {
  misses = 0;
  streak = 0;
  glowing = false;
  readonly helped = new Set<string>();
  get hints() {
    return Math.min(2, this.helped.size);
  }
  help(c: Case, s: State) {
    this.helped.add(taskKey(c, s));
    this.glowing = true;
  }
  reject(c: Case, s: State) {
    if (c.level !== 1) this.misses++;
    if (++this.streak >= 2) this.help(c, s);
  }
  changed() {
    this.streak = 0;
    this.glowing = false;
  }
}
export const NAMES = [
  'Give it — three pictured requests',
  'Two friends — either request first',
  'Swap! — two mutually wanted pairs',
  'Chain of two — trade twice for a goal',
  'Chain of three — plan three trades past a tempting side trade',
  'Shells make it easier — trade with friends, then try the shell stall',
];
export interface Point {
  x: number;
  y: number;
}
export interface Layout {
  friends: Point[];
  basket: Point[];
  undo: Point;
  help: Point;
  goal: Point;
  rewards: Point;
  /** Level 6's stall in the fourth place, and its three shelf places (absolute). */
  stall?: Point;
  shelf: Point[];
}
/** The stall panel's half size, and its shelf places relative to its center: three full-size goods in a row. */
export const STALL = { w: 165, h: 88, shelf: [-108, 0, 108].map((x) => ({ x, y: 18 })) };
/** 120-square sources/receivers, laid out in safe-area logical units with no scale reduction. */
export function layout(v: { w: number; h: number }, friends: number, slots: number, stall = false): Layout {
  const tall = v.h > v.w;
  const xs = tall ? [v.w * 0.35, v.w * 0.72] : [v.w * 0.36, v.w * 0.68];
  const panels = friends + (stall ? 1 : 0);
  // Held upright the first row sits low enough that a panel's request bubble (130 above its center) clears the undo and
  // help buttons, whose bottoms are at 260; a second row, taller screens first, ends above the trays.
  let top = Math.min(560, Math.max(420, v.h * 0.3));
  let trayY = v.h - (tall ? 300 : 120);
  let gap = 380;
  // Levels 5 and 6 put four panels above a tray and the goal card. On a short upright screen the rows close up
  // (each panel with its bubble is 203 tall) and the trays drop, so the second row still clears the goal card.
  if (tall && panels === 4 && slots > 0) {
    // Below the second row's center: a panel (73) or the deeper stall, then the goal card's top (100) and a margin.
    const below = (stall ? STALL.h : 73) + 110;
    top = Math.min(top, Math.max(390, trayY - below - 215 - 8));
    gap = Math.min(380, Math.max(215, trayY - below - top));
    trayY = Math.max(trayY, top + gap + below);
  }
  const ys = tall ? [top, top + gap] : stall ? [250, 460] : [260, 475];
  const positions =
    panels === 1
      ? [{ x: v.w * 0.55, y: ys[0] }]
      : panels === 2
        ? xs.map((x) => ({ x, y: ys[0] }))
        : [
            { x: xs[0], y: ys[0] },
            { x: xs[1], y: ys[0] },
            { x: xs[0], y: ys[1] },
            { x: xs[1], y: ys[1] },
          ];
  // The stall is wider than a friend's panel; it keeps clear of the bubble on the panel to its left.
  const stallAt = stall
    ? { x: Math.max(xs[1], Math.min(v.w - STALL.w - 20, xs[0] + 134 + STALL.w + 20)), y: ys[1] }
    : undefined;
  return {
    friends: positions.slice(0, friends),
    basket: Array.from({ length: slots }, (_, i) => ({
      x: v.w * 0.38 + i * 190,
      y: trayY,
    })),
    undo: { x: 190, y: 210 },
    help: { x: v.w - 85, y: 210 },
    goal: { x: v.w * 0.78, y: trayY },
    rewards: { x: v.w * 0.48, y: v.h - 43 },
    stall: stallAt,
    shelf: stallAt ? STALL.shelf.map((p) => ({ x: stallAt.x + p.x, y: stallAt.y + p.y })) : [],
  };
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 6 },
};
