import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Domino Run's rules, as a stated toy model (docs/definitions/domino-run.md): a lane is a row of slots, slot 0 the
 * starter and the last slot a bell or a gong. A falling domino of size `h` reaches `h` slots and can push a piece at
 * most one size bigger than itself. Everything here is plain and deterministic, so tests count solutions rather than
 * check one exact answer.
 */

/** Small, tall and giant: a domino's size is also how many slots it reaches. */
export type Size = 1 | 2 | 3;
export const SIZES: readonly Size[] = [1, 2, 3];
/** The bell is pushed like a small domino; only a giant can push the gong. */
export const END_SIZE = { bell: 1, gong: 4 } as const;
export type End = keyof typeof END_SIZE;

export interface Lane {
  /** The bell's slot; slots 1..n−1 hold the lane's dominoes. At most 6, so a lane is at most seven slots wide. */
  n: number;
  /** A pinned domino's size per slot (0 where none). Index 0 is the starter, always small. */
  fixed: number[];
  /** Slots where she can stand a domino. */
  sockets: number[];
  end: End;
}

export interface Line {
  lanes: Lane[];
  /** The dominoes she has to place (any order; leftovers are never required). */
  tray: Size[];
}

/** What stands in each lane's sockets: `placed[lane][slot]` is a size, 0 where the socket is empty. */
export type Placement = number[][];

export type StallReason = 'too-far' | 'too-heavy';

export interface LaneRun {
  /** The slots that fell, in order, from where the chain started. */
  fallen: number[];
  rung: boolean;
  /** Where the chain stopped: the last fallen slot, why, and the slot to ring (the gap, or the piece too big to push). */
  stall: { from: number; reason: StallReason; at: number } | null;
}

export const emptyPlacement = (line: Line): Placement => line.lanes.map((l) => new Array<number>(l.n + 1).fill(0));

/** The size standing at a slot: the starter, a pinned domino, one she placed, or the end. 0 for nothing. */
export function sizeAt(lane: Lane, placed: number[], slot: number): number {
  if (slot === 0) return 1;
  if (slot === lane.n) return END_SIZE[lane.end];
  return lane.fixed[slot] || placed[slot] || 0;
}

/** Why a falling domino of size `h` at `i` cannot topple the next standing piece at `j` (of size `s`), or null if it can. */
export function stallReason(i: number, h: number, j: number, s: number): StallReason | null {
  if (j - i > h) return 'too-far';
  if (s > h + 1) return 'too-heavy';
  return null;
}

/** One lane's chain from `from` (the starter by default): the tipping rule, piece by piece, until the end rings or it stalls. */
export function runLane(lane: Lane, placed: number[], from = 0): LaneRun {
  const fallen = [from];
  let i = from;
  for (;;) {
    const h = sizeAt(lane, placed, i);
    let j = i + 1;
    while (j < lane.n && !sizeAt(lane, placed, j)) j++;
    const why = stallReason(i, h, j, sizeAt(lane, placed, j));
    if (why) return { fallen, rung: false, stall: { from: i, reason: why, at: why === 'too-far' ? i + 1 : j } };
    if (j === lane.n) return { fallen, rung: true, stall: null };
    fallen.push(j);
    i = j;
  }
}

/** The whole line's run: every lane from its starter (the fork starts both). */
export function run(line: Line, placed: Placement, from = 0): LaneRun[] {
  return line.lanes.map((l, k) => runLane(l, placed[k], from));
}

export const rings = (line: Line, placed: Placement) => run(line, placed).every((r) => r.rung);

const key = (p: Placement) => p.map((l) => l.join('')).join('|');

/**
 * Every arrangement of tray dominoes into empty sockets (any subset of the tray, each piece used once) that rings every
 * bell. Identical pieces make one arrangement, not several, so "exactly one solution" means one picture of the line.
 */
export function solutions(line: Line): Placement[] {
  const sockets = line.lanes.flatMap((l, k) => l.sockets.map((s) => [k, s] as const));
  const counts = [0, 0, 0, 0];
  for (const t of line.tray) counts[t]++;
  const out: Placement[] = [];
  const seen = new Set<string>();
  const placed = emptyPlacement(line);
  const walk = (i: number) => {
    if (i === sockets.length) {
      const k = key(placed);
      if (!seen.has(k) && rings(line, placed)) {
        seen.add(k);
        out.push(placed.map((l) => [...l]));
      }
      return;
    }
    const [lane, slot] = sockets[i];
    walk(i + 1);
    for (const s of SIZES) {
      if (!counts[s]) continue;
      counts[s]--;
      placed[lane][slot] = s;
      walk(i + 1);
      placed[lane][slot] = 0;
      counts[s]++;
    }
  };
  walk(0);
  return out;
}

/** Every arrangement of the tray into the sockets, rung or not (each picture once). */
export function arrangements(line: Line, all = false): Placement[] {
  const sockets = line.lanes.flatMap((l, k) => l.sockets.map((s) => [k, s] as const));
  const counts = [0, 0, 0, 0];
  for (const t of line.tray) counts[t]++;
  const out: Placement[] = [];
  const placed = emptyPlacement(line);
  const walk = (i: number, left: number) => {
    if (i === sockets.length) {
      if (!all || left === 0) out.push(placed.map((l) => [...l]));
      return;
    }
    const [lane, slot] = sockets[i];
    walk(i + 1, left);
    for (const s of SIZES) {
      if (!counts[s]) continue;
      counts[s]--;
      placed[lane][slot] = s;
      walk(i + 1, left - 1);
      placed[lane][slot] = 0;
      counts[s]++;
    }
  };
  walk(0, line.tray.length);
  return out;
}

/** The tray dominoes not standing in a socket yet. */
export function remaining(line: Line, placed: Placement): Size[] {
  const left = [...line.tray];
  for (const l of placed) for (const s of l) {
    if (!s) continue;
    const i = left.indexOf(s as Size);
    if (i >= 0) left.splice(i, 1);
  }
  return left;
}

export type Hint =
  /** Stand a tray domino of this size in this socket. */
  | { kind: 'place'; lane: number; slot: number; size: Size }
  /** This placed domino is in the way: send it back to the tray. */
  | { kind: 'remove'; lane: number; slot: number }
  /** The line already rings: tap the starter. */
  | { kind: 'run' }
  | { kind: 'none' };

/**
 * The next useful step, keeping her correct work: the solution that agrees with most of what she placed (then the one
 * needing fewest changes), and one placement it needs. A domino comes back to the tray only when no free placement
 * would do.
 */
export function hintPlacement(line: Line, placed: Placement, sols = solutions(line)): Hint {
  if (rings(line, placed)) return { kind: 'run' };
  let best: Placement | null = null, bestAgree = -1, bestOff = Infinity;
  for (const sol of sols) {
    let agree = 0, off = 0;
    sol.forEach((l, k) => l.forEach((s, slot) => {
      const p = placed[k][slot];
      if (p && p === s) agree++;
      else if (p !== s) off++;
    }));
    if (agree > bestAgree || (agree === bestAgree && off < bestOff)) {
      best = sol;
      bestAgree = agree;
      bestOff = off;
    }
  }
  if (!best) return { kind: 'none' };
  const left = remaining(line, placed);
  for (const [k, l] of best.entries()) for (const [slot, s] of l.entries()) {
    if (s && !placed[k][slot] && left.includes(s as Size)) return { kind: 'place', lane: k, slot, size: s as Size };
  }
  for (const [k, l] of best.entries()) for (const [slot, s] of l.entries()) {
    if (placed[k][slot] && placed[k][slot] !== s) return { kind: 'remove', lane: k, slot };
  }
  return { kind: 'none' };
}

/* ---------------------------------------------------------------------------------------------- */
/* Levels                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export interface Plan {
  id: number;
  name: string;
  lines: number;
  fork: boolean;
  /** Level 1: every domino is pinned and tapping any one tips it and the rest. */
  tapAny: boolean;
  /** Levels 1–2: a tray domino tapped hops into the glowing socket, and stalls never add a glow. */
  hop: boolean;
}

export const PLANS: Plan[] = [
  { id: 1, name: 'Tip the line', lines: 3, fork: false, tapAny: true, hop: true },
  { id: 2, name: 'One missing', lines: 3, fork: false, tapAny: false, hop: true },
  { id: 3, name: 'Fill the gaps', lines: 2, fork: false, tapAny: false, hop: false },
  { id: 4, name: 'Tall ones reach farther', lines: 2, fork: false, tapAny: false, hop: false },
  { id: 5, name: 'Two bells', lines: 2, fork: true, tapAny: false, hop: false },
  { id: 6, name: 'Growing dominoes', lines: 2, fork: false, tapAny: false, hop: false },
  { id: 7, name: 'Just enough', lines: 2, fork: false, tapAny: false, hop: false },
  { id: 8, name: 'Two bells, one tray', lines: 2, fork: true, tapAny: false, hop: false },
];

export const planFor = (level: number): Plan => PLANS[Math.min(Math.max(1, Math.round(level)), PLANS.length) - 1];

/** A lane from a picture: `S` small, `T` tall, `G` giant (pinned), `_` a socket, ending in `B` bell or `O` gong; the starter is implied. */
export function lane(picture: string): Lane {
  const n = picture.length;
  const fixed = new Array<number>(n + 1).fill(0);
  fixed[0] = 1;
  const sockets: number[] = [];
  [...picture.slice(0, -1)].forEach((c, i) => {
    const slot = i + 1;
    if (c === '_') sockets.push(slot);
    else fixed[slot] = 'STG'.indexOf(c) + 1;
  });
  return { n, fixed, sockets, end: picture.endsWith('O') ? 'gong' : 'bell' };
}

const tray = (s: string): Size[] => [...s].map((c) => ('STG'.indexOf(c) + 1) as Size);

/** Each level's first line, as the definition gives it. */
export const FIRST: Record<number, Line> = {
  1: { lanes: [lane('SSSSSB')], tray: [] },
  2: { lanes: [lane('SS_SSB')], tray: tray('S') },
  3: { lanes: [lane('S__S_B')], tray: tray('SSS') },
  4: { lanes: [lane('S__S_B')], tray: tray('TS') },
  5: { lanes: [lane('SSS_SB'), lane('S_SSSB')], tray: tray('SS') },
  6: { lanes: [lane('S____O')], tray: tray('TG') },
  7: { lanes: [lane('S____B')], tray: tray('TT') },
  8: { lanes: [lane('S____O'), lane('SS__TB')], tray: tray('TTG') },
};

const sockets = (line: Line) => line.lanes.reduce((n, l) => n + l.sockets.length, 0);

/** The sizes that fall along each lane of a rung arrangement, starter first. */
function chainSizes(line: Line, placed: Placement): number[][] {
  return line.lanes.map((l, k) => runLane(l, placed[k]).fallen.map((s) => sizeAt(l, placed[k], s)));
}

/** Does every lane need at least one tray domino? */
const eachLaneNeeds = (line: Line) => line.lanes.every((l, k) => !runLane(l, emptyPlacement(line)[k]).rung);

/** The fewest dominoes of any sizes (up to three) that ring this line's lanes, ignoring its tray. */
export function fewest(line: Line): number {
  for (let n = 0; n <= 3; n++) {
    const multisets: Size[][] = [];
    const pick = (from: number, acc: Size[]) => {
      if (acc.length === n) return void multisets.push(acc);
      for (let s = from; s <= 3; s++) pick(s, [...acc, s as Size]);
    };
    pick(1, []);
    if (multisets.some((t) => solutions({ ...line, tray: t }).length)) return n;
  }
  return Infinity;
}

/** The rule test each plan's lines must pass (the definition's plan filters). */
export function passes(plan: Plan, line: Line): boolean {
  const lanes = line.lanes;
  if (lanes.length !== (plan.fork ? 2 : 1)) return false;
  if (lanes.some((l) => l.n < 3 || l.n > 6 || l.sockets.length > 5)) return false;
  if (line.tray.length > 3) return false;
  if (plan.tapAny) {
    const l = lanes[0];
    return !l.sockets.length && !line.tray.length && l.fixed.slice(0, l.n).every((s) => s === 1) && rings(line, emptyPlacement(line));
  }
  const sols = solutions(line);
  if (!sols.length || rings(line, emptyPlacement(line))) return false;
  const start = run(line, emptyPlacement(line));
  switch (plan.id) {
    case 2:
      return sockets(line) === 1 && line.tray.length === 1 && line.tray[0] === 1;
    case 3:
      return sockets(line) >= 2 && sockets(line) <= 3 && line.tray.length === sockets(line) && line.tray.every((t) => t === 1)
        && sols.length === 1 && start[0].stall?.reason === 'too-far';
    case 4:
      return sockets(line) >= 3 && sockets(line) <= 4 && line.tray.length >= 2 && line.tray.length < sockets(line)
        && line.tray.every((t) => t <= 2) && line.tray.includes(2) && sols.every((p) => spansWithTall(line, p));
    case 5:
      return lanes.every((l) => l.sockets.length >= 1 && l.sockets.length <= 2) && line.tray.length >= 2 && line.tray.every((t) => t === 1)
        && lanes.every((l) => l.end === 'bell') && eachLaneNeeds(line);
    case 6:
      return lanes[0].end === 'gong' && line.tray.length >= 2
        && sols.every((p) => chainSizes(line, p)[0].every((s, i, a) => i === 0 || s >= a[i - 1]))
        && arrangements(line).some((p) => run(line, p)[0].stall?.reason === 'too-heavy');
    case 7:
      return line.tray.length >= 1 && line.tray.length === fewest(line)
        && arrangements(line, true).some((p) => !rings(line, p));
    case 8:
      return line.tray.length === 3 && new Set(line.tray).size >= 2 && lanes[0].end !== lanes[1].end && eachLaneNeeds(line)
        && sols.every((p) => unevenSplit(p))
        && arrangements(line).some((p) => run(line, p).some((r) => r.stall?.reason === 'too-heavy'));
  }
  return false;
}

/** A tall domino in this arrangement reaches over an empty slot to the next standing piece. */
function spansWithTall(line: Line, placed: Placement): boolean {
  const l = line.lanes[0], p = placed[0];
  const fallen = runLane(l, p).fallen;
  return fallen.some((s, i) => sizeAt(l, p, s) === 2 && (i + 1 < fallen.length ? fallen[i + 1] : l.n) - s === 2);
}

/** The two lanes get different dominoes: by count or by size. */
function unevenSplit(placed: Placement): boolean {
  const [a, b] = placed.map((l) => l.filter(Boolean).sort().join(''));
  return a !== b && a.length > 0 && b.length > 0;
}

/* Generation: each plan builds a lane backward from the pieces a solution needs, then the filter decides. */

/** Pin small dominoes everywhere except some sockets; the starter is slot 0. */
function smallLane(rng: Rng, n: number, holes: number, end: End = 'bell', from = 1): Lane {
  const slots = rng.shuffle(Array.from({ length: n - from }, (_, i) => i + from)).slice(0, holes).sort((a, b) => a - b);
  const fixed = new Array<number>(n + 1).fill(0);
  fixed[0] = 1;
  for (let s = 1; s < n; s++) if (!slots.includes(s)) fixed[s] = 1;
  return { n, fixed, sockets: slots, end };
}

/** A lane whose chain a solution climbs: the solution's pieces laid at their slots, then some of them turned into sockets. */
function chainLane(rng: Rng, n: number, end: End, pieces: number[], open: number): { lane: Lane; tray: Size[] } {
  // `pieces[s]` is the size standing at slot s in the solution (0 empty); it is turned into a socket or pinned.
  const fixed = new Array<number>(n + 1).fill(0);
  fixed[0] = 1;
  const standing = pieces.map((s, i) => (s && i > 0 && i < n ? i : 0)).filter(Boolean);
  const take = rng.shuffle([...standing]).slice(0, open);
  const empties = rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i + 1).filter((s) => !pieces[s]));
  const sockets = [...take, ...empties.slice(0, Math.max(0, rng.int(0, 2)))].sort((a, b) => a - b);
  for (const s of standing) if (!take.includes(s)) fixed[s] = pieces[s];
  return { lane: { n, fixed, sockets, end }, tray: take.map((s) => pieces[s] as Size) };
}

/** A random chain from the starter to the end, by the tipping rule: sizes and gaps a run would accept. */
function randomChain(rng: Rng, n: number, end: End, grow: boolean): number[] | null {
  const pieces = new Array<number>(n + 1).fill(0);
  pieces[0] = 1;
  let i = 0, h = 1;
  for (let tries = 0; tries < 20; tries++) {
    // Reach the end if it is in reach and pushable.
    if (n - i <= h && END_SIZE[end] <= h + 1 && (rng.chance(0.5) || n - i === 1)) return pieces;
    const step = rng.int(1, h);
    const j = i + step;
    if (j >= n) return n - i <= h && END_SIZE[end] <= h + 1 ? pieces : null;
    const low = grow ? h : 1;
    const s = rng.int(low, Math.min(3, h + 1));
    pieces[j] = s;
    i = j;
    h = s;
  }
  return null;
}

function candidate(plan: Plan, rng: Rng): Line | null {
  switch (plan.id) {
    case 1: {
      const n = rng.int(4, 6);
      return { lanes: [smallLane(rng, n, 0)], tray: [] };
    }
    case 2:
      return { lanes: [smallLane(rng, rng.int(4, 6), 1)], tray: [1] };
    case 3: {
      const holes = rng.int(2, 3);
      return { lanes: [smallLane(rng, rng.int(5, 6), holes)], tray: new Array<Size>(holes).fill(1) };
    }
    case 4: {
      const chain = randomChain(rng, 6, 'bell', false);
      if (!chain || !chain.includes(2)) return null;
      const c = chainLane(rng, 6, 'bell', chain, rng.int(2, 3));
      return { lanes: [c.lane], tray: c.tray };
    }
    case 5: {
      const total = rng.int(2, 3);
      const top = total === 3 ? rng.int(1, 2) : 1;
      return { lanes: [smallLane(rng, rng.int(5, 6), top), smallLane(rng, rng.int(5, 6), total - top)], tray: new Array<Size>(total).fill(1) };
    }
    case 6: {
      const chain = randomChain(rng, 6, 'gong', true);
      if (!chain) return null;
      const c = chainLane(rng, 6, 'gong', chain, rng.int(2, 3));
      return { lanes: [c.lane], tray: c.tray };
    }
    case 7: {
      const end: End = rng.chance(0.5) ? 'gong' : 'bell';
      const chain = randomChain(rng, 6, end, false);
      if (!chain) return null;
      const c = chainLane(rng, 6, end, chain, rng.int(1, 3));
      return { lanes: [c.lane], tray: c.tray };
    }
    case 8: {
      const ends: End[] = rng.chance(0.5) ? ['gong', 'bell'] : ['bell', 'gong'];
      const chains = ends.map((e) => randomChain(rng, 6, e, e === 'gong'));
      if (chains.some((c) => !c)) return null;
      const opens = rng.chance(0.5) ? [2, 1] : [1, 2];
      const built = chains.map((c, k) => chainLane(rng, 6, ends[k], c!, opens[k]));
      return { lanes: built.map((b) => b.lane), tray: rng.shuffle(built.flatMap((b) => b.tray)) };
    }
  }
  return null;
}

/** A seeded line for a plan, accepted only if it passes the plan's filter; after 50 tries, the level's first line. */
export function makeLine(plan: Plan, rng: Rng): { line: Line; fallback: boolean } {
  for (let t = 0; t < 50; t++) {
    const line = candidate(plan, rng);
    if (line && passes(plan, line)) return { line, fallback: false };
  }
  return { line: FIRST[plan.id], fallback: true };
}

/** A round's lines: the authored first line, then seeded ones (each different from the one before). */
export function makeRound(plan: Plan, rng: Rng, count = plan.lines): Line[] {
  const out = [FIRST[plan.id]];
  while (out.length < count) {
    let line = makeLine(plan, rng).line;
    for (let t = 0; t < 5 && describe(line) === describe(out[out.length - 1]); t++) line = makeLine(plan, rng).line;
    out.push(line);
  }
  return out;
}

export const describe = (line: Line) => line.lanes.map((l) => `${l.fixed.join('')}:${l.sockets.join(',')}:${l.end}`).join('|') + `/${line.tray.join('')}`;

/* ---------------------------------------------------------------------------------------------- */
/* Layout                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

/** Slot pitch: a slot's hit area is its whole 100 × 180 column. */
export const PITCH = 100;
export const SLOT_H = 180;
/** Domino heights by size (small, tall, giant), drawn bottom-aligned. */
export const DOMINO_H = [0, 80, 120, 160];
export const DOMINO_W = 36;
export const TRAY_W = 124;
export const TRAY_H = 160;
const TRAY_GAP = 30;

export interface Box { x: number; y: number; w: number; h: number }

export interface DominoLayout {
  /** Per lane: slot 0's middle x and the lane's baseline (where dominoes stand). */
  lanes: { x0: number; base: number }[];
  /** The three tray places: each one's middle x and its bottom y, with its hit box. */
  tray: { x: number; y: number; hit: Box }[];
  portrait: boolean;
}

/** Slot `s`'s hit column in a lane. */
export function slotBox(l: { x0: number; base: number }, s: number): Box {
  return { x: l.x0 + s * PITCH - PITCH / 2, y: l.base - SLOT_H, w: PITCH, h: SLOT_H };
}

/**
 * Lanes centred in the view; the tray a column to their right on a sideways screen and a row under them held upright.
 * Clear of the home and `?` buttons (top-left) and the pet's corner (bottom-left 150 × 220).
 */
export function dominoLayout(lanes: number, v: View, pieces = 3): DominoLayout {
  const width = 7 * PITCH;
  const portrait = v.h > v.w * 1.1;
  const trayBox = (x: number, y: number) => ({ x, y, hit: { x: x - TRAY_W / 2, y: y - TRAY_H, w: TRAY_W, h: TRAY_H } });
  if (!portrait) {
    const left = 150 + Math.max(0, (v.w - 20 - 150 - (width + TRAY_GAP + TRAY_W)) / 2);
    const dy = (v.h - 768) / 2;
    const bases = lanes === 1 ? [420] : [300, 540];
    const tx = left + width + TRAY_GAP + TRAY_W / 2;
    const tops = lanes === 1 ? [150, 340, 530] : [180, 370, 560];
    return {
      lanes: bases.map((b) => ({ x0: left + PITCH / 2, base: b + dy })),
      tray: tops.map((t) => trayBox(tx, t + dy + TRAY_H)),
      portrait,
    };
  }
  const left = (v.w - width) / 2;
  const top = Math.max(200, (v.h - 900) / 2 + 120);
  const bases = lanes === 1 ? [top + SLOT_H] : [top + SLOT_H, top + 2 * SLOT_H + 80];
  const trayTop = bases[bases.length - 1] + 90;
  const n = Math.max(1, Math.min(3, pieces));
  const row = n * TRAY_W + (n - 1) * TRAY_GAP;
  const tx = (v.w - row) / 2 + TRAY_W / 2;
  return {
    lanes: bases.map((b) => ({ x0: left + PITCH / 2, base: b })),
    tray: [0, 1, 2].map((i) => trayBox(tx + i * (TRAY_W + TRAY_GAP), trayTop + TRAY_H)),
    portrait,
  };
}
