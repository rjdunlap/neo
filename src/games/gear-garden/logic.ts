import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Gear Garden's rules. Every gear is the same size at levels 1–3 (pitch radius 1 in board units, 12 teeth), and sockets
 * lie on one straight line exactly 2 apart, so a gear turns the next only when both are in place, and each touching gear
 * turns the other way. Turns are whole quarter turns (three teeth), so teeth stay in mesh at every resting angle.
 */

export type Role = 'input' | 'output' | 'idler' | 'gap';

export interface Socket {
  x: number;
  y: number;
  role: Role;
}

export interface Board {
  sockets: Socket[];
  /** Tilt of the line in degrees (0, 15 or -15) and whether the handle stands on the right. */
  tilt: number;
  mirror: boolean;
}

export const TEETH = 12;
export const PITCH = (2 * Math.PI) / TEETH;
/** Quarter turns the flower makes to bloom. */
export const BLOOM_TURNS = 4;
/** How close a centre distance must be to 2 to mesh. */
export const EPS = 0.01;
/** Drawn tip radius, in pitch radii. */
export const TIP = 1.12;

export function lineBoard(roles: readonly Role[], tilt = 0, mirror = false): Board {
  const a = (tilt * Math.PI) / 180;
  const dx = 2 * Math.cos(a) * (mirror ? -1 : 1);
  const dy = -2 * Math.sin(a);
  return { sockets: roles.map((role, i) => ({ x: i * dx, y: i * dy, role })), tilt, mirror };
}

const dist = (a: Socket, b: Socket) => Math.hypot(a.x - b.x, a.y - b.y);

/** No two sockets overlap or clash: each pair is either meshing (2 apart) or well clear (more than 2.4). */
export function validate(board: Board): boolean {
  const s = board.sockets;
  if (s.filter((k) => k.role === 'input').length !== 1 || s.filter((k) => k.role === 'output').length !== 1) return false;
  for (let i = 0; i < s.length; i++)
    for (let j = i + 1; j < s.length; j++) {
      const d = dist(s[i], s[j]);
      if (d < 2 - EPS) return false;
      if (d > 2 + EPS && d <= 2.4) return false;
    }
  return true;
}

/** Which sockets hold a gear: everything but a gap, which holds one only when the loose gear is in it. */
export function filledWith(board: Board, looseIn: boolean): boolean[] {
  return board.sockets.map((s) => s.role !== 'gap' || looseIn);
}

/** Every meshing pair of filled sockets, as index pairs. */
export function contacts(board: Board, filled: readonly boolean[]): [number, number][] {
  const out: [number, number][] = [];
  const s = board.sockets;
  for (let i = 0; i < s.length; i++)
    for (let j = i + 1; j < s.length; j++)
      if (filled[i] && filled[j] && Math.abs(dist(s[i], s[j]) - 2) <= EPS) out.push([i, j]);
  return out;
}

export const inputOf = (board: Board) => board.sockets.findIndex((s) => s.role === 'input');
export const outputOf = (board: Board) => board.sockets.findIndex((s) => s.role === 'output');
export const gapOf = (board: Board) => board.sockets.findIndex((s) => s.role === 'gap');

/** Quarter turns of every socket for `inputTurns` quarter turns of the handle (clockwise positive). Unreached gears stay at 0. */
export function propagate(board: Board, filled: readonly boolean[], inputTurns: number): number[] {
  const turns = board.sockets.map(() => 0);
  const seen = board.sockets.map(() => false);
  const start = inputOf(board);
  const links = contacts(board, filled);
  turns[start] = inputTurns;
  seen[start] = true;
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    for (const [a, b] of links) {
      const j = a === i ? b : b === i ? a : -1;
      if (j < 0 || seen[j]) continue;
      seen[j] = true;
      turns[j] = -turns[i];
      queue.push(j);
    }
  }
  return turns.map((t) => t + 0); // no -0
}

/** The output is reached from the handle. */
export function connected(board: Board, filled: readonly boolean[]): boolean {
  return propagate(board, filled, 1)[outputOf(board)] !== 0;
}

/**
 * The resting angle of each gear so that teeth sit in gaps wherever two sockets mesh: a driven gear j beside i along
 * direction α (from i to j) is drawn at θj = −θi + 2α + π + p/2 (mod p). The handle's gear starts at 0.
 */
export function phases(board: Board): number[] {
  const s = board.sockets;
  const out = s.map(() => 0);
  const done = s.map(() => false);
  const start = inputOf(board);
  done[start] = true;
  const queue = [start];
  const all = s.map(() => true);
  const links = contacts(board, all);
  while (queue.length) {
    const i = queue.shift()!;
    for (const [a, b] of links) {
      const j = a === i ? b : b === i ? a : -1;
      if (j < 0 || done[j]) continue;
      const alpha = Math.atan2(s[j].y - s[i].y, s[j].x - s[i].x);
      out[j] = mod(-out[i] + 2 * alpha + Math.PI + PITCH / 2, PITCH);
      done[j] = true;
      queue.push(j);
    }
  }
  return out;
}

export const mod = (v: number, m: number) => ((v % m) + m) % m;

// ---------------------------------------------------------------------------------------------------------------------
// One machine being played

export type FlowerKind = 'tulip' | 'daisy' | 'sunflower';
export const FLOWERS: readonly FlowerKind[] = ['tulip', 'daisy', 'sunflower'];
export const FLOWER_COLORS = ['pink', 'red', 'purple', 'orange', 'yellow', 'blue'] as const;
export type FlowerColor = (typeof FLOWER_COLORS)[number];
export const VISITORS: readonly CritterName[] = ['duck', 'bunny', 'cat', 'pig', 'dog', 'bear'];

export interface MachineSpec {
  board: Board;
  flower: FlowerKind;
  color: FlowerColor;
  visitor: CritterName;
}

/** A level-3 case: a three-gear machine A and a four-gear machine B, each with one gap. */
export interface Case {
  a: MachineSpec;
  b: MachineSpec;
}

export type Step = { kind: 'one'; machine: MachineSpec } | { kind: 'choice'; pair: Case };

export interface Plan {
  level: number;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Turn a flower: tap two gears until the flower blooms' },
  { level: 2, name: 'Bridge the gap: put the missing gear in, then turn' },
  { level: 3, name: 'Two machines: pick one, mend it and see which way the flower turns' },
];

export function planFor(level: number): Plan {
  return PLANS[Math.min(PLANS.length, Math.max(1, Math.round(level))) - 1];
}

const spec = (board: Board, flower: FlowerKind, color: FlowerColor, visitor: CritterName): MachineSpec => ({ board, flower, color, visitor });

/** The round: three machines (levels 1–2) or three cases (level 3). The first of each is authored; the rest follow the definition's stories with seeded art. */
export function roundFor(level: number, rng: Rng): Step[] {
  const lv = planFor(level).level;
  const color = () => rng.pick(FLOWER_COLORS);
  const visitor = () => rng.pick(VISITORS);
  const tilt = () => rng.pick([0, 15, -15]);
  const one = (machine: MachineSpec): Step => ({ kind: 'one', machine });
  if (lv === 1) {
    return [
      one(spec(lineBoard(['input', 'output']), 'tulip', 'pink', 'duck')),
      one(spec(lineBoard(['input', 'output'], 15, true), 'daisy', color(), visitor())),
      one(spec(lineBoard(['input', 'output'], tilt(), rng.chance(0.5)), 'sunflower', 'yellow', visitor())),
    ];
  }
  if (lv === 2) {
    const roles: Role[] = ['input', 'gap', 'output'];
    return [
      one(spec(lineBoard(roles), 'daisy', 'pink', 'duck')),
      one(spec(lineBoard(roles, 0, true), rng.pick(FLOWERS), color(), visitor())),
      one(spec(lineBoard(roles, rng.pick([15, -15]), rng.chance(0.5)), rng.pick(FLOWERS), color(), visitor())),
    ];
  }
  const caseOf = (bGap: 1 | 2, t: number, m: boolean): Step => ({
    kind: 'choice',
    pair: {
      a: spec(lineBoard(['input', 'gap', 'output'], t, m), rng.pick(FLOWERS), color(), visitor()),
      b: spec(lineBoard(bGap === 1 ? ['input', 'gap', 'idler', 'output'] : ['input', 'idler', 'gap', 'output'], t, m), rng.pick(FLOWERS), color(), visitor()),
    },
  });
  const first = caseOf(1, 0, false);
  if (first.kind === 'choice') { first.pair.a.flower = 'tulip'; first.pair.b.flower = 'daisy'; }
  return [first, caseOf(rng.pick([1, 2] as const), tilt(), rng.chance(0.5)), caseOf(rng.pick([1, 2] as const), tilt(), rng.chance(0.5))];
}

/** The live state of one machine: where the loose gear rests, every gear's quarter turns and how far the flower has bloomed. */
export class Machine {
  looseIn = false;
  turns: number[];
  /** Quarter turns the flower has made while connected, either way (|Δ| summed). */
  progress = 0;
  readonly hasGap: boolean;

  constructor(readonly spec: MachineSpec) {
    this.turns = spec.board.sockets.map(() => 0);
    this.hasGap = gapOf(spec.board) >= 0;
  }

  get filled() {
    return filledWith(this.spec.board, this.looseIn);
  }

  get connected() {
    return connected(this.spec.board, this.filled);
  }

  get bloomed() {
    return this.progress >= BLOOM_TURNS;
  }

  /** The output turns the same way as the handle (an odd number of meshes away is the other way). */
  get sameWay() {
    const t = propagate(this.spec.board, this.filledAll(), 1);
    return t[outputOf(this.spec.board)] === 1;
  }

  private filledAll() {
    return this.spec.board.sockets.map(() => true);
  }

  /** One quarter turn of the handle (+1 clockwise, −1 back). Returns each socket's change and whether the flower moved. */
  turn(dir: 1 | -1): { delta: number[]; moved: boolean } {
    const delta = propagate(this.spec.board, this.filled, dir);
    for (let i = 0; i < delta.length; i++) this.turns[i] += delta[i];
    const moved = delta[outputOf(this.spec.board)] !== 0;
    if (moved && !this.bloomed) this.progress++;
    return { delta, moved };
  }

  place(inGap: boolean) {
    if (this.hasGap) this.looseIn = inGap;
  }

  reset() {
    this.looseIn = false;
    this.progress = 0;
    this.turns = this.turns.map(() => 0);
  }
}

export type Help = 'choose' | 'place' | 'turn';

/** The move that completes the open board from here. */
export function helpFor(machine: Machine | null): Help {
  if (!machine) return 'choose';
  if (machine.hasGap && !machine.looseIn) return 'place';
  return 'turn';
}

/** Still trials on one machine before the gap glows, and further still trials before the gear goes in by itself. */
export const GLOW_AFTER = 2;
export const INSTALL_AFTER = 2;

/**
 * The round's accounting: nothing is ever a miss, and a machine counts at most one hint, whether it came from Show a hint,
 * the glow on the gap or the gear going in by itself. A still trial is a run of turns that leave the flower still; it ends
 * when she next touches the loose gear or opens the other machine, so the first look at a broken machine is free.
 */
export class GearTally {
  readonly misses = 0;
  hints = 0;
  glowing = false;
  private trials = 0;
  private inTrial = false;
  private glowAt = 0;
  private index = 0;
  private readonly counted = new Set<number>();

  /** A new machine (or case) at this round position; Start again comes back to earlier positions without recounting. */
  next(index: number) {
    this.index = index;
    this.trials = 0;
    this.inTrial = false;
    this.glowing = false;
  }

  private count() {
    if (this.counted.has(this.index)) return;
    this.counted.add(this.index);
    this.hints++;
  }

  /** A turn of the handle. Returns 'glow' when the gap starts glowing and 'install' when the gear should go in by itself. */
  turned(moved: boolean): 'glow' | 'install' | null {
    if (moved) { this.inTrial = false; return null; }
    if (this.inTrial) return null;
    this.inTrial = true;
    this.trials++;
    if (!this.glowing && this.trials >= GLOW_AFTER) {
      this.glowing = true;
      this.glowAt = this.trials;
      this.count();
      return 'glow';
    }
    if (this.glowing && this.trials >= this.glowAt + INSTALL_AFTER) {
      this.count();
      return 'install';
    }
    return null;
  }

  /** She touched the loose gear or opened the other machine: the trial in progress ends. */
  touched() {
    this.inTrial = false;
  }

  /** The pause sheet's Show a hint on an open machine. */
  asked() {
    this.count();
  }

  /** The gear is in: the glow goes. */
  placed() {
    this.glowing = false;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Layout

export interface Rect { x: number; y: number; w: number; h: number }
export const PET_CORNER = { w: 160, h: 170 };
export const HOME_CORNER = { w: 110, h: 110 };
export const BACK_SIZE = 116;
export const CARD_SIZE = 130;
export const MAX_R = 90;
export const MIN_R = 45;
const M = 20;

/** Board extents in pitch radii, including tips and the flower's head over the output. */
export function extent(board: Board) {
  const xs = board.sockets.map((s) => s.x);
  const ys = board.sockets.map((s) => s.y);
  return { x0: Math.min(...xs) - TIP, x1: Math.max(...xs) + TIP, y0: Math.min(...ys) - TIP, y1: Math.max(...ys) + TIP };
}

export interface GearLayout {
  r: number;
  /** Screen position of board (0, 0). */
  origin: { x: number; y: number };
  /** The machine face: taps anywhere here turn the handle. */
  face: Rect;
  tray: Rect;
  back: Rect;
  /** Level 3: the small picture of the other machine. */
  card: Rect | null;
}

export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The corners the game keeps clear: the home button top-left and the guide bottom-left. */
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

/**
 * Where everything goes for one board: the largest gear radius up to 90 at which the machine, the tray (when the board has
 * a gap), Turn-back and (level 3) the other-machine card all fit clear of the corners. A wide view keeps a column on the
 * right; an upright one puts the tray at the bottom. Null rather than a radius below 45.
 */
export function gearLayout(v: View, board: Board, withCard = false): GearLayout | null {
  const e = extent(board);
  const bw = e.x1 - e.x0;
  const bh = e.y1 - e.y0;
  const hasGap = board.sockets.some((s) => s.role === 'gap');
  const wide = v.w >= v.h;
  for (let r = MAX_R; r >= MIN_R; r--) {
    const trayS = Math.round(2 * TIP * r + 24);
    let area: Rect;
    let tray: Rect;
    let back: Rect;
    let card: Rect | null = null;
    if (wide) {
      const col = Math.max(trayS, BACK_SIZE, withCard ? CARD_SIZE : 0);
      const cx = v.w - M - col / 2;
      back = { x: cx - BACK_SIZE / 2, y: v.h - M - BACK_SIZE, w: BACK_SIZE, h: BACK_SIZE };
      if (withCard) card = { x: cx - CARD_SIZE / 2, y: M, w: CARD_SIZE, h: CARD_SIZE };
      const top = card ? card.y + card.h + 10 : M;
      tray = { x: cx - trayS / 2, y: (top + back.y - trayS) / 2, w: trayS, h: trayS };
      area = { x: PET_CORNER.w + 10, y: M, w: v.w - col - 2 * M - PET_CORNER.w - 10, h: v.h - 2 * M };
    } else {
      back = { x: v.w - M - BACK_SIZE, y: v.h - M - BACK_SIZE, w: BACK_SIZE, h: BACK_SIZE };
      tray = { x: v.w / 2 - trayS / 2, y: v.h - M - Math.max(trayS, BACK_SIZE) + (Math.max(trayS, BACK_SIZE) - trayS) / 2, w: trayS, h: trayS };
      if (withCard) card = { x: v.w - M - CARD_SIZE, y: M, w: CARD_SIZE, h: CARD_SIZE };
      const top = card ? card.y + card.h + 10 : HOME_CORNER.h + 10;
      const bottom = Math.min(tray.y, back.y, v.h - PET_CORNER.h) - 10;
      area = { x: M, y: top, w: v.w - 2 * M, h: bottom - top };
    }
    const fw = bw * r;
    const fh = bh * r;
    if (fw > area.w || fh > area.h) continue;
    const c = centre(area);
    const face: Rect = { x: c.x - fw / 2, y: c.y - fh / 2, w: fw, h: fh };
    const parts = [face, back, ...(hasGap ? [tray] : []), ...(card ? [card] : [])];
    if (!parts.every((p) => inside(p, v))) continue;
    if (parts.some((p) => corners(v).some((k) => overlaps(p, k)))) continue;
    if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) continue;
    return { r, origin: { x: face.x - e.x0 * r, y: face.y - e.y0 * r }, face, tray, back, card };
  }
  return null;
}

/** Level 3's choice: two pictured panels side by side (stacked when upright), at least 300×220, clear of the corners. */
export function choiceLayout(v: View): [Rect, Rect] | null {
  const wide = v.w >= v.h;
  const pw = wide ? Math.min(360, (v.w - PET_CORNER.w - 10 - 3 * M) / 2) : Math.min(420, v.w - 2 * M);
  const ph = wide ? Math.min(280, v.h - 2 * M) : Math.min(280, (v.h - HOME_CORNER.h - PET_CORNER.h - 4 * M) / 2);
  if (pw < 300 || ph < 220) return null;
  let rects: [Rect, Rect];
  if (wide) {
    const x0 = PET_CORNER.w + 10 + ((v.w - PET_CORNER.w - 10 - M) - (2 * pw + M)) / 2;
    const y = (v.h - ph) / 2;
    rects = [{ x: x0, y, w: pw, h: ph }, { x: x0 + pw + M, y, w: pw, h: ph }];
  } else {
    const top = HOME_CORNER.h + M;
    const bottom = v.h - PET_CORNER.h - M;
    const y0 = top + ((bottom - top) - (2 * ph + M)) / 2;
    const x = (v.w - pw) / 2;
    rects = [{ x, y: y0, w: pw, h: ph }, { x, y: y0 + ph + M, w: pw, h: ph }];
  }
  if (rects.some((p) => !inside(p, v) || corners(v).some((k) => overlaps(p, k)))) return null;
  return rects;
}

/** Board (x, y) in screen units. */
export const toScreen = (l: GearLayout, s: { x: number; y: number }) => ({ x: l.origin.x + s.x * l.r, y: l.origin.y + s.y * l.r });

/** A drop at (x, y) lands in the gap when the gear's centre is within 1.2r of it. */
export function dropsInGap(l: GearLayout, board: Board, x: number, y: number): boolean {
  const g = gapOf(board);
  if (g < 0) return false;
  const c = toScreen(l, board.sockets[g]);
  return Math.hypot(c.x - x, c.y - y) <= 1.2 * l.r;
}
