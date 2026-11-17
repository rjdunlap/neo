import type { BandLevels } from '../../progress/difficulty';
import type { Rng } from '../../engine/random';

/**
 * Ribbon Workshop: compose a ribbon as long as a gift's tag asks, from halves and quarters of one declared whole.
 * Lengths are whole numbers of ticks (levels 1–3: four ticks to a whole, so a half is 2 and a quarter is 1); nothing
 * is compared in pixels. See docs/definitions/ribbon-workshop.md.
 */

/** Ticks in one whole at levels 1–3. */
export const TICKS = 4;
/** The bench holds one and a half wholes; a place past it is refused (not a miss). */
export const CAPACITY = 6;
export const HALF = 2;
export const QUARTER = 1;

export type Size = typeof HALF | typeof QUARTER;
export interface Piece {
  id: number;
  size: Size;
}
/** A gift: its target length and the tray of pieces it starts with, both in ticks. */
export interface GiftCase {
  target: number;
  tray: readonly Size[];
}
export interface RibbonState {
  tray: readonly Piece[];
  bench: readonly Piece[];
  nextId: number;
}
export type Action = { kind: 'place' | 'return' | 'snip'; id: number };
/** What the ghost finger or the hint glow points at next: an action, or the bow when the bench is already right. */
export type Hint = Action | { kind: 'check' };

export interface RibbonPlan {
  name: string;
  /** The scissors are on the bench. */
  snip: boolean;
  /** Gift 1 is picked from this pool. */
  first: readonly GiftCase[];
  /** Gift 2 is this case (the snip gift), or null to pick another from `first`. */
  second: GiftCase | null;
}

const H = HALF,
  Q = QUARTER;
export const PLANS: Record<number, RibbonPlan> = {
  1: {
    name: 'A whole ribbon',
    snip: false,
    second: null,
    first: [
      { target: 4, tray: [H, H, Q, Q, Q, Q] },
      { target: 4, tray: [H, Q, Q, Q, Q] },
      { target: 4, tray: [H, H, Q, Q] },
    ],
  },
  2: {
    name: 'Snip a half',
    snip: true,
    second: { target: 1, tray: [H, H] },
    first: [
      { target: 2, tray: [H, Q, Q] },
      { target: 2, tray: [Q, Q, Q] },
      { target: 2, tray: [H, Q, Q, Q] },
    ],
  },
  3: {
    name: 'Three quarters',
    snip: true,
    second: { target: 3, tray: [H, H] },
    first: [
      { target: 3, tray: [H, Q, Q, Q] },
      { target: 3, tray: [H, H, Q] },
      { target: 3, tray: [Q, Q, Q, Q] },
    ],
  },
};
/** The levels that compose a gift's ribbon from a tray. Level 6 (Whole Switch) has its own small model below. */
export const GIFT_LEVELS = [1, 2, 3] as const;
/** Whole Switch. IDs 4 (Three halves) and 5 (Five sixths) are reserved and undefined. */
export const SWITCH_LEVEL = 6;
export const LEVEL_IDS = [...GIFT_LEVELS, SWITCH_LEVEL] as const;
export const planFor = (level: number): RibbonPlan => PLANS[level] ?? PLANS[1];

/** The tag's name for a target, also the instruction's line: `ribbon.ask.<amount>`. */
export const AMOUNTS: Record<number, 'quarter' | 'half' | 'threeQuarters' | 'whole'> = {
  1: 'quarter',
  2: 'half',
  3: 'threeQuarters',
  4: 'whole',
};
/** The written fraction on the tag and the cards. */
export const WRITTEN: Record<number, string> = { 1: '¼', 2: '½', 3: '¾', 4: '1' };

export function startState(c: GiftCase): RibbonState {
  return { tray: c.tray.map((size, id) => ({ id, size })), bench: [], nextId: c.tray.length };
}
export const total = (pieces: readonly Piece[]) => pieces.reduce((s, p) => s + p.size, 0);

/** Apply an action, or return null when it cannot be done (a missing piece, a full bench, a quarter or a bench piece snipped). */
export function apply(s: RibbonState, a: Action): RibbonState | null {
  if (a.kind === 'place') {
    const p = s.tray.find((p) => p.id === a.id);
    if (!p || total(s.bench) + p.size > CAPACITY) return null;
    return { ...s, tray: s.tray.filter((q) => q !== p), bench: [...s.bench, p] };
  }
  if (a.kind === 'return') {
    const p = s.bench.find((p) => p.id === a.id);
    if (!p) return null;
    return { ...s, bench: s.bench.filter((q) => q !== p), tray: [...s.tray, p] };
  }
  const i = s.tray.findIndex((p) => p.id === a.id);
  if (i < 0 || s.tray[i].size !== HALF) return null;
  const quarters: Piece[] = [
    { id: s.nextId, size: QUARTER },
    { id: s.nextId + 1, size: QUARTER },
  ];
  return { ...s, tray: [...s.tray.slice(0, i), ...quarters, ...s.tray.slice(i + 1)], nextId: s.nextId + 2 };
}

export type Verdict = 'empty' | 'short' | 'long' | 'right';
/** What the bow says. Equality is the bench's total, whatever the order. */
export function judge(s: RibbonState, target: number): Verdict {
  if (!s.bench.length) return 'empty';
  const t = total(s.bench);
  return t === target ? 'right' : t < target ? 'short' : 'long';
}

/** The bench's pieces as a multiset, longest first: 'hq' is a half and a quarter. Names the composition line `ribbon.made.<key>`. */
export const compositionKey = (pieces: readonly Piece[]) =>
  pieces
    .map((p) => (p.size === HALF ? 'h' : 'q'))
    .sort()
    .join('');

/** Every action from a state, in the solver's preference order: places in tray order, snips in tray order, returns from the end. An overfull bench offers only returns, since nothing added can help. */
export function actions(s: RibbonState, target: number, canSnip: boolean): Action[] {
  const out: Action[] = [];
  if (total(s.bench) <= target) {
    for (const p of s.tray) out.push({ kind: 'place', id: p.id });
    if (canSnip) for (const p of s.tray) if (p.size === HALF) out.push({ kind: 'snip', id: p.id });
  }
  for (const p of [...s.bench].reverse()) out.push({ kind: 'return', id: p.id });
  return out;
}

const keyOf = (s: RibbonState) =>
  `${s.tray.map((p) => p.size).join('')}|${s.bench.map((p) => p.size).join('')}`;

/**
 * The best action list to a bench of exactly the target: fewest returns, then fewest actions, then tray order. A
 * uniform-cost search over the (small) states reachable by place, return and snip. Null when no bench can make it.
 */
export function solve(s: RibbonState, target: number, canSnip: boolean): Action[] | null {
  const cost = (returns: number, steps: number) => returns * 1000 + steps;
  const frontier: { s: RibbonState; path: Action[]; returns: number }[] = [{ s, path: [], returns: 0 }];
  const seen = new Set<string>();
  while (frontier.length) {
    // Stable: the earliest-made entry wins a tie, so tray order breaks it.
    let best = 0;
    for (let i = 1; i < frontier.length; i++)
      if (
        cost(frontier[i].returns, frontier[i].path.length) <
        cost(frontier[best].returns, frontier[best].path.length)
      )
        best = i;
    const node = frontier.splice(best, 1)[0];
    const key = keyOf(node.s);
    if (seen.has(key)) continue;
    seen.add(key);
    if (total(node.s.bench) === target && node.s.bench.length) return node.path;
    for (const a of actions(node.s, target, canSnip)) {
      const next = apply(node.s, a);
      if (next && !seen.has(keyOf(next)))
        frontier.push({
          s: next,
          path: [...node.path, a],
          returns: node.returns + (a.kind === 'return' ? 1 : 0),
        });
    }
  }
  return null;
}

/** The next touch toward a right ribbon: the bow when the bench is right already. Null only for an unsolvable gift. */
export function hintAction(s: RibbonState, target: number, canSnip: boolean): Hint | null {
  if (judge(s, target) === 'right') return { kind: 'check' };
  const path = solve(s, target, canSnip);
  return path?.[0] ?? null;
}

/** A round: two different gifts from the level's pool (the snip gift second at levels 2–3), each tray in a seeded order. */
export function roundFor(level: number, rng: Rng): GiftCase[] {
  const plan = planFor(level);
  const pool = [...plan.first];
  const first = pool.splice(rng.int(0, pool.length - 1), 1)[0];
  const second = plan.second ?? pool[rng.int(0, pool.length - 1)];
  return [first, second].map((c) => ({ target: c.target, tray: rng.shuffle([...c.tray]) }));
}

/**
 * One gift's accounting. A non-empty wrong check is a miss; the second miss brings the glow and counts one hint, and a
 * request ("Show a hint") counts one unless the glow is already up. Nothing else counts.
 */
export class GiftTally {
  misses = 0;
  hints = 0;
  glow = false;
  private wrong = 0;
  /** A check: returns the verdict and counts a miss for a non-empty wrong bench. */
  check(v: Verdict): Verdict {
    if (v === 'short' || v === 'long') this.miss();
    return v;
  }
  /** One wrong check: a miss, and with the second the glow and its one hint. */
  miss() {
    this.misses++;
    if (++this.wrong === 2 && !this.glow) {
      this.glow = true;
      this.hints++;
    }
  }
  /** Show a hint: true when it counted. */
  ask(): boolean {
    if (this.glow) return false;
    this.glow = true;
    this.hints++;
    return true;
  }
  /** The next gift starts without a glow or wrong checks; counted totals stay. */
  nextGift() {
    this.glow = false;
    this.wrong = 0;
  }
}

/** One gift on the bench: its state, with an undo stack of the exact earlier states (tray order, bench order, piece IDs). */
export class Workbench {
  state: RibbonState;
  private readonly history: RibbonState[] = [];
  constructor(readonly gift: GiftCase) {
    this.state = startState(gift);
  }
  /** Do an action; false (and nothing changes) when it cannot be done. */
  act(a: Action): boolean {
    const next = apply(this.state, a);
    if (!next) return false;
    this.history.push(this.state);
    this.state = next;
    return true;
  }
  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.state = prev;
    return true;
  }
  get canUndo() {
    return this.history.length > 0;
  }
  /** The gift's tray and bench as they started. */
  restart() {
    this.history.length = 0;
    this.state = startState(this.gift);
  }
}

/** Logical units per tick: one whole is 560 at every view size, a half 280 and a quarter 140. */
export const UNIT = 140;
/** The tray's left edge (clear of the pet's corner), the gap between cards, and the ticks a row holds. */
export const TRAY_LEFT = 170;
export const TRAY_GAP = 12;
export const ROW_TICKS = 4;

/**
 * Where each tray card sits: rows filled first-fit (a card goes in the first row with room), so halves and quarters
 * worth eight ticks or fewer always take two rows. `x` is the card's centre; row 0 is the bottom row.
 */
export function trayLayout(tray: readonly Piece[]): { id: number; row: number; x: number }[] {
  const used: number[] = [],
    ends: number[] = [];
  return tray.map((p) => {
    let row = used.findIndex((t) => t + p.size <= ROW_TICKS);
    if (row < 0) {
      row = used.length;
      used.push(0);
      ends.push(TRAY_LEFT);
    }
    const x = ends[row] + (p.size * UNIT) / 2;
    used[row] += p.size;
    ends[row] += p.size * UNIT + TRAY_GAP;
    return { id: p.id, row, x };
  });
}

export const LEVELS: BandLevels = {
  school: { min: 1, max: SWITCH_LEVEL, order: [...LEVEL_IDS] },
};

/*
 * Level 6, Whole Switch: one ribbon that never changes, two spools that can each be the whole, and three name cards.
 * The ribbon is a half of the short spool and a quarter of the long one. See docs/definitions/whole-switch.md.
 */

/** The ribbon's length in ticks. Read, never written: no action changes it. */
export const SWITCH_RIBBON = 6;
/** The short spool and the long spool. */
export const SWITCH_WHOLES = [12, 24] as const;
/** The name cards, counted in quarters: ¼, ½, ¾. */
export const SWITCH_CLAIMS = [1, 2, 3] as const;
export type SwitchWhole = (typeof SWITCH_WHOLES)[number];
export type SwitchClaim = (typeof SWITCH_CLAIMS)[number];

export interface SwitchState {
  /** The spool chosen as the whole; 0 before one is chosen. */
  whole: 0 | SwitchWhole;
  /** The name card chosen, in quarters; 0 before one is chosen. */
  claim: 0 | SwitchClaim;
  /** The whole of the statement accepted on tag 1; 0 during tag 1. */
  made: 0 | SwitchWhole;
}

/** "The ribbon is `claim` quarters of `whole`" is true: exactly (12, ½) and (24, ¼). */
export const switchTrue = (whole: number, claim: number) =>
  whole > 0 && claim > 0 && SWITCH_RIBBON * 4 === claim * whole;
/** The one true name card for a whole. */
export const trueClaim = (whole: SwitchWhole) => ((SWITCH_RIBBON * 4) / whole) as SwitchClaim;
/** How many times the ribbon fits in a whole: what the measure animation counts (2 and 4). */
export const fitsIn = (whole: SwitchWhole) => whole / SWITCH_RIBBON;

export type SwitchVerdict = 'empty' | 'right' | 'same' | 'wrong';
/** What the bow says. A true statement is never wrong: tag 1's own statement on tag 2 is `same`, which counts nothing. */
export function switchJudge(s: SwitchState): SwitchVerdict {
  if (!s.whole || !s.claim) return 'empty';
  if (!switchTrue(s.whole, s.claim)) return 'wrong';
  return s.whole === s.made ? 'same' : 'right';
}

export type SwitchHint =
  { kind: 'whole'; whole: SwitchWhole } | { kind: 'claim'; claim: SwitchClaim } | { kind: 'check' };
/** Touches to a right check through `whole`, the bow included. */
const stepsVia = (s: SwitchState, whole: SwitchWhole) =>
  (whole === s.whole ? 0 : 1) + (s.claim === trueClaim(whole) ? 0 : 1) + 1;
/**
 * The first step of the shortest route to an accepted statement: the spool card of an accepted whole when the current
 * whole is not one (the whole the chosen name is already true for, else the first accepted card in the round's card
 * order), else that whole's true name card, else the bow.
 */
export function switchHint(s: SwitchState, order: readonly SwitchWhole[] = SWITCH_WHOLES): SwitchHint {
  if (!s.whole || s.whole === s.made) {
    const open = order.filter((w) => w !== s.made);
    return { kind: 'whole', whole: open.find((w) => trueClaim(w) === s.claim) ?? open[0] };
  }
  const claim = trueClaim(s.whole);
  return s.claim === claim ? { kind: 'check' } : { kind: 'claim', claim };
}
/** Touches left on the shortest route, the bow included (1 to 3). */
export function switchSteps(s: SwitchState): number {
  if (s.whole && s.whole !== s.made) return stepsVia(s, s.whole);
  return Math.min(...SWITCH_WHOLES.filter((w) => w !== s.made).map((w) => stepsVia(s, w)));
}

/** What the seed varies: the card orders and the ribbon's colour, never a quantity. */
export interface SwitchRound {
  /** The spool cards, left to right. */
  wholes: SwitchWhole[];
  /** The name cards, left to right. */
  claims: SwitchClaim[];
  /** An index into the game's ribbon colours. */
  color: number;
}
export function switchRound(rng: Rng, colors: number): SwitchRound {
  return {
    wholes: rng.shuffle([...SWITCH_WHOLES]),
    claims: rng.shuffle([...SWITCH_CLAIMS]),
    color: rng.int(0, colors - 1),
  };
}

/**
 * One round of Whole Switch: two tags over the same ribbon, with an undo stack of the exact earlier choices. Tag 1
 * accepts either true statement; tag 2 starts with tag 1's statement still showing and accepts only the other one.
 */
export class SwitchBench {
  state: SwitchState = { whole: 0, claim: 0, made: 0 };
  readonly tally = new GiftTally();
  /** Totals from tag 1; the tally holds the tag in play. */
  private bankedMisses = 0;
  private bankedHints = 0;
  /** Both tags are made. */
  done = false;
  private history: SwitchState[] = [];
  /** The choices a restart goes back to: nothing on tag 1, tag 1's statement on tag 2. */
  private base: SwitchState = this.state;

  get tag(): 1 | 2 {
    return this.state.made ? 2 : 1;
  }
  get misses() {
    return this.bankedMisses + this.tally.misses;
  }
  get hints() {
    return this.bankedHints + this.tally.hints;
  }
  get canUndo() {
    return this.history.length > 0;
  }
  private set(next: SwitchState): boolean {
    if (this.done || (next.whole === this.state.whole && next.claim === this.state.claim)) return false;
    this.history.push(this.state);
    this.state = next;
    return true;
  }
  /** Choose a spool as the whole; false when it is the whole already. */
  setWhole(whole: SwitchWhole): boolean {
    return this.set({ ...this.state, whole });
  }
  /** Choose a name card (0 puts it back, as a wrong check does); false when nothing changes. */
  setClaim(claim: 0 | SwitchClaim): boolean {
    return this.set({ ...this.state, claim });
  }
  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.state = prev;
    return true;
  }
  /** The bow: `wrong` counts one miss, `right` finishes the tag, `empty` and `same` count nothing. */
  check(): SwitchVerdict {
    if (this.done) return 'empty';
    const v = switchJudge(this.state);
    if (v === 'wrong') this.tally.miss();
    if (v === 'right') {
      this.bankedMisses += this.tally.misses;
      this.bankedHints += this.tally.hints;
      this.tally.misses = this.tally.hints = 0;
      this.tally.nextGift();
      this.history = [];
      if (this.state.made) this.done = true;
      else this.base = this.state = { ...this.state, made: this.state.whole as SwitchWhole };
    }
    return v;
  }
  /** Show a hint: true when it counted (the glow was not already up). */
  askHint(): boolean {
    return !this.done && this.tally.ask();
  }
  /** The tag's choices as it started. Misses and hints already counted stay. */
  restart() {
    if (this.done) return;
    this.history = [];
    this.state = this.base;
  }
}
