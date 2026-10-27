/**
 * Gadget Bench rules: five invented parts with one right socket each, a path of pictured conditions, and the authored
 * check `runPath` that stops a cart at the first condition its gadget cannot handle. Levels 1–3 from
 * docs/definitions/gadget-bench.md: compare two finished gadgets, change one part of a shown cart, build one from parts.
 * Nothing here is a real device, and the run is a rule, never a simulation.
 */
import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

export type Socket = 'under' | 'top' | 'front';
export type PartId = 'wheels' | 'float' | 'umbrella' | 'lantern' | 'flag';
export type Condition = 'smooth' | 'bump' | 'puddle' | 'rain' | 'dark';
/** A gadget: each socket empty or holding one part. */
export type Gadget = Partial<Record<Socket, PartId>>;

export const SOCKETS: readonly Socket[] = ['under', 'top', 'front'];
export const PART_IDS: readonly PartId[] = ['wheels', 'float', 'umbrella', 'lantern', 'flag'];

export interface PartSpec {
  /** The one socket it works in; the flag is a decoy that works nowhere. */
  socket: Socket | null;
  fixes: Condition | null;
  /** Spoken, with its article. */
  name: string;
}

export const PARTS: Record<PartId, PartSpec> = {
  wheels: { socket: 'under', fixes: 'bump', name: 'the big wheels' },
  float: { socket: 'under', fixes: 'puddle', name: 'the float' },
  umbrella: { socket: 'top', fixes: 'rain', name: 'the umbrella' },
  lantern: { socket: 'front', fixes: 'dark', name: 'the lantern' },
  flag: { socket: null, fixes: null, name: 'the flag' },
};

/** Where a socket is, in words. */
export const SOCKET_WORDS: Record<Socket, string> = { under: 'underneath', top: 'on top', front: 'at the front' };

/** What a condition needs: the one part in its one socket; `smooth` needs nothing. */
export function need(c: Condition): { part: PartId; socket: Socket } | null {
  for (const id of PART_IDS) {
    const p = PARTS[id];
    if (p.fixes === c && p.socket) return { part: id, socket: p.socket };
  }
  return null;
}

export type RunResult = { ok: true } | { ok: false; at: Condition; socket: Socket; part: PartId };

/** The first condition whose needed part is not in its socket, and the socket responsible. Parts elsewhere never help or hurt. */
export function runPath(g: Gadget, path: readonly Condition[]): RunResult {
  for (const c of path) {
    const n = need(c);
    if (!n) continue;
    if (g[n.socket] !== n.part) return { ok: false, at: c, socket: n.socket, part: n.part };
  }
  return { ok: true };
}

/** True when two conditions of the path would need the same socket (never at levels 1–3). */
export function socketConflict(path: readonly Condition[]): boolean {
  const seen = new Set<Socket>();
  for (const c of path) {
    const n = need(c);
    if (!n) continue;
    if (seen.has(n.socket)) return true;
    seen.add(n.socket);
  }
  return false;
}

/** Every assembly of the tray's parts over the open sockets (each empty or one part, no part twice) that passes the path. */
export function passingDesigns(path: readonly Condition[], tray: readonly PartId[], open: readonly Socket[]): Gadget[] {
  const out: Gadget[] = [];
  const walk = (i: number, g: Gadget, used: Set<PartId>) => {
    if (i === open.length) {
      if (runPath(g, path).ok) out.push({ ...g });
      return;
    }
    walk(i + 1, g, used);
    for (const p of tray) {
      if (used.has(p)) continue;
      used.add(p);
      g[open[i]] = p;
      walk(i + 1, g, used);
      delete g[open[i]];
      used.delete(p);
    }
  };
  walk(0, {}, new Set());
  return out;
}

export const sameGadget = (a: Gadget, b: Gadget) => SOCKETS.every((s) => a[s] === b[s]);

// ——— Neighbors and rounds ———

export type Cargo = 'apples' | 'bag' | 'fish' | 'honey';
export interface Neighbor {
  critter: CritterName;
  /** Spoken name. */
  name: string;
  cargo: Cargo;
}

/** The definition's hedgehog and mouse stand in as the island's bunny and cat until those critters exist. */
export const NEIGHBORS: readonly Neighbor[] = [
  { critter: 'bunny', name: 'Bunny', cargo: 'apples' },
  { critter: 'duck', name: 'Duck', cargo: 'bag' },
  { critter: 'cat', name: 'Cat', cargo: 'fish' },
  { critter: 'bear', name: 'Bear', cargo: 'honey' },
];

export interface Round {
  neighbor: Neighbor;
  /** The pictured path, starting with `smooth`. */
  path: Condition[];
  /** Sockets she can use. Level 1 shows all three on both gadgets; level 3 opens the two the path needs. */
  open: Socket[];
  /** Parts in the tray, in tray order (levels 2–3). */
  tray: PartId[];
  /** Level 1: the two finished gadgets and which one passes. */
  pair?: { gadgets: [Gadget, Gadget]; passing: 0 | 1 };
  /** Level 2: the first neighbor, its one-condition path and the cart the pet builds for it. */
  shown?: { neighbor: Neighbor; path: Condition[]; gadget: Gadget };
}

export interface Brief {
  level: number;
  rounds: Round[];
}

export interface Plan {
  name: string;
  describe: string;
}

export const PLANS: Record<number, Plan> = {
  1: { name: 'Which one works?', describe: 'Which one works? Try two finished gadgets, give the one that works' },
  2: { name: 'Change one part', describe: 'Change one part: the shown cart works for one friend; change it for the next' },
  3: { name: 'Build it', describe: 'Build it: two open sockets, four parts, a path of two' },
};

export const planFor = (level: number): Plan => PLANS[Math.max(1, Math.min(3, level))];

const LEVEL1_CONDITIONS: readonly Condition[] = ['rain', 'dark', 'bump', 'puddle'];
/** Level 3's pairs, the first authored. */
export const LEVEL3_PAIRS: readonly [Condition, Condition][] = [['rain', 'dark'], ['bump', 'dark'], ['rain', 'bump'], ['puddle', 'rain'], ['puddle', 'dark']];
/** Level 2's rounds in authored order: the first neighbor's condition, then the second's new one. */
export const LEVEL2_STEPS: readonly { first: Condition; then: Condition }[] = [
  { first: 'bump', then: 'puddle' },
  { first: 'rain', then: 'dark' },
  { first: 'dark', then: 'bump' },
];

/** The three rounds of a level, seeded. The first round of each level is authored so the how-to demonstration matches. */
export function briefFor(level: number, rng: Rng): Brief {
  const l = Math.max(1, Math.min(3, level));
  const rounds: Round[] = [];
  const pool = rng.shuffle([...NEIGHBORS]);
  const neighborAt = (i: number) => pool[i % pool.length];
  if (l === 1) {
    const later = rng.shuffle(LEVEL1_CONDITIONS.filter((c) => c !== 'rain'));
    const conditions: Condition[] = ['rain', later[0], later[1]];
    conditions.forEach((c, i) => {
      const n = need(c)!;
      const passing: 0 | 1 = i === 0 ? 0 : rng.chance(0.5) ? 0 : 1;
      const good: Gadget = { [n.socket]: n.part };
      const bad: Gadget = { [n.socket]: 'flag' };
      const neighbor = i === 0 ? NEIGHBORS[0] : neighborAt(i);
      rounds.push({ neighbor, path: ['smooth', c], open: [...SOCKETS], tray: [], pair: { gadgets: passing === 0 ? [good, bad] : [bad, good], passing } });
    });
  } else if (l === 2) {
    LEVEL2_STEPS.forEach((step, i) => {
      const first = need(step.first)!;
      const next = need(step.then)!;
      const shownGadget: Gadget = { [first.socket]: first.part };
      // The second path keeps the first condition unless it would need the same socket (round 1's bump and puddle).
      const path: Condition[] = first.socket === next.socket ? ['smooth', step.then] : ['smooth', step.first, step.then];
      // The tray: the needed part, the flag, and one part that does not help.
      const others = PART_IDS.filter((p) => p !== next.part && p !== 'flag' && p !== first.part && PARTS[p].socket !== next.socket);
      const tray = rng.shuffle([next.part, 'flag', rng.pick(others)] as PartId[]);
      const firstNeighbor = i === 0 ? NEIGHBORS[0] : neighborAt(i * 2);
      let neighbor = neighborAt(i * 2 + 1);
      if (neighbor === firstNeighbor) neighbor = neighborAt(i * 2 + 2);
      rounds.push({ neighbor, path, open: [...SOCKETS], tray, shown: { neighbor: firstNeighbor, path: ['smooth', step.first], gadget: shownGadget } });
    });
  } else {
    const order = [LEVEL3_PAIRS[0], ...rng.shuffle(LEVEL3_PAIRS.slice(1))].slice(0, 3);
    order.forEach((pair, i) => {
      const conds = i === 0 ? [...pair] : rng.shuffle([...pair]);
      const needs = conds.map((c) => need(c)!);
      const open = needs.map((n) => n.socket);
      const closed = SOCKETS.find((s) => !open.includes(s))!;
      const decoys = PART_IDS.filter((p) => PARTS[p].socket === closed);
      const tray = rng.shuffle([needs[0].part, needs[1].part, rng.pick(decoys), 'flag'] as PartId[]);
      rounds.push({ neighbor: i === 0 ? NEIGHBORS[0] : neighborAt(i), path: ['smooth', ...conds], open, tray });
    });
  }
  return { level: l, rounds };
}

// ——— Help ———

export type Help =
  /** Put `part` in `socket`; `replaces` is the part there now, if any. */
  | { kind: 'install'; part: PartId; socket: Socket; replaces: PartId | null; at: Condition }
  /** Nothing is unmet: the gadget passes. */
  | { kind: 'done' };

/** What help does next for a built gadget: the part the first unmet condition needs, in its socket. Correct work stays. */
export function helpFor(gadget: Gadget, path: readonly Condition[]): Help {
  const r = runPath(gadget, path);
  if (r.ok) return { kind: 'done' };
  return { kind: 'install', part: r.part, socket: r.socket, replaces: gadget[r.socket] ?? null, at: r.at };
}

/** The gadget after help: the part moves in (from the tray or another socket) and whatever was there goes back to the tray. */
export function applyHelp(gadget: Gadget, h: Help): Gadget {
  if (h.kind !== 'install') return { ...gadget };
  const g: Gadget = { ...gadget };
  for (const s of SOCKETS) if (g[s] === h.part) delete g[s];
  g[h.socket] = h.part;
  return g;
}

/** Misses, hints and the round's glow, by the definition's accounting. */
export class Tally {
  misses = 0;
  hints = 0;
  /** The responsible socket glows (level 1: the passing gadget). */
  glowing = false;
  /** Show a hint presses that counted this round. */
  counted = 0;
  private roundMisses = 0;
  private lastFail: { at: Condition; part: PartId | undefined } | null = null;

  /** A new round: the glow and the same-condition memory reset; misses and hints carry on. */
  nextRound() {
    this.glowing = false;
    this.counted = 0;
    this.roundMisses = 0;
    this.lastFail = null;
  }

  /** A failing Give. Returns what the shell does now: light the glow, install the part (a supported finish), or nothing more. */
  miss(): 'glow' | 'install' | 'none' {
    this.misses++;
    this.roundMisses++;
    if (this.glowing) { this.hints++; return 'install'; }
    if (this.roundMisses >= 2) { this.light(); return 'glow'; }
    return 'none';
  }

  /** A failing Try at `at` with `part` in the responsible socket. Two in a row at the same condition with that socket unchanged light the glow. */
  tryFail(at: Condition, part: PartId | undefined): boolean {
    const same = this.lastFail && this.lastFail.at === at && this.lastFail.part === part;
    this.lastFail = { at, part };
    if (same && !this.glowing) { this.light(); return true; }
    return false;
  }

  /** A Try that passes clears the same-condition memory. */
  tryOk() {
    this.lastFail = null;
  }

  private light() {
    this.glowing = true;
    this.hints++;
  }

  /** A Show a hint press that did something: counts up to `unmet` times a round, then the words only. */
  help(unmet: number): boolean {
    if (this.counted >= unmet) return false;
    this.counted++;
    this.hints++;
    return true;
  }
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export const SOCKET = 110;
export const PART = 110;
export const TILE = 96;
export const BUTTON_R = 55;
export const HAND = 110;
export const STRIP = 44;
const M = 20;

export interface BenchLayout {
  /** The neighbor's request card. */
  request: Rect;
  /** The path's tiles in order. */
  tiles: Rect[];
  /** Level 1: two gadget boards; levels 2–3: one cart board. */
  boards: Rect[];
  /** Level 1: a Give hand under each board. */
  hands: Rect[];
  /** Tray slots, each a part's home. */
  tray: Rect[];
  /** The version strip's row (no touches). */
  strip: Rect;
  /** Levels 2–3. */
  tryButton: Rect | null;
  giveButton: Rect | null;
}

/** Socket centres on a board of (w, h), relative to its centre. */
export function socketAt(s: Socket, w: number, h: number): Pt {
  if (s === 'top') return { x: -w * 0.08, y: -h / 2 + SOCKET / 2 + 4 };
  if (s === 'under') return { x: -w * 0.08, y: h / 2 - SOCKET / 2 - 4 };
  return { x: w / 2 - SOCKET / 2 - 4, y: 0 };
}

const button = (cx: number, cy: number): Rect => ({ x: cx - BUTTON_R, y: cy - BUTTON_R, w: 2 * BUTTON_R, h: 2 * BUTTON_R });

/** The bench's boards, centred in the room between `top` and `bottom`: two gadgets with a hand under each, or one cart. */
function placeBoards(pair: boolean, left: number, room: number, top: number, bottom: number, boards: Rect[], hands: Rect[]) {
  const gap = 16;
  if (pair) {
    const bw = Math.min(320, (room - 30) / 2);
    const bh = Math.min(260, bottom - top - HAND - gap);
    const y = top + Math.max(0, (bottom - top - bh - HAND - gap) / 2);
    const x0 = left + (room - (2 * bw + 30)) / 2;
    for (let i = 0; i < 2; i++) {
      boards.push({ x: x0 + i * (bw + 30), y, w: bw, h: bh });
      hands.push({ x: x0 + i * (bw + 30) + bw / 2 - HAND / 2, y: y + bh + gap, w: HAND, h: HAND });
    }
  } else {
    const bw = Math.min(460, room);
    const bh = Math.min(360, bottom - top);
    boards.push({ x: left + (room - bw) / 2, y: top + Math.max(0, (bottom - top - bh) / 2), w: bw, h: bh });
  }
}

/**
 * Where everything goes, from the room left in the view: the request card at the left (above the bench in portrait), the
 * path at the right (a row below the bench in portrait), the tray along the bottom clear of the guide, Try and Give at the
 * bottom right. Null rather than a part, socket or hand under 100 units.
 */
export function benchLayout(level: number, tiles: number, trayCount: number, v: View): BenchLayout | null {
  const wide = v.w >= v.h;
  const pair = level === 1;
  const gap = 16;
  let request: Rect;
  const tileRects: Rect[] = [];
  const boards: Rect[] = [];
  const hands: Rect[] = [];
  const tray: Rect[] = [];
  let tryButton: Rect | null = null;
  let giveButton: Rect | null = null;
  // The bottom row: the tray (and the buttons at levels 2–3) sit above the view's bottom edge, clear of the guide.
  const bottomY = v.h - M - PART;
  if (!pair) {
    const cy = v.h - M - BUTTON_R;
    giveButton = button(v.w - M - BUTTON_R, cy);
    tryButton = button(giveButton.x - 24 - BUTTON_R, cy);
  }
  const trayW = trayCount * PART + Math.max(0, trayCount - 1) * gap;
  let trayY = bottomY;
  let trayLeft = PET_CORNER.w + M;
  let trayRight = tryButton ? tryButton.x - M : v.w - M;
  if (!wide && trayCount > 0 && trayRight - trayLeft < trayW) {
    // Portrait: the tray takes its own row above the buttons, clear of the guide.
    trayY = v.h - PET_CORNER.h - M - PART;
    trayLeft = M;
    trayRight = v.w - M;
    if (tryButton && trayY + PART + M > tryButton.y) trayY = tryButton.y - M - PART;
  }
  const trayX = trayLeft + (trayRight - trayLeft - trayW) / 2;
  for (let i = 0; i < trayCount; i++) tray.push({ x: trayX + i * (PART + gap), y: trayY, w: PART, h: PART });
  const stripY = trayCount > 0 ? trayY - 12 - STRIP : bottomY - 12 - STRIP;
  const strip: Rect = { x: Math.max(PET_CORNER.w + M, v.w / 2 - 3 * (STRIP + 8)), y: stripY, w: 6 * (STRIP + 8), h: STRIP };
  if (wide) {
    const top = M + 24;
    request = { x: M, y: HOME_CORNER.h + M, w: 200, h: 190 };
    const tileX = v.w - M - TILE;
    for (let i = 0; i < tiles; i++) tileRects.push({ x: tileX, y: top + i * (TILE + 12), w: TILE, h: TILE });
    const left = request.x + request.w + M;
    const right = tileX - M;
    const room = right - left;
    const bottom = strip.y - M;
    placeBoards(pair, left, room, top, bottom, boards, hands);
  } else {
    request = { x: HOME_CORNER.w + M, y: M, w: v.w - HOME_CORNER.w - 2 * M, h: 150 };
    const top = request.y + request.h + M;
    const tilesW = tiles * TILE + (tiles - 1) * 12;
    const tilesY = strip.y - M - TILE;
    const tilesX = (v.w - tilesW) / 2;
    for (let i = 0; i < tiles; i++) tileRects.push({ x: tilesX + i * (TILE + 12), y: tilesY, w: TILE, h: TILE });
    const bottom = tilesY - M;
    const left = M;
    const room = v.w - 2 * M;
    placeBoards(pair, left, room, top, bottom, boards, hands);
  }
  for (const b of boards) if (b.w < 220 || b.h < 180) return null;
  const parts = [request, ...tileRects, ...boards, ...hands, ...tray, strip, ...(tryButton ? [tryButton] : []), ...(giveButton ? [giveButton] : [])];
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  return { request, tiles: tileRects, boards, hands, tray, strip, tryButton, giveButton };
}

// ——— The ghost finger ———

export type Move =
  | { tryGadget: 0 | 1 }
  | { give: 0 | 1 }
  | { drag: PartId; to: Socket }
  | { tryCart: true }
  | { giveCart: true };

/**
 * What a capable child does next. Level 1: Try the failing gadget, Try the passing one, Give it. Levels 2–3: Try the shown
 * cart once (level 2, a free look at where it stops), put in what help names, Try, Give.
 */
export function nextMove(round: Round, gadget: Gadget, tried: readonly boolean[], triedOk: boolean, level: number): Move {
  if (round.pair) {
    const fail = (1 - round.pair.passing) as 0 | 1;
    if (!tried[fail]) return { tryGadget: fail };
    if (!tried[round.pair.passing]) return { tryGadget: round.pair.passing };
    return { give: round.pair.passing };
  }
  if (level === 2 && !tried[0] && !triedOk) return { tryCart: true };
  const h = helpFor(gadget, round.path);
  if (h.kind === 'install') return { drag: h.part, to: h.socket };
  if (!triedOk) return { tryCart: true };
  return { giveCart: true };
}
