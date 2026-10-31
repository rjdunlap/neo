/**
 * Keep House rules: put the castle's household where its work needs it. Level 1 opens doors and people step out with their
 * tools (nothing counted); level 2 drags each figure to its workplace; level 3 puts the kitchen, then the stable, on a near or
 * far spot and watches the walk; level 4 fits five room tiles on a 3 × 3 plan to five needs and rings the bell to check; level 5 reads a roofless ruin's remains and drags a picture label onto each room; level 6 builds a lord's
 * hall in timber or stone and watches the years. Definition: docs/definitions/keep-house.md. Every draw is seeded; nothing here reads the clock.
 */
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';

// ——— Plans ———

export type PlanId = 'doors' | 'workplaces' | 'walk' | 'plan' | 'ruin' | 'build';

export interface Plan {
  level: number;
  id: PlanId;
  name: string;
}

export const MAX_LEVEL = 6;

const PLANS: readonly Plan[] = [
  { level: 1, id: 'doors', name: "Who's at the door: tap each castle door and a worker comes out with their tool (2 doors under 3, else 3; nothing counted)" },
  { level: 2, id: 'workplaces', name: 'Who works where: drag each of three figures to the room its tool belongs in (two yards; a first wrong room per figure is free)' },
  { level: 3, id: 'walk', name: "The cook's walk: put the kitchen, then the stable, on a near or far spot and watch whether the soup arrives hot (never a miss)" },
  { level: 4, id: 'plan', name: 'Fit the household: five rooms on a 3 × 3 plan to five needs, then ring the bell to check (two plans; a miss per unmet need)' },
  { level: 5, id: 'ruin', name: 'Read the ruin: drag a picture label onto each roofless room its remains say it was (two ruins; a miss per wrong label)' },
  { level: 6, id: 'build', name: "Stone or timber: build the hall for a lord's purse and stay, then watch the years (never a miss)" },
];

export function planFor(level: number): Plan {
  return PLANS[Math.min(Math.max(1, level), MAX_LEVEL) - 1];
}

// ——— The household ———

export type Figure = 'cook' | 'groom' | 'ringer' | 'steward' | 'horse' | 'hens';
/** The yard rooms of level 2 (the groom and the horse share the stable). */
export type Room = 'kitchen' | 'stable' | 'loft' | 'storeroom' | 'henyard';
/** The people behind the doors at level 1. */
export type Person = 'cook' | 'groom' | 'ringer' | 'steward';

export const FIGURES: readonly Figure[] = ['cook', 'groom', 'ringer', 'steward', 'horse', 'hens'];
export const PEOPLE: readonly Person[] = ['cook', 'groom', 'ringer', 'steward'];
export const ROOMS: readonly Room[] = ['kitchen', 'stable', 'loft', 'storeroom', 'henyard'];

const WORKPLACE: Record<Figure, Room> = { cook: 'kitchen', groom: 'stable', ringer: 'loft', steward: 'storeroom', horse: 'stable', hens: 'henyard' };

/** The one room where a figure's work is. */
export function workplaceOf(figure: Figure): Room {
  return WORKPLACE[figure];
}

// ——— Briefs ———

export interface DoorsBrief {
  level: 1;
  id: 'doors';
  /** Who waits behind each door, left to right. */
  doors: Person[];
  /** Which side of the front the well stands on. */
  well: 'left' | 'right';
}

export interface Yard {
  figures: Figure[];
  /** The three rooms shown, in seeded order: exactly the figures' workplaces. */
  rooms: Room[];
}

export interface WorkplacesBrief {
  level: 2;
  id: 'workplaces';
  yards: Yard[];
}

export interface Placement {
  /** The tile she places. */
  room: 'kitchen' | 'stable';
  /** The room that stays put: the soup goes kitchen → hall, the horses gate → stable. */
  fixed: 'hall' | 'gate';
  /** Which side the fixed room stands on; the spots lie across the yard from it. */
  side: 'left' | 'right';
  /** Walking steps from the fixed room to each spot. */
  near: number;
  far: number;
}

export interface WalkBrief {
  level: 3;
  id: 'walk';
  placements: Placement[];
}

/** A 3 × 3 plan's fixed features; cells are 0–8, row-major. */
export interface Board {
  well: number;
  gate: number;
  /** The shaded corner. */
  cool: number;
  /** The three cells of the sunny side. */
  sunny: number[];
}

export interface PlanBrief {
  level: 4;
  id: 'plan';
  boards: Board[];
}

export interface RuinBrief {
  level: 5;
  id: 'ruin';
  ruins: Ruin[];
}

export interface BuildBrief {
  level: 6;
  id: 'build';
  situations: Situation[];
}

export type Brief = DoorsBrief | WorkplacesBrief | WalkBrief | PlanBrief | RuinBrief | BuildBrief;

/** How many doors the castle front shows: a two-year-old gets two, everyone else three. */
export function doorCount(band: Band): number {
  return band === 'lap' || band === 'toddler' ? 2 : 3;
}

export function briefFor(level: number, band: Band, rng: Rng): Brief {
  const plan = planFor(level);
  if (plan.id === 'doors') {
    const doors = rng.shuffle([...PEOPLE]).slice(0, doorCount(band));
    return { level: 1, id: 'doors', doors, well: rng.chance(0.5) ? 'left' : 'right' };
  }
  if (plan.id === 'workplaces') return { level: 2, id: 'workplaces', yards: [drawYard(rng), drawYard(rng)] };
  if (plan.id === 'walk') {
    return { level: 3, id: 'walk', placements: [drawPlacement('kitchen', rng), drawPlacement('stable', rng)] };
  }
  if (plan.id === 'plan') return { level: 4, id: 'plan', boards: [drawBoard(rng), drawBoard(rng)] };
  if (plan.id === 'ruin') return { level: 5, id: 'ruin', ruins: [drawRuin(rng), drawRuin(rng)] };
  const kinds = rng.shuffle<Build>(['timber', 'stone']);
  return { level: 6, id: 'build', situations: kinds.map((k) => drawSituation(rng, k)) };
}

/** Three figures with three different workplaces (so never the groom with the horse), and their rooms in a seeded order. */
export function drawYard(rng: Rng): Yard {
  const rooms = rng.shuffle([...ROOMS]).slice(0, 3);
  const figures = rooms.map((room) => {
    if (room === 'stable') return rng.chance(0.5) ? 'groom' : 'horse';
    return FIGURES.find((f) => WORKPLACE[f] === room)!;
  });
  return { figures: rng.shuffle(figures), rooms: rng.shuffle(rooms.slice()) };
}

/** A hot walk is this many steps at most. */
export const HOT_STEPS = 3;

export function drawPlacement(room: 'kitchen' | 'stable', rng: Rng): Placement {
  return { room, fixed: room === 'kitchen' ? 'hall' : 'gate', side: rng.chance(0.5) ? 'left' : 'right', near: rng.int(1, 2), far: rng.int(4, 6) };
}

// ——— Level 1: who's at the door ———

export interface DoorsState {
  opened: boolean[];
  bucket: 'down' | 'up';
}

export function startDoors(brief: DoorsBrief): DoorsState {
  return { opened: brief.doors.map(() => false), bucket: 'down' };
}

/** A tap on door `i`: it opens once; a tap on an open door changes nothing (the person waves). */
export function tapDoor(s: DoorsState, i: number): DoorsState {
  if (i < 0 || i >= s.opened.length || s.opened[i]) return s;
  const opened = s.opened.slice();
  opened[i] = true;
  return { ...s, opened };
}

export function tapWell(s: DoorsState): DoorsState {
  return { ...s, bucket: s.bucket === 'down' ? 'up' : 'down' };
}

export const doorsDone = (s: DoorsState) => s.opened.every(Boolean);

/** The next closed door, for the idle glow (entry guidance; it records nothing). */
export function nextDoor(s: DoorsState): number | null {
  const i = s.opened.indexOf(false);
  return i < 0 ? null : i;
}

// ——— Level 2: who works where ———

export interface YardState {
  placed: Partial<Record<Figure, Room>>;
  wrongDrops: Partial<Record<Figure, number>>;
  misses: number;
  /** The yard's one hint is spent and the glow is on until the yard is done. */
  hinted: boolean;
}

export function startYard(): YardState {
  return { placed: {}, wrongDrops: {}, misses: 0, hinted: false };
}

export interface DropResult {
  state: YardState;
  /** The room was the figure's workplace: it walked in and its work started. */
  taken: boolean;
  /** This refused drop counted (the figure's second or later wrong room). */
  miss: boolean;
  /** This drop lit the yard's glow (its one hint). */
  glowed: boolean;
}

/** Let a figure go on a room. A figure already at work changes nothing. */
export function drop(yard: Yard, s: YardState, figure: Figure, room: Room): DropResult {
  if (s.placed[figure] || !yard.figures.includes(figure)) return { state: s, taken: false, miss: false, glowed: false };
  if (room === WORKPLACE[figure]) {
    return { state: { ...s, placed: { ...s.placed, [figure]: room } }, taken: true, miss: false, glowed: false };
  }
  const before = s.wrongDrops[figure] ?? 0;
  const miss = before >= 1;
  const misses = s.misses + (miss ? 1 : 0);
  const glowed = !s.hinted && misses >= 2;
  return {
    state: { ...s, wrongDrops: { ...s.wrongDrops, [figure]: before + 1 }, misses, hinted: s.hinted || glowed },
    taken: false,
    miss,
    glowed,
  };
}

/** Asked-for help: the glow, the yard's one hint if not yet spent. */
export function askYard(s: YardState): YardState {
  return s.hinted ? s : { ...s, hinted: true };
}

export const yardDone = (yard: Yard, s: YardState) => yard.figures.every((f) => s.placed[f] !== undefined);

/** The figure the glow follows: the one she holds, else the next unplaced figure in yard order. */
export function glowTarget(yard: Yard, s: YardState, held: Figure | null = null): { figure: Figure; room: Room } | null {
  if (!s.hinted) return null;
  const figure = held && !s.placed[held] ? held : yard.figures.find((f) => !s.placed[f]);
  return figure ? { figure, room: WORKPLACE[figure] } : null;
}

export function yardTally(states: YardState[]) {
  return { misses: states.reduce((n, s) => n + s.misses, 0), hints: states.filter((s) => s.hinted).length };
}

// ——— Level 3: the cook's walk ———

export type Spot = 'near' | 'far';

export interface PlacementState {
  spot: Spot | null;
  /** Which arrival the last walk showed. */
  arrived: 'hot' | 'cold' | null;
  /** Keep it presses after a cold arrival. */
  refusals: number;
  hinted: boolean;
  done: boolean;
}

export function startPlacement(): PlacementState {
  return { spot: null, arrived: null, refusals: 0, hinted: false, done: false };
}

/** The soup (or the horses) arrive hot when the walk is short. */
export const arrives = (steps: number): 'hot' | 'cold' => (steps <= HOT_STEPS ? 'hot' : 'cold');

export const stepsTo = (p: Placement, spot: Spot) => (spot === 'near' ? p.near : p.far);

/** Put the tile on a spot and play the walk. A hot arrival finishes the placement; a cold one asks. */
export function place(p: Placement, s: PlacementState, spot: Spot): PlacementState {
  if (s.done) return s;
  const arrived = arrives(stepsTo(p, spot));
  return { ...s, spot, arrived, done: arrived === 'hot' };
}

/** Keep it after a cold arrival: the first replays the walk and asks again; the second glows (one hint) and finishes as she left it. */
export function keep(s: PlacementState): PlacementState {
  if (s.done || s.arrived !== 'cold') return s;
  const refusals = s.refusals + 1;
  if (refusals >= 2) return { ...s, refusals, hinted: true, done: true };
  return { ...s, refusals };
}

/** Asked-for help: the near spot glows, the placement's one hint. */
export function askPlacement(s: PlacementState): PlacementState {
  return s.hinted || s.done ? s : { ...s, hinted: true };
}

export function walkTally(states: PlacementState[]) {
  return { misses: 0, hints: states.filter((s) => s.hinted).length };
}

// ——— Level 4: fit the household ———

export type PlanRoom = 'hall' | 'kitchen' | 'stable' | 'storeroom' | 'solar';
export const PLAN_ROOMS: readonly PlanRoom[] = ['hall', 'kitchen', 'stable', 'storeroom', 'solar'];
export const GRID = 3;
export const CELLS = GRID * GRID;

/** Where each room is: a cell, or absent while it waits in the tray. */
export type Layout = Partial<Record<PlanRoom, number>>;

const row = (c: number) => Math.floor(c / GRID);
const col = (c: number) => c % GRID;
/** Share an edge. */
export const touches = (a: number, b: number) => Math.abs(row(a) - row(b)) + Math.abs(col(a) - col(b)) === 1;
/** Share an edge or a corner. */
export const near = (a: number, b: number) => a !== b && Math.max(Math.abs(row(a) - row(b)), Math.abs(col(a) - col(b))) === 1;

export const CORNERS = [0, 2, 6, 8];
/** The middle cell of each side, where a gate can stand. */
export const SIDE_MIDDLES = [1, 3, 5, 7];
/** The four edges, each its three cells. */
export const EDGES: readonly number[][] = [[0, 1, 2], [2, 5, 8], [6, 7, 8], [0, 3, 6]];

export interface Need {
  index: 1 | 2 | 3 | 4 | 5;
  rooms: PlanRoom[];
  met(board: Board, l: Layout): boolean;
}

/** The five needs, in the order the bell names them. A need with a room still in the tray is unmet. */
export const NEEDS: readonly Need[] = [
  { index: 1, rooms: ['kitchen', 'hall'], met: (_b, l) => l.kitchen !== undefined && l.hall !== undefined && touches(l.kitchen, l.hall) },
  { index: 2, rooms: ['kitchen'], met: (b, l) => l.kitchen !== undefined && near(l.kitchen, b.well) },
  { index: 3, rooms: ['stable'], met: (b, l) => l.stable !== undefined && touches(l.stable, b.gate) },
  { index: 4, rooms: ['storeroom'], met: (b, l) => l.storeroom === b.cool },
  { index: 5, rooms: ['solar'], met: (b, l) => l.solar !== undefined && b.sunny.includes(l.solar) },
];

/** The needs a layout leaves unmet, in order. */
export function check(board: Board, l: Layout): Need[] {
  return NEEDS.filter((n) => !n.met(board, l));
}

export const freeCells = (board: Board) => Array.from({ length: CELLS }, (_, c) => c).filter((c) => c !== board.well && c !== board.gate);

export const allPlaced = (l: Layout) => PLAN_ROOMS.every((r) => l[r] !== undefined);

/** Every placement of the five rooms into the free cells that meets all five needs. */
export function solutions(board: Board): Layout[] {
  const free = freeCells(board);
  const out: Layout[] = [];
  const walk = (i: number, l: Layout, used: Set<number>) => {
    if (i === PLAN_ROOMS.length) {
      if (check(board, l).length === 0) out.push({ ...l });
      return;
    }
    for (const c of free) {
      if (used.has(c)) continue;
      used.add(c);
      l[PLAN_ROOMS[i]] = c;
      walk(i + 1, l, used);
      delete l[PLAN_ROOMS[i]];
      used.delete(c);
    }
  };
  walk(0, {}, new Set());
  return out;
}

/** A board whose features obey the rules: a side-middle gate, a well off the gate's edge, a shaded corner off the sunny side, and at least two solutions. */
export function drawBoard(rng: Rng): Board {
  for (let tries = 0; tries < 200; tries++) {
    const gate = rng.pick(SIDE_MIDDLES);
    const gateEdge = EDGES.find((e) => e.includes(gate))!;
    const sunny = rng.pick(EDGES.filter((e) => e !== gateEdge));
    const cool = rng.pick(CORNERS.filter((c) => !sunny.includes(c)));
    const wells = Array.from({ length: CELLS }, (_, c) => c).filter((c) => c !== gate && c !== cool && !gateEdge.includes(c));
    const well = rng.pick(wells);
    const board = { well, gate, cool, sunny };
    if (solutions(board).length >= 2) return board;
  }
  // Every rule-abiding board has solutions (the test proves it); this is the typed fallback.
  return { well: 4, gate: 7, cool: 0, sunny: [2, 5, 8] };
}

/** One of her moves on the plan. `from`/`to` are cells, or 'tray'. A swap is a room onto another room's cell. */
export interface Move {
  room: PlanRoom;
  to: number | 'tray';
}

const key = (l: Layout) => PLAN_ROOMS.map((r) => (l[r] === undefined ? '-' : String(l[r]))).join('');

const roomAt = (l: Layout, c: number): PlanRoom | undefined => PLAN_ROOMS.find((r) => l[r] === c);

/** Apply a move: to the tray, to an empty cell, or onto another room (they swap; a tray room sends the other to the tray). */
export function applyMove(board: Board, l: Layout, m: Move): Layout {
  const next: Layout = { ...l };
  if (m.to === 'tray') { delete next[m.room]; return next; }
  if (!freeCells(board).includes(m.to)) return l;
  const other = roomAt(l, m.to);
  const from = l[m.room];
  if (other && other !== m.room) {
    if (from === undefined) delete next[other];
    else next[other] = from;
  }
  next[m.room] = m.to;
  return next;
}

/** Every move from a layout. */
export function moves(board: Board, l: Layout): Move[] {
  const out: Move[] = [];
  for (const room of PLAN_ROOMS) {
    if (l[room] !== undefined) out.push({ room, to: 'tray' });
    for (const c of freeCells(board)) if (l[room] !== c) out.push({ room, to: c });
  }
  return out;
}

const distances = new Map<string, Map<string, number>>();

/** Moves from every reachable layout to the nearest solution, by breadth-first search backwards from the solutions; cached per board. */
function distanceMap(board: Board): Map<string, number> {
  const id = `${board.well}${board.gate}${board.cool}${board.sunny.join('')}`;
  const cached = distances.get(id);
  if (cached) return cached;
  // Moves are reversible (a swap undoes itself, tray ↔ cell, cell ↔ cell), so a backward search uses the same moves.
  const dist = new Map<string, number>();
  let frontier: Layout[] = solutions(board);
  for (const s of frontier) dist.set(key(s), 0);
  let d = 0;
  while (frontier.length) {
    d++;
    const next: Layout[] = [];
    for (const l of frontier) {
      for (const m of moves(board, l)) {
        const n = applyMove(board, l, m);
        const k = key(n);
        if (!dist.has(k)) { dist.set(k, d); next.push(n); }
      }
    }
    frontier = next;
  }
  distances.set(id, dist);
  return dist;
}

/** Moves from this layout to the nearest solution. */
export function distance(board: Board, l: Layout): number {
  return distanceMap(board).get(key(l)) ?? Infinity;
}

/** The first step of a shortest move sequence to any solution; null once the layout is one. The glow follows it. */
export function hintFor(board: Board, l: Layout): Move | null {
  const dist = distanceMap(board);
  const here = dist.get(key(l)) ?? Infinity;
  if (here === 0) return null;
  let best: Move | null = null;
  for (const m of moves(board, l)) {
    const d = dist.get(key(applyMove(board, l, m))) ?? Infinity;
    if (d < here && (!best || d < (dist.get(key(applyMove(board, l, best))) ?? Infinity))) best = m;
  }
  return best;
}

export interface PlanState {
  layout: Layout;
  misses: number;
  hinted: boolean;
  done: boolean;
}

export function startPlan(): PlanState {
  return { layout: {}, misses: 0, hinted: false, done: false };
}

export function movePlan(board: Board, s: PlanState, m: Move): PlanState {
  return s.done ? s : { ...s, layout: applyMove(board, s.layout, m) };
}

export interface BellResult {
  state: PlanState;
  /** A room was still in the tray: the tray wobbles, nothing counts. */
  empty: boolean;
  unmet: Need[];
  /** This press lit the glow (the plan's one hint). */
  glowed: boolean;
}

/** Ring the bell: the one commit. Each unmet need is one miss; the second miss onwards glows the plan's one hint. */
export function ringBell(board: Board, s: PlanState): BellResult {
  if (s.done) return { state: s, empty: false, unmet: [], glowed: false };
  if (!allPlaced(s.layout)) return { state: s, empty: true, unmet: [], glowed: false };
  const unmet = check(board, s.layout);
  if (unmet.length === 0) return { state: { ...s, done: true }, empty: false, unmet, glowed: false };
  const misses = s.misses + unmet.length;
  const glowed = !s.hinted && misses >= 2;
  return { state: { ...s, misses, hinted: s.hinted || glowed }, empty: false, unmet, glowed };
}

export function askPlan(s: PlanState): PlanState {
  return s.hinted || s.done ? s : { ...s, hinted: true };
}

export function planTally(states: PlanState[]) {
  return { misses: states.reduce((n, s) => n + s.misses, 0), hints: states.filter((s) => s.hinted).length };
}

// ——— Level 5: read the ruin ———

/** The remains a roofless room can show, in table order (the order `decidingClue` reads). */
export type Clue = 'hearth' | 'oven' | 'dais' | 'drain' | 'mangers' | 'wide-door' | 'window-seat' | 'cellar-steps';
export const CLUES: readonly Clue[] = ['hearth', 'oven', 'dais', 'drain', 'mangers', 'wide-door', 'window-seat', 'cellar-steps'];

const ROOM_CLUES: Record<PlanRoom, readonly Clue[]> = {
  hall: ['hearth', 'dais'],
  kitchen: ['hearth', 'oven', 'drain'],
  stable: ['drain', 'mangers', 'wide-door'],
  storeroom: ['cellar-steps'],
  solar: ['window-seat'],
};

/** What a room of this kind always leaves behind, in table order. Fixed and true for every ruin. */
export function cluesOf(room: PlanRoom): readonly Clue[] {
  return ROOM_CLUES[room];
}

/** A clue two rooms share (the hearth: hall and kitchen; the drain: kitchen and stable): alone it does not decide. */
export function isShared(clue: Clue): boolean {
  return PLAN_ROOMS.filter((r) => ROOM_CLUES[r].includes(clue)).length > 1;
}

export interface RuinRoom {
  room: PlanRoom;
  cell: number;
  /** The remains drawn in the cell, in table order: at least one deciding clue, up to three. */
  shown: Clue[];
}

export interface Ruin {
  board: Board;
  /** Four of the five rooms, in cell order. */
  rooms: RuinRoom[];
}

/** Rooms in this many cells; the fifth label stays in the tray. */
export const RUIN_ROOMS = 4;

/** The first deciding clue a room shows, in table order. */
export function decidingClue(ruin: Ruin, room: PlanRoom): Clue {
  const r = ruin.rooms.find((x) => x.room === room);
  const shown = r ? r.shown : ROOM_CLUES[room];
  return shown.find((c) => !isShared(c)) ?? ROOM_CLUES[room].find((c) => !isShared(c))!;
}

/** Some clue shared by two rooms is shown in both of them, so one clue alone never settles the ruin. */
export function sharedShownTwice(ruin: Ruin): boolean {
  return CLUES.filter(isShared).some((c) => ruin.rooms.filter((r) => r.shown.includes(c)).length >= 2);
}

/** Four rooms in four non-feature cells, each showing a deciding clue and a seeded choice of its shared ones; redrawn until a shared clue shows twice. */
export function drawRuin(rng: Rng): Ruin {
  const board = drawBoard(rng);
  for (let tries = 0; tries < 200; tries++) {
    const rooms = rng.shuffle([...PLAN_ROOMS]).slice(0, RUIN_ROOMS);
    const cells = rng.shuffle(freeCells(board)).slice(0, RUIN_ROOMS);
    const placed: RuinRoom[] = rooms.map((room, i) => {
      const own = ROOM_CLUES[room];
      const deciding = own.filter((c) => !isShared(c));
      const keep = new Set<Clue>([rng.pick(deciding)]);
      for (const c of own) if (isShared(c) && keep.size < 3 && rng.chance(0.6)) keep.add(c);
      // A second deciding clue sometimes, room permitting.
      for (const c of deciding) if (keep.size < 3 && rng.chance(0.3)) keep.add(c);
      return { room, cell: cells[i], shown: CLUES.filter((c) => keep.has(c)) };
    }).sort((a, b) => a.cell - b.cell);
    const ruin = { board, rooms: placed };
    if (sharedShownTwice(ruin)) return ruin;
  }
  // The typed fallback (every seed in the tests finds a ruin before it): the hall and the kitchen share a hearth.
  const cells = freeCells(board).slice(0, RUIN_ROOMS);
  return {
    board,
    rooms: [
      { room: 'hall', cell: cells[0], shown: ['hearth', 'dais'] },
      { room: 'kitchen', cell: cells[1], shown: ['hearth', 'oven'] },
      { room: 'stable', cell: cells[2], shown: ['mangers'] },
      { room: 'solar', cell: cells[3], shown: ['window-seat'] },
    ],
  };
}

export interface RuinState {
  /** Labels settled on their rooms. */
  settled: PlanRoom[];
  misses: number;
  /** The ruin's one hint is spent and the glow is on until it is done. */
  hinted: boolean;
}

export function startRuin(): RuinState {
  return { settled: [], misses: 0, hinted: false };
}

export const roomInCell = (ruin: Ruin, cell: number) => ruin.rooms.find((r) => r.cell === cell);

export interface LabelResult {
  state: RuinState;
  settled: boolean;
  /** A wrong room: one miss, and the room's deciding clue to name. */
  missed: boolean;
  clue?: Clue;
  /** This miss lit the ruin's glow (its one hint). */
  glowed: boolean;
}

/** Drop a label on a cell: it settles on its own room; on another room it is one miss; anywhere else nothing happens. */
export function label(ruin: Ruin, s: RuinState, labelId: PlanRoom, cell: number): LabelResult {
  const none = { state: s, settled: false, missed: false, glowed: false };
  const at = roomInCell(ruin, cell);
  if (!at || s.settled.includes(at.room) || s.settled.includes(labelId)) return none;
  if (at.room === labelId) return { state: { ...s, settled: [...s.settled, labelId] }, settled: true, missed: false, glowed: false };
  const misses = s.misses + 1;
  const glowed = !s.hinted && misses >= 2;
  return { state: { ...s, misses, hinted: s.hinted || glowed }, settled: false, missed: true, clue: decidingClue(ruin, at.room), glowed };
}

/** Asked-for help: the glow, the ruin's one hint if not yet spent. */
export function askRuin(s: RuinState): RuinState {
  return s.hinted ? s : { ...s, hinted: true };
}

export const ruinDone = (ruin: Ruin, s: RuinState) => ruin.rooms.every((r) => s.settled.includes(r.room));

/** The room the label belongs on is not in this ruin: it stays in the tray. */
export const spareLabel = (ruin: Ruin) => PLAN_ROOMS.find((r) => !ruin.rooms.some((x) => x.room === r))!;

export type RuinHint = { spare: true } | { spare?: false; cell: number; clue: Clue; label: PlanRoom };

/** What the glow shows: the held label's room and its deciding clue; holding nothing, the first unlabelled room in cell order; holding the spare, the tray. */
export function ruinHint(ruin: Ruin, s: RuinState, held: PlanRoom | null = null): RuinHint | null {
  if (!s.hinted || ruinDone(ruin, s)) return null;
  if (held && held === spareLabel(ruin)) return { spare: true };
  const target = (held && !s.settled.includes(held) && ruin.rooms.find((r) => r.room === held)) || ruin.rooms.find((r) => !s.settled.includes(r.room))!;
  return { cell: target.cell, clue: decidingClue(ruin, target.room), label: target.room };
}

export function ruinTally(states: RuinState[]) {
  return { misses: states.reduce((n, s) => n + s.misses, 0), hints: states.filter((s) => s.hinted).length };
}

// ——— Level 6: stone or timber ———

export type Build = 'timber' | 'stone';
export const BUILDS_ORDER: readonly Build[] = ['timber', 'stone'];

/** Island numbers (decision 10): timber 2 bags, up in a season, lasts 15 years; stone 5 bags, 8 years to build, then stands. */
export const BUILDS = {
  timber: { bags: 2, lasts: 15 },
  stone: { bags: 5, building: 8 },
} as const;

export const TIMBER_FIT_YEARS = [10, 15, 20, 25, 30] as const;
export const STONE_FIT_YEARS = [35, 40, 45, 50] as const;
export const STONE_FIT_BAGS = [5, 6, 7, 8] as const;
/** The year bar marks, and the playback steps. */
export const YEAR_STEP = 5;

export interface Situation {
  /** Which island critter is the lord (an index into the scene's list). */
  lord: number;
  bags: number;
  years: number;
  /** Which choice this situation was drawn to fit. */
  kind: Build;
}

/** How many timber halls a stay needs: one per 15 years, the last lasting to the end. */
export const timberHalls = (years: number) => Math.ceil(years / BUILDS.timber.lasts);

/** What a choice would cost over the whole stay, purse or no purse. */
export function cost(s: Situation, b: Build): number {
  return b === 'timber' ? BUILDS.timber.bags * timberHalls(s.years) : BUILDS.stone.bags;
}

export const affordable = (s: Situation, b: Build) => cost(s, b) <= s.bags;

export function drawSituation(rng: Rng, kind: Build): Situation {
  const lord = rng.int(0, 5);
  if (kind === 'timber') {
    const years = rng.pick([...TIMBER_FIT_YEARS]);
    return { lord, years, bags: rng.int(cost({ lord, years, bags: 0, kind }, 'timber'), 6), kind };
  }
  return { lord, years: rng.pick([...STONE_FIT_YEARS]), bags: rng.pick([...STONE_FIT_BAGS]), kind };
}

/** The choice that is affordable and costs fewer bags over the stay. */
export function fits(s: Situation): Build {
  const ok = BUILDS_ORDER.filter((b) => affordable(s, b));
  return ok.reduce((best, b) => (cost(s, b) < cost(s, best) ? b : best), ok[0] ?? 'timber');
}

export type Hall = 'timber' | 'old-timber' | 'rotted' | 'scaffold' | 'stone' | 'half-up';

export interface YearStep {
  year: number;
  /** Bags left in the purse after this step. */
  purse: number;
  hall: Hall;
  /** What happened at this mark, for the sound and the pet. */
  event: 'built' | 'rebuilt' | 'rotted' | 'building' | 'finished' | 'ran-out' | null;
}

export interface Account {
  spent: number;
  end: 'standing' | 'rotted' | 'half-up';
  steps: YearStep[];
}

/** Play a choice over the stay in 5-year steps from year 0 to the last year. */
export function account(s: Situation, b: Build): Account {
  const steps: YearStep[] = [];
  let purse = s.bags;
  if (b === 'timber') {
    let hall: Hall = 'rotted';
    for (let year = 0; year <= s.years; year += YEAR_STEP) {
      const age = year % BUILDS.timber.lasts;
      let event: YearStep['event'] = null;
      // A new hall at year 0 and at each 15-year mark the stay goes on past.
      if (age === 0 && year < s.years) {
        if (purse >= BUILDS.timber.bags) {
          purse -= BUILDS.timber.bags;
          event = year === 0 ? 'built' : 'rebuilt';
          hall = 'timber';
        } else {
          event = year === 0 ? 'ran-out' : 'rotted';
          hall = 'rotted';
        }
      } else if (hall !== 'rotted') {
        hall = age === 0 || age >= BUILDS.timber.lasts - YEAR_STEP ? 'old-timber' : 'timber';
      }
      steps.push({ year, purse, hall, event });
    }
    const end = steps[steps.length - 1].hall === 'rotted' ? 'rotted' : 'standing';
    return { spent: s.bags - purse, end, steps };
  }
  if (purse < BUILDS.stone.bags) {
    // The masons work while the bags last; the walls stop half up.
    for (let year = 0; year <= s.years; year += YEAR_STEP) {
      steps.push({ year, purse: 0, hall: year === 0 ? 'scaffold' : 'half-up', event: year === 0 ? 'building' : year === YEAR_STEP ? 'ran-out' : null });
    }
    return { spent: s.bags, end: 'half-up', steps };
  }
  purse -= BUILDS.stone.bags;
  for (let year = 0; year <= s.years; year += YEAR_STEP) {
    const up = year >= BUILDS.stone.building;
    const first = up && year - YEAR_STEP < BUILDS.stone.building;
    steps.push({ year, purse, hall: up ? 'stone' : 'scaffold', event: year === 0 ? 'building' : first ? 'finished' : null });
  }
  return { spent: BUILDS.stone.bags, end: 'standing', steps };
}

export interface BuildState {
  /** The choice the last Build played out. */
  choice: Build | null;
  /** Keep it presses after the other choice. */
  refusals: number;
  hinted: boolean;
  done: boolean;
}

export function startBuild(): BuildState {
  return { choice: null, refusals: 0, hinted: false, done: false };
}

/** Build: the years play out. The fitting choice finishes the situation; the other asks (never a miss). Building again is free. */
export function placeBuild(sit: Situation, s: BuildState, b: Build): BuildState {
  if (s.done) return s;
  return { ...s, choice: b, done: b === fits(sit) };
}

/** Keep it after the other choice: the first replays and asks again; the second glows (one hint) and finishes as she left it. */
export function keepBuild(sit: Situation, s: BuildState): BuildState {
  if (s.done || !s.choice || s.choice === fits(sit)) return s;
  const refusals = s.refusals + 1;
  if (refusals >= 2) return { ...s, refusals, hinted: true, done: true };
  return { ...s, refusals };
}

/** Asked-for help before the situation is done: the fitting row glows, its one hint. */
export function askBuild(s: BuildState): BuildState {
  return s.hinted || s.done ? s : { ...s, hinted: true };
}

export function buildTally(states: BuildState[]) {
  return { misses: 0, hints: states.filter((s) => s.hinted).length };
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (r: Rect, v: View) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;

/** The home button (top-left) and the pet (bottom-left) keep these corners. */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export const DOOR = { w: 150, h: 200 };
export const WELL = { w: 130, h: 130 };
export const FIGURE = { w: 120, h: 140 };
export const YARD_ROOM = { w: 220, h: 200 };
export const TILE = { w: 110, h: 110 };
export const SPOT = { w: 130, h: 130 };
export const FIXED = { w: 200, h: 200 };
export const CELL = 120;
export const CELL_GAP = 8;
export const CARD = { w: 220, h: 100 };
export const BELL = { w: 140, h: 110 };
export const KEEP = { w: 180, h: 100 };
export const ROW = { w: 340, h: 110 };
export const BUTTON = { w: 140, h: 110 };
/** One walking step across the yard at level 3, in units. */
export const STEP = 75;
const M = 20;
const GAP = 16;

export interface KeepLayout {
  /** Level 1: the doors left to right, and the well. */
  doors?: Rect[];
  well?: Rect;
  /** Level 2: the figures' tray slots and the three rooms. */
  slots?: Rect[];
  rooms?: Rect[];
  /** Level 3: the yard strip (`fixedRect` and `spotRects` place a placement's fixed room and spots on it), the tile's tray slot and the Keep it control. */
  yard?: Rect;
  tile?: Rect;
  keep?: Rect;
  /** Level 4: the five tray slots (hall, kitchen, stable, storeroom, solar), the nine cells, the five need cards and the bell. */
  tray?: Rect[];
  cells?: Rect[];
  cards?: Rect[];
  bell?: Rect;
  /** Level 6: the lord's strip (lord, purse and year bar), the hall's site, the timber and stone rows, Build and Keep it. Level 5 uses `tray` (five labels) and `cells`. */
  lord?: Rect;
  site?: Rect;
  rows?: Rect[];
  build?: Rect;
  /** The ground line things stand on. */
  ground: number;
  /** Every touch target, for the fit checks. */
  inputs: Rect[];
}

/** The fixed room (hall or gate) stands at the yard's left or right end. */
export function fixedRect(p: Placement, yard: Rect): Rect {
  return { x: p.side === 'left' ? yard.x : yard.x + yard.w - FIXED.w, y: yard.y, w: FIXED.w, h: FIXED.h };
}

/** The yard's spots for a placement: `STEP` units per walking step from the fixed room's near edge. */
export function spotRects(p: Placement, yard: Rect): { near: Rect; far: Rect } {
  const fixed = fixedRect(p, yard);
  const at = (steps: number): Rect => {
    const cx = p.side === 'left' ? fixed.x + fixed.w + 60 + steps * STEP : fixed.x - 60 - steps * STEP;
    return { x: cx - SPOT.w / 2, y: fixed.y + fixed.h - SPOT.h, w: SPOT.w, h: SPOT.h };
  };
  return { near: at(p.near), far: at(p.far) };
}

export function keepLayout(brief: Brief, v: View): KeepLayout | null {
  const wide = v.w >= v.h;
  const left = HOME_CORNER.w + M;
  const cx = v.w / 2;
  let l: KeepLayout;
  if (brief.id === 'doors') {
    const n = brief.doors.length;
    const top = wide ? 220 : 320;
    const span = n * DOOR.w + (n - 1) * GAP;
    const wellSide = WELL.w + GAP * 2;
    const start = cx - (span + wellSide) / 2 + (brief.well === 'left' ? wellSide : 0);
    const doors = Array.from({ length: n }, (_, i) => ({ x: start + i * (DOOR.w + GAP), y: top, w: DOOR.w, h: DOOR.h }));
    const well: Rect = { x: brief.well === 'left' ? start - wellSide : start + span + GAP * 2, y: top + DOOR.h - WELL.h, w: WELL.w, h: WELL.h };
    l = { doors, well, ground: top + DOOR.h, inputs: [...doors, well] };
  } else if (brief.id === 'workplaces') {
    const slotsY = wide ? 40 : 120;
    const slots = [0, 1, 2].map((i) => ({ x: cx - (3 * FIGURE.w + 2 * 40) / 2 + i * (FIGURE.w + 40), y: slotsY, w: FIGURE.w, h: FIGURE.h }));
    const roomsY = slotsY + FIGURE.h + (wide ? 60 : 140);
    const rooms = [0, 1, 2].map((i) => ({ x: cx - (3 * YARD_ROOM.w + 2 * GAP) / 2 + i * (YARD_ROOM.w + GAP), y: roomsY, w: YARD_ROOM.w, h: YARD_ROOM.h }));
    l = { slots, rooms, ground: roomsY + YARD_ROOM.h, inputs: [...slots, ...rooms] };
  } else if (brief.id === 'walk') {
    const total = FIXED.w + 60 + 6 * STEP + SPOT.w / 2;
    const top = wide ? 250 : 380;
    const yard: Rect = { x: Math.max(left, cx - total / 2), y: top, w: total, h: FIXED.h };
    const tile: Rect = { x: cx - TILE.w / 2, y: wide ? 50 : 150, w: TILE.w, h: TILE.h };
    const keep: Rect = { x: cx - KEEP.w / 2, y: top + FIXED.h + 40, w: KEEP.w, h: KEEP.h };
    l = { yard, tile, keep, ground: top + FIXED.h, inputs: [tile, keep] };
    // The spots belong to the placement in play (the scene calls spotRects with the current one); both placements must fit.
    for (const q of brief.placements) {
      const fixed = fixedRect(q, yard);
      const s = spotRects(q, yard);
      if (!inside(fixed, v) || !inside(s.near, v) || !inside(s.far, v) || overlaps(s.near, s.far) || overlaps(s.near, fixed) || overlaps(s.far, fixed)) return null;
      if (corners(v).some((c) => overlaps(s.near, c) || overlaps(s.far, c))) return null;
    }
  } else if (brief.id === 'build') {
    const lord: Rect = wide ? { x: left, y: 30, w: Math.min(v.w - M - left, 760), h: 130 } : { x: left, y: 110, w: Math.min(v.w - M - left, 760), h: 130 };
    let rows: Rect[], build: Rect, keep: Rect, site: Rect;
    if (wide) {
      const top = lord.y + lord.h + 30;
      rows = [0, 1].map((i) => ({ x: left, y: top + i * (ROW.h + GAP), w: ROW.w, h: ROW.h }));
      const cy = top + 2 * (ROW.h + GAP) + 10;
      build = { x: left, y: cy, w: BUTTON.w, h: BUTTON.h };
      keep = { x: left + ROW.w - BUTTON.w, y: cy, w: BUTTON.w, h: BUTTON.h };
      const sx = left + ROW.w + 40;
      site = { x: sx, y: top, w: Math.min(v.w - M - sx, 520), h: cy + BUTTON.h - top };
    } else {
      const top = lord.y + lord.h + 30;
      site = { x: cx - 300, y: top, w: 600, h: 360 };
      const ry = top + site.h + 30;
      rows = [0, 1].map((i) => ({ x: cx - ROW.w / 2, y: ry + i * (ROW.h + GAP), w: ROW.w, h: ROW.h }));
      const cy = ry + 2 * (ROW.h + GAP) + 10;
      build = { x: cx - ROW.w / 2, y: cy, w: BUTTON.w, h: BUTTON.h };
      keep = { x: cx + ROW.w / 2 - BUTTON.w, y: cy, w: BUTTON.w, h: BUTTON.h };
    }
    if (site.w < 300 || !inside(site, v) || corners(v).some((c) => overlaps(site, c))) return null;
    l = { lord, site, rows, build, keep, ground: site.y + site.h, inputs: [...rows, build, keep] };
  } else {
    const trayY = wide ? 30 : 120;
    const trayW = 5 * TILE.w + 4 * 14;
    const gridW = GRID * CELL + (GRID - 1) * CELL_GAP;
    const gridX = wide ? left + 30 : cx - gridW / 2;
    const gridY = trayY + TILE.h + (wide ? 40 : 120);
    const trayX = wide ? left : cx - trayW / 2;
    const tray = PLAN_ROOMS.map((_, i) => ({ x: trayX + i * (TILE.w + 14), y: trayY, w: TILE.w, h: TILE.h }));
    const cells = Array.from({ length: CELLS }, (_, c) => ({ x: gridX + col(c) * (CELL + CELL_GAP), y: gridY + row(c) * (CELL + CELL_GAP), w: CELL, h: CELL }));
    const bell: Rect = wide
      ? { x: gridX + gridW + 50, y: gridY + gridW - BELL.h, w: BELL.w, h: BELL.h }
      : { x: cx - BELL.w / 2, y: gridY + gridW + 40, w: BELL.w, h: BELL.h };
    // Landscape keeps the need cards down the right; portrait stacks them under the bell in a row of three and a row of two.
    const cards: Rect[] = wide
      ? NEEDS.map((_, i) => ({ x: v.w - M - CARD.w, y: trayY + i * (CARD.h + 8), w: CARD.w, h: CARD.h }))
      : NEEDS.map((_, i) => {
        const r = i < 3 ? 0 : 1;
        const n = r === 0 ? 3 : 2;
        const k = r === 0 ? i : i - 3;
        return { x: cx - (n * CARD.w + (n - 1) * GAP) / 2 + k * (CARD.w + GAP), y: bell.y + BELL.h + 30 + r * (CARD.h + 8), w: CARD.w, h: CARD.h };
      });
    // The ruin (level 5) is the same tray and plan with no bell or need cards: a label's drop is the commit.
    l = brief.id === 'ruin'
      ? { tray, cells, ground: gridY + gridW, inputs: [...tray, ...cells] }
      : { tray, cells, cards, bell, ground: gridY + gridW, inputs: [...tray, ...cells, ...cards, bell] };
  }
  if (!l.inputs.every((p) => inside(p, v))) return null;
  if (l.inputs.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (l.inputs.some((p, i) => l.inputs.some((q, j) => i < j && overlaps(p, q)))) return null;
  return l;
}
