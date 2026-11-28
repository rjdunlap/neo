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
/** Ribbon Cases: two gifts share one tray, then the order changes. Its model is at the end of this file. */
export const CASES_LEVEL = 7;
/** How Many Pieces Fit?: measure a three-quarter ribbon with half-spool pieces. Its model is at the end of this file. */
export const FIT_LEVEL = 8;
export const LEVEL_IDS = [...GIFT_LEVELS, SWITCH_LEVEL, CASES_LEVEL, FIT_LEVEL] as const;
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
export function trayLayout(
  tray: readonly Piece[],
  left = TRAY_LEFT,
): { id: number; row: number; x: number }[] {
  const used: number[] = [],
    ends: number[] = [];
  return tray.map((p) => {
    let row = used.findIndex((t) => t + p.size <= ROW_TICKS);
    if (row < 0) {
      row = used.length;
      used.push(0);
      ends.push(left);
    }
    const x = ends[row] + (p.size * UNIT) / 2;
    used[row] += p.size;
    ends[row] += p.size * UNIT + TRAY_GAP;
    return { id: p.id, row, x };
  });
}

export const LEVELS: BandLevels = {
  school: { min: 1, max: FIT_LEVEL, order: [...LEVEL_IDS] },
  // A person of 13 or older starts at Whole Switch and steps up through Ribbon Cases to How Many Pieces Fit?; a grown-up can still pin any level.
  grownup: { min: SWITCH_LEVEL, max: FIT_LEVEL, order: [SWITCH_LEVEL, CASES_LEVEL, FIT_LEVEL] },
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

/*
 * Level 7, Ribbon Cases: two gifts, one tray. Both ask for three quarters; then one order card changes them to a whole
 * and a half, and a quarter has to cross from one gift to the other. Nothing is saved between rounds: the stock is dealt
 * whole every time. See docs/definitions/ribbon-cases.md.
 */

/** The tray every round starts with: one half and four quarters, six ticks. */
export const CASES_STOCK: readonly Size[] = [HALF, QUARTER, QUARTER, QUARTER, QUARTER];
/** Tag 1: both gifts ask for three quarters. */
export const CASES_FIRST: Requests = [3, 3];
/** Tag 2: a whole and a half, one each way round. */
export const CASES_CHANGES: readonly Requests[] = [
  [4, 2],
  [2, 4],
];
/** A bench holds at most one whole; a place past it is refused (not a miss). */
export const RAIL_CAPACITY = 4;

/** The top gift's bench and the bottom gift's. */
export type Rail = 0 | 1;
export type Requests = readonly [number, number];
export interface CasesState {
  tray: readonly Piece[];
  rails: readonly [readonly Piece[], readonly Piece[]];
  /** The gift she is working on: a placed piece joins its bench. */
  active: Rail;
  nextId: number;
}
export type CasesAction = { kind: 'select'; rail: Rail } | Action;
export type CasesHint = CasesAction | { kind: 'check' };

export function casesStart(stock: readonly Size[] = CASES_STOCK): CasesState {
  return { tray: stock.map((size, id) => ({ id, size })), rails: [[], []], active: 0, nextId: stock.length };
}

/** Apply an action, or return null when it changes nothing or cannot be done (the gift already lit, a full bench, a placed half snipped). */
export function casesApply(s: CasesState, a: CasesAction): CasesState | null {
  if (a.kind === 'select') return a.rail === s.active ? null : { ...s, active: a.rail };
  if (a.kind === 'place') {
    const p = s.tray.find((p) => p.id === a.id);
    if (!p || total(s.rails[s.active]) + p.size > RAIL_CAPACITY) return null;
    const rails: [readonly Piece[], readonly Piece[]] = [s.rails[0], s.rails[1]];
    rails[s.active] = [...rails[s.active], p];
    return { ...s, tray: s.tray.filter((q) => q !== p), rails };
  }
  if (a.kind === 'return') {
    const r = s.rails.findIndex((rail) => rail.some((p) => p.id === a.id));
    if (r < 0) return null;
    const p = s.rails[r].find((p) => p.id === a.id)!;
    const rails: [readonly Piece[], readonly Piece[]] = [s.rails[0], s.rails[1]];
    rails[r] = rails[r].filter((q) => q !== p);
    return { ...s, rails, tray: [...s.tray, p] };
  }
  const i = s.tray.findIndex((p) => p.id === a.id);
  if (i < 0 || s.tray[i].size !== HALF) return null;
  const quarters: Piece[] = [
    { id: s.nextId, size: QUARTER },
    { id: s.nextId + 1, size: QUARTER },
  ];
  return { ...s, tray: [...s.tray.slice(0, i), ...quarters, ...s.tray.slice(i + 1)], nextId: s.nextId + 2 };
}

export type RailVerdict = 'short' | 'long' | 'right';
/** One bench against its own request: the total, whatever the order and however it was made. */
export function railVerdict(pieces: readonly Piece[], request: number): RailVerdict {
  const t = total(pieces);
  return t === request ? 'right' : t < request ? 'short' : 'long';
}
export type CasesVerdict = 'empty' | 'right' | 'wrong';
/** What the bow says: `empty` with nothing on either bench, `right` when both totals match, else `wrong`. */
export function casesJudge(s: CasesState, requests: Requests): CasesVerdict {
  if (!s.rails[0].length && !s.rails[1].length) return 'empty';
  return ([0, 1] as const).every((r) => railVerdict(s.rails[r], requests[r]) === 'right') ? 'right' : 'wrong';
}

/** Which accepted tag-1 sharing this is: `split` when a gift has the half in it, `quarters` when the half was snipped. Names `ribbon.cases.made.<key>`. */
export const casesMadeKey = (s: CasesState): 'split' | 'quarters' =>
  s.rails.some((rail) => rail.some((p) => p.size === HALF)) ? 'split' : 'quarters';

/** Every action from a state, in the solver's tie-break order: the tray in order (place, then snip), returns from the top bench first, then the other gift. */
export function casesActions(s: CasesState): CasesAction[] {
  const out: CasesAction[] = [];
  for (const p of s.tray) out.push({ kind: 'place', id: p.id });
  for (const p of s.tray) if (p.size === HALF) out.push({ kind: 'snip', id: p.id });
  for (const rail of s.rails) for (const p of [...rail].reverse()) out.push({ kind: 'return', id: p.id });
  out.push({ kind: 'select', rail: s.active === 0 ? 1 : 0 });
  return out;
}

const casesKey = (s: CasesState) =>
  `${s.active}|${s.tray.map((p) => p.size).join('')}|${s.rails.map((r) => r.map((p) => p.size).join('')).join('|')}`;

/**
 * The shortest action list to both benches right, searched from the state as it stands (the pieces still in the tray
 * and the pieces already placed). Among equally short lists: fewer returns, then fewer snips, then `casesActions`'
 * order. Null when no sharing can make the requests.
 */
export function casesSolve(s: CasesState, requests: Requests): CasesAction[] | null {
  interface Node {
    s: CasesState;
    path: CasesAction[];
    cost: number;
  }
  const frontier: Node[] = [{ s, path: [], cost: 0 }];
  const seen = new Set<string>();
  while (frontier.length) {
    // Stable: the earliest-made entry wins a tie.
    let best = 0;
    for (let i = 1; i < frontier.length; i++) if (frontier[i].cost < frontier[best].cost) best = i;
    const node = frontier.splice(best, 1)[0];
    const key = casesKey(node.s);
    if (seen.has(key)) continue;
    seen.add(key);
    if (casesJudge(node.s, requests) === 'right') return node.path;
    for (const a of casesActions(node.s)) {
      const next = casesApply(node.s, a);
      if (next && !seen.has(casesKey(next)))
        frontier.push({
          s: next,
          path: [...node.path, a],
          cost: node.cost + 10000 + (a.kind === 'return' ? 100 : 0) + (a.kind === 'snip' ? 1 : 0),
        });
    }
  }
  return null;
}

/** The next touch toward both ribbons right: the bow when they are already. Null only for requests no sharing can make. */
export function casesHint(s: CasesState, requests: Requests): CasesHint | null {
  if (casesJudge(s, requests) === 'right') return { kind: 'check' };
  return casesSolve(s, requests)?.[0] ?? null;
}

/**
 * Some sharing of the stock, with snips, makes both requests. The guard on a changed order: one is only issued if this
 * holds. Each piece goes to a gift or stays in the tray; a half may instead be snipped into two quarters.
 */
export function casesFeasible(stock: readonly Size[], requests: Requests): boolean {
  if (requests.some((r) => r < 0 || r > RAIL_CAPACITY)) return false;
  const go = (pieces: readonly Size[], a: number, b: number): boolean => {
    if (a < 0 || b < 0) return false;
    if (!pieces.length) return a === 0 && b === 0;
    const [p, ...rest] = pieces;
    return (
      go(rest, a - p, b) ||
      go(rest, a, b - p) ||
      go(rest, a, b) ||
      (p === HALF && go([QUARTER, QUARTER, ...rest], a, b))
    );
  };
  return go(stock, requests[0], requests[1]);
}

/** What the seed varies: the tray order, the colours and which gift grows on tag 2. Never a quantity. */
export interface CasesRound {
  stock: Size[];
  /** An index into `CASES_CHANGES`. */
  change: number;
  /** A seed for the scene's colours. */
  paint: number;
}
export function casesRound(rng: Rng): CasesRound {
  const feasible = CASES_CHANGES.map((_, i) => i).filter((i) => casesFeasible(CASES_STOCK, CASES_CHANGES[i]));
  return {
    stock: rng.shuffle([...CASES_STOCK]),
    change: feasible[rng.int(0, feasible.length - 1)],
    paint: rng.int(0, 2 ** 30),
  };
}

/**
 * One round of Ribbon Cases: two tags over one stock, with an undo stack of the exact earlier states. Tag 1 accepts
 * every sharing that makes three quarters twice; tag 2 keeps her accepted ribbons on the benches under the changed
 * requests, and undo never reaches back into tag 1.
 */
export class CasesBench {
  state: CasesState;
  requests: Requests = CASES_FIRST;
  tag: 1 | 2 = 1;
  /** Both tags are made. */
  done = false;
  readonly tally = new GiftTally();
  private bankedMisses = 0;
  private bankedHints = 0;
  private history: CasesState[] = [];
  /** What a restart goes back to: the whole stock in the tray on tag 1, her accepted tag-1 ribbons on tag 2. */
  private base: CasesState;

  constructor(readonly round: CasesRound) {
    this.base = this.state = casesStart(round.stock);
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
  /** Do an action; false (and nothing changes or counts) when it cannot be done. */
  act(a: CasesAction): boolean {
    if (this.done) return false;
    const next = casesApply(this.state, a);
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
  /** Each bench against its own request, for the flashes. */
  get rails(): [RailVerdict, RailVerdict] {
    return [
      railVerdict(this.state.rails[0], this.requests[0]),
      railVerdict(this.state.rails[1], this.requests[1]),
    ];
  }
  /** The bow: `wrong` counts one miss, `right` finishes the tag, `empty` counts nothing. */
  check(): CasesVerdict {
    if (this.done) return 'empty';
    const v = casesJudge(this.state, this.requests);
    if (v === 'wrong') this.tally.miss();
    if (v === 'right') {
      this.bankedMisses += this.tally.misses;
      this.bankedHints += this.tally.hints;
      this.tally.misses = this.tally.hints = 0;
      this.tally.nextGift();
      this.history = [];
      if (this.tag === 2) this.done = true;
      else {
        this.tag = 2;
        this.requests = CASES_CHANGES[this.round.change];
        this.base = this.state;
      }
    }
    return v;
  }
  hint(): CasesHint | null {
    return this.done ? null : casesHint(this.state, this.requests);
  }
  /** Show a hint: true when it counted (the glow was not already up). */
  askHint(): boolean {
    return !this.done && this.tally.ask();
  }
  /** The tag as it started. Misses and hints already counted stay. */
  restart() {
    if (this.done) return;
    this.history = [];
    this.state = this.base;
  }
}

/*
 * Level 8, How Many Pieces Fit?: a three-quarter order measured with half-spool pieces (¾ ÷ ½ = 1½). Lengths are ticks
 * (four to the spool), so a measuring piece is 2 and half of a piece is 1. Tag 1 lays pieces on the order, snipping one
 * in half; tag 2 asks how many pieces fit. See docs/definitions/how-many-pieces-fit.md.
 */

/** The order is three ticks: ¾ of the spool. */
export const FIT_ORDER = 3;
/** The bench holds one whole spool, so a second whole piece can be laid down and seen to hang past the order. */
export const FIT_CAPACITY = 4;
/** One measuring piece is ½ of the spool; half of a piece is ¼ of the spool. */
export const FIT_UNIT_PIECE = 2;
export const FIT_HALF_PIECE = 1;
export const FIT_CHOICES = ['1', '1_1/4', '1_1/2', '2'] as const;
export type FitChoice = (typeof FIT_CHOICES)[number];
/** The written answer on each card. */
export const FIT_WRITTEN: Record<FitChoice, string> = { '1': '1', '1_1/4': '1¼', '1_1/2': '1½', '2': '2' };

/** Two measuring pieces in the tray, nothing on the bench. */
export function fitStart(): RibbonState {
  return {
    tray: [
      { id: 0, size: HALF },
      { id: 1, size: HALF },
    ],
    bench: [],
    nextId: 2,
  };
}

/** Like `apply`, but the bench holds one spool. */
export function fitApply(s: RibbonState, a: Action): RibbonState | null {
  if (a.kind === 'place') {
    const p = s.tray.find((q) => q.id === a.id);
    if (!p || total(s.bench) + p.size > FIT_CAPACITY) return null;
    return { ...s, tray: s.tray.filter((q) => q !== p), bench: [...s.bench, p] };
  }
  return apply(s, a);
}

export type FitMeasureVerdict = Verdict;
/** The bow on tag 1: any bench that adds to three ticks is right. */
export const fitJudgeMeasure = (s: RibbonState): FitMeasureVerdict => judge(s, FIT_ORDER);

export type FitCountVerdict = 'empty' | 'wrong_unit' | 'wrong' | 'right';
/** The bow on tag 2: `1¼` mistakes a quarter of the spool for a quarter of a piece. */
export function fitJudgeCount(choice: FitChoice | null): FitCountVerdict {
  if (choice === null) return 'empty';
  return choice === '1_1/2' ? 'right' : choice === '1_1/4' ? 'wrong_unit' : 'wrong';
}

const FIT_KINDS: Action['kind'][] = ['place', 'snip', 'return'];
const fitKey = (s: RibbonState) =>
  `${s.tray.map((p) => p.size).join('')}|${s.bench.map((p) => p.size).join('')}`;

/** The shortest path of place, snip and return actions to a bench of three ticks (breadth first, placing before snipping before returning), or null. */
export function fitSolve(s: RibbonState): Action[] | null {
  if (total(s.bench) === FIT_ORDER) return [];
  const seen = new Set([fitKey(s)]);
  let frontier: { s: RibbonState; path: Action[] }[] = [{ s, path: [] }];
  while (frontier.length) {
    const next: typeof frontier = [];
    for (const f of frontier)
      for (const kind of FIT_KINDS) {
        const from = kind === 'return' ? f.s.bench : f.s.tray;
        for (const p of from) {
          const a: Action = { kind, id: p.id };
          const n = fitApply(f.s, a);
          if (!n || seen.has(fitKey(n))) continue;
          seen.add(fitKey(n));
          if (total(n.bench) === FIT_ORDER) return [...f.path, a];
          next.push({ s: n, path: [...f.path, a] });
        }
      }
    frontier = next;
  }
  return null;
}

export type FitHint = Action | { kind: 'check' } | { kind: 'choose'; choice: FitChoice };
/** What the glow and the ghost finger point at on tag 1: the first step of the shortest path, or the bow. */
export function fitHint(s: RibbonState): FitHint | null {
  const path = fitSolve(s);
  return path ? (path[0] ?? { kind: 'check' }) : null;
}
/** And on tag 2: the right card, then the bow. */
export const fitCountHint = (choice: FitChoice | null): FitHint =>
  choice === '1_1/2' ? { kind: 'check' } : { kind: 'choose', choice: '1_1/2' };

/** What the seed varies: the answer cards' order and the ribbon colour. Never a quantity. */
export interface FitRound {
  cards: FitChoice[];
  paint: number;
}
export function fitRound(rng: Rng): FitRound {
  return { cards: rng.shuffle([...FIT_CHOICES]), paint: rng.int(0, 2 ** 30) };
}

/**
 * One round of How Many Pieces Fit?, with an undo stack of exact earlier states. Tag 2 keeps her accepted bench, and
 * its undo never reaches back into tag 1.
 */
export class FitBench {
  state: RibbonState = fitStart();
  choice: FitChoice | null = null;
  tag: 1 | 2 = 1;
  done = false;
  readonly tally = new GiftTally();
  private bankedMisses = 0;
  private bankedHints = 0;
  private history: (RibbonState | FitChoice | null)[] = [];

  constructor(readonly round: FitRound) {}
  get misses() {
    return this.bankedMisses + this.tally.misses;
  }
  get hints() {
    return this.bankedHints + this.tally.hints;
  }
  get canUndo() {
    return this.history.length > 0;
  }
  /** A tag 1 action; false (and nothing changes) when it cannot be done. */
  act(a: Action): boolean {
    if (this.done || this.tag !== 1) return false;
    const next = fitApply(this.state, a);
    if (!next) return false;
    this.history.push(this.state);
    this.state = next;
    return true;
  }
  /** Tag 2: pick a card, replacing the last pick. */
  choose(c: FitChoice): boolean {
    if (this.done || this.tag !== 2 || c === this.choice) return false;
    this.history.push(this.choice);
    this.choice = c;
    return true;
  }
  undo(): boolean {
    if (!this.history.length) return false;
    const prev = this.history.pop()!;
    if (this.tag === 1) this.state = prev as RibbonState;
    else this.choice = prev as FitChoice | null;
    return true;
  }
  /** The bow: a wrong answer counts one miss, a right one finishes the tag, an empty one counts nothing. */
  check(): FitMeasureVerdict | FitCountVerdict {
    if (this.done) return 'empty';
    if (this.tag === 1) {
      const v = fitJudgeMeasure(this.state);
      if (v === 'short' || v === 'long') this.tally.miss();
      if (v === 'right') {
        this.bank();
        this.tag = 2;
      }
      return v;
    }
    const v = fitJudgeCount(this.choice);
    if (v === 'wrong' || v === 'wrong_unit') this.tally.miss();
    if (v === 'right') {
      this.bank();
      this.done = true;
    }
    return v;
  }
  private bank() {
    this.bankedMisses += this.tally.misses;
    this.bankedHints += this.tally.hints;
    this.tally.misses = this.tally.hints = 0;
    this.tally.nextGift();
    this.history = [];
  }
  hint(): FitHint | null {
    if (this.done) return null;
    return this.tag === 1 ? fitHint(this.state) : fitCountHint(this.choice);
  }
  askHint(): boolean {
    return !this.done && this.tally.ask();
  }
  /** The tag as it started; misses and hints already counted stay. */
  restart() {
    if (this.done) return;
    this.history = [];
    if (this.tag === 1) this.state = fitStart();
    else this.choice = null;
  }
}
