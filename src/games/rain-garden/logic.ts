/**
 * Rain Garden: four drops of rain fall on a little patch of ground. Garden soil holds two of them; stone holds none.
 * What the patch can't hold runs down a fixed arrow into a pond. She changes the ground and rains again to compare.
 * The model, the round's state, finishing, hints and the layout are here; drawing and timing are in index.ts.
 *
 * The capacities are invented teaching numbers (not litres, rainfall depth or a soaking rate); the grown-ups' card says so.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export const SURFACES = ['stone', 'soil'] as const;
export type Surface = (typeof SURFACES)[number];
export const CAPACITY: Record<Surface, number> = { stone: 0, soil: 2 };
/** One shower at levels 1–3. */
export const SHOWER = 4;

export interface Patch {
  surface: Surface;
  stored: number;
}
export interface Pond {
  water: number;
}
export interface Step {
  unit: number;
  to: 'patch' | 'pond';
}

/** Rain `units` drops, one at a time: each goes into the patch while it has room, otherwise down the arrow to the pond. */
export function runShower(
  patch: Patch,
  pond: Pond,
  units = SHOWER,
): { patch: Patch; pond: Pond; steps: Step[] } {
  let stored = patch.stored,
    water = pond.water;
  const steps: Step[] = [];
  for (let unit = 0; unit < units; unit++) {
    if (stored < CAPACITY[patch.surface]) {
      stored++;
      steps.push({ unit, to: 'patch' });
    } else {
      water++;
      steps.push({ unit, to: 'pond' });
    }
  }
  return { patch: { surface: patch.surface, stored }, pond: { water }, steps };
}

export interface Trial {
  surface: Surface;
  steps: Step[];
  stored: number;
  pond: number;
}

/** A trial always starts fresh: a dry, empty patch and an empty pond. */
export function trial(surface: Surface): Trial {
  const r = runShower({ surface, stored: 0 }, { water: 0 });
  return { surface, steps: r.steps, stored: r.patch.stored, pond: r.pond.water };
}

/** Level 2: the same shower on two patches, each with its own pond and the same route. */
export function runPair(left: Surface, right: Surface): [Trial, Trial] {
  return [trial(left), trial(right)];
}

export function compare(bookmark: Trial, current: Trial) {
  return {
    sameSurface: bookmark.surface === current.surface,
    storedDiff: current.stored - bookmark.stored,
    pondDiff: current.pond - bookmark.pond,
  };
}

export const flip = (s: Surface): Surface => (s === 'stone' ? 'soil' : 'stone');

// ---- levels ----

export interface Plan {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
}
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Rain on the garden: tap the cloud and watch where four drops go' },
  { level: 2, name: 'Two gardens, same rain: pick stone or soil for each, then rain on both' },
  { level: 3, name: 'Change it and try again: the first rain is kept on a card to compare' },
  { level: 4, name: 'Two beds downhill: change the ground so the leaf bed gets two drops and the pond some' },
  { level: 5, name: 'Three beds downhill: leave enough rain for every marked bed and some for the pond' },
];
export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 5 },
};
export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(5, Math.round(level))) - 1];
}

export type Friend = 'frog' | 'duck' | 'turtle';
export const FRIENDS: readonly Friend[] = ['frog', 'duck', 'turtle'];

export interface Round {
  level: 1 | 2 | 3;
  /** The starting ground of each patch (one, or left and right at level 2). */
  start: Surface[];
  friend: Friend;
  /** Level 1: the cloud and patch sit on the right and the arrow runs left. */
  mirror: boolean;
}

/** The authored first round of each level, then seeded rounds within the variation the definition lists. */
export function makeRound(level: number, rng: Rng, authored: boolean): Round {
  // Level 4 has its own round (`makeRoute`); the levels-1–3 board stops at level 3.
  const p = Math.min(3, planFor(level).level) as 1 | 2 | 3;
  if (authored)
    return {
      level: p,
      start: p === 1 ? ['soil'] : p === 2 ? ['stone', 'soil'] : ['stone'],
      friend: 'frog',
      mirror: false,
    };
  const friend = rng.pick(FRIENDS);
  if (p === 1) return { level: 1, start: ['soil'], friend, mirror: rng.chance(0.5) };
  if (p === 2) return { level: 2, start: [rng.pick(SURFACES), rng.pick(SURFACES)], friend, mirror: false };
  return { level: 3, start: [rng.pick(SURFACES)], friend, mirror: false };
}

/** What a round has done so far. `current` is the settled trial on each patch, or null while the ground is fresh. */
export interface RoundState {
  level: 1 | 2 | 3;
  surfaces: Surface[];
  current: Trial[] | null;
  /** Level 3: the round's first trial, set once. */
  bookmark: Trial | null;
  /** Settled trials (level 2: settled pairs). */
  trials: number;
  /** Level 3: settled trials after the bookmark. */
  compared: number;
}

export function freshState(round: Round): RoundState {
  return {
    level: round.level,
    surfaces: round.start.slice(),
    current: null,
    bookmark: null,
    trials: 0,
    compared: 0,
  };
}

/**
 * Rain once. Every rain starts on fresh ground. At level 3 the first trial becomes the bookmark and the patch is fresh
 * again (`current` stays null); later trials replace `current` only.
 */
export function rain(s: RoundState): { state: RoundState; trials: Trial[] } {
  const trials = s.surfaces.map(trial);
  if (s.level === 3 && !s.bookmark)
    return { state: { ...s, current: null, bookmark: trials[0], trials: s.trials + 1 }, trials };
  return {
    state: {
      ...s,
      current: trials,
      trials: s.trials + 1,
      compared: s.level === 3 ? s.compared + 1 : s.compared,
    },
    trials,
  };
}

/** Change one patch's ground. Every patch goes back to fresh (level 2: both, so the pair stays fair). The bookmark stays. */
export function setSurface(s: RoundState, i: number, surface: Surface): RoundState {
  const surfaces = s.surfaces.slice();
  surfaces[i] = surface;
  return { ...s, surfaces, current: null };
}

/** Start again: the same board from fresh. The bookmark and the trial counts go too (hints are the scene's and stay). */
export function restartState(round: Round): RoundState {
  return freshState(round);
}

export function canFinish(s: RoundState): boolean {
  if (s.level === 3) return !!s.bookmark && !!s.current && s.current[0].surface !== s.bookmark.surface;
  return s.current !== null;
}

/** When the leaf glows as a comfortable-stopping cue (not a hint): the third rain at level 1, the second pair or comparison after. */
export function enough(s: RoundState): boolean {
  if (s.level === 1) return s.trials >= 3;
  if (s.level === 2) return s.trials >= 2 && s.current !== null;
  return s.compared >= 2 && canFinish(s);
}

export type Action = { kind: 'cloud' } | { kind: 'tile'; patch: number; surface: Surface } | { kind: 'leaf' };

/**
 * The next useful action, for a requested hint and the ghost finger: rain if nothing has settled; at level 2 after a pair
 * on the same ground, change the left one; at level 3 after the bookmark, the other ground; otherwise the leaf.
 */
export function nextAction(s: RoundState): Action {
  if (s.level === 3) {
    if (!s.bookmark) return { kind: 'cloud' };
    if (s.surfaces[0] === s.bookmark.surface)
      return { kind: 'tile', patch: 0, surface: flip(s.bookmark.surface) };
    return s.current ? { kind: 'leaf' } : { kind: 'cloud' };
  }
  if (!s.current) return { kind: 'cloud' };
  if (s.level === 2 && s.surfaces[0] === s.surfaces[1] && s.trials < 2)
    return { kind: 'tile', patch: 0, surface: flip(s.surfaces[0]) };
  return { kind: 'leaf' };
}

// ---- layout ----

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface BoardLayout {
  patch: Box;
  pockets: Box[];
  /** The downhill arrow, from the patch's low edge to the pond. */
  arrow: { x1: number; y1: number; x2: number; y2: number };
  pond: Box;
  slots: Box[];
  friend: { x: number; y: number };
}
export interface Layout {
  cloud: Box;
  boards: BoardLayout[];
  /** Level 2: one per patch, under it. Level 3: stone then soil, under the board. Level 1: none. */
  tiles: Box[];
  leaf: Box;
  /** Level 3's kept first trial. */
  bookmark: Box | null;
}

export const LEAF = 120,
  TILE = 140,
  TILE2 = 130;
/** The frame every board is drawn in, centered in the view. */
const FW = 1024,
  FH = 768;
/** The upright frame (`UPRIGHT_W` × `UPRIGHT_H` in engine/view.ts). */
const UW = 768,
  UH = 1024;

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** One board: patch, two pockets, arrow, pond with four slots, its friend. `dir` 1 runs the arrow right, -1 left. */
function board(
  px: number,
  py: number,
  pw: number,
  ph: number,
  qx: number,
  qy: number,
  qw: number,
  slot: number,
  gap: number,
  dir: 1 | -1,
): BoardLayout {
  const patch = box(px, py, pw, ph);
  const pockets = [-1, 1].map((k) => box(px + k * pw * 0.22, py + ph * 0.08, Math.min(96, pw * 0.27), 60));
  const pond = box(qx, qy, qw, slot + 30);
  const slots = [-1.5, -0.5, 0.5, 1.5].map((k) => box(qx + k * gap, qy, slot, slot));
  const edge = px + (dir * pw) / 2;
  // The arrow runs downhill and onward: into the pond's near end when the pond lies beyond the patch, else straight down.
  const near = qx - dir * (qw / 2 - 30);
  const x2 = dir * (near - edge) > 0 ? near : edge - dir * 20;
  const arrow = { x1: edge - dir * 10, y1: py + ph / 2 - 16, x2, y2: qy - pond.h / 2 - 6 };
  // The friend sits at the pond's other end from the arrow.
  const friend = {
    x: dir * (x2 - qx) > 0 ? qx - dir * (qw / 2 - 40) : qx + dir * (qw / 2 - 40),
    y: qy - pond.h / 2 - 34,
  };
  return { patch, pockets, arrow, pond, slots, friend };
}

/** Every rectangle the round needs, in view units; null if a view cannot hold the boards without shrinking a target. */
export function rainLayout(
  view: { w: number; h: number; upright?: true },
  level: number,
  mirror = false,
): Layout | null {
  const { w, h } = view;
  if (view.upright) return uprightRainLayout(w, h, level);
  if (w < FW - 1 || h < FH - 1) return null;
  const ox = (w - FW) / 2,
    oy = (h - FH) / 2;
  const leaf = box(w - 20 - LEAF / 2, 18 + LEAF / 2, LEAF, LEAF);
  const p = Math.min(3, planFor(level).level);
  if (p === 2) {
    const boards = [360, 790].map((bx) =>
      board(ox + bx, oy + 305, 300, 150, ox + bx + 60, oy + 550, 270, 56, 64, 1),
    );
    const tiles = [360, 790].map((bx) => box(ox + bx - 50, oy + 690, TILE2, TILE2));
    return { cloud: box(ox + 575, oy + 150, 600, 140), boards, tiles, leaf, bookmark: null };
  }
  // One board. Mirroring swaps the patch and the pond about the frame's middle.
  const mid = 572;
  const mx = (x: number) => ox + (mirror ? 2 * mid - x : x);
  const dir = mirror ? -1 : 1;
  const b = board(mx(400), oy + 330, 360, 180, mx(800), oy + 560, 320, 60, 76, dir);
  const tiles = p === 3 ? [box(ox + 320, oy + 680, TILE, TILE), box(ox + 480, oy + 680, TILE, TILE)] : [];
  const bookmark = p === 3 ? box(ox + 770, oy + 220, 220, 160) : null;
  return { cloud: box(mx(400), oy + 150, 260, 140), boards: [b], tiles, leaf, bookmark };
}

/**
 * The upright 768 × 1024 plan (levels 1–3): the cloud, then the garden bed, then the pond stack down the screen, the whole
 * frame hanging up from the bottom edge so a tall phone's spare height is sky at the top. The pond sits at the middle,
 * clear of the guide corner; mirroring is not needed (the pet is never beside the pond), so it is ignored.
 */
function uprightRainLayout(w: number, h: number, level: number): Layout | null {
  if (w < UW - 1 || h < UH - 1) return null;
  const ox = (w - UW) / 2,
    oy = h - UH;
  const leaf = box(w - 20 - LEAF / 2, 18 + LEAF / 2, LEAF, LEAF);
  const p = Math.min(3, planFor(level).level);
  const cx = ox + UW / 2;
  if (p === 2) {
    const xs = [192, 576];
    const boards = xs.map((bx) => board(ox + bx, oy + 450, 300, 150, ox + bx, oy + 690, 270, 56, 64, 1));
    const tiles = [270, 576].map((tx) => box(ox + tx, oy + 880, TILE2, TILE2));
    return { cloud: box(cx, oy + 290, 600, 140), boards, tiles, leaf, bookmark: null };
  }
  const b = board(cx, oy + 450, 360, 180, cx, oy + 740, 320, 60, 76, 1);
  const tiles = p === 3 ? [box(ox + 300, oy + 880, TILE, TILE), box(ox + 460, oy + 880, TILE, TILE)] : [];
  const bookmark = p === 3 ? box(ox + 640, oy + 260, 220, 160) : null;
  return { cloud: box(cx, oy + 150, 260, 140), boards: [b], tiles, leaf, bookmark };
}

/** The sticker's pond friend and drop count, seeded. */
export function stickerPick(seed: number): { friend: Friend; drops: number } {
  const n = Math.abs(Math.floor(seed));
  return { friend: FRIENDS[n % 3], drops: 1 + (Math.floor(n / 3) % 2) };
}

// ---- levels 4 and 5: beds downhill ----
//
// Sockets in a fixed chain: the shower falls on the top bed (0), and what a bed can't hold runs down its fixed arrow to
// the next bed and finally into the pond. Level 4 has two tappable beds, one marked; level 5 has three sockets on six
// authored boards, some fixed (the tree's bed, the stone path), one or two marked, and a shower of four or six drops.
// A marked bed must keep exactly two; the pond must get at least one. She sets the beds' ground, tries it, then checks.

/** Where a drop can be: a socket's index, or the pond. */
export type Place = number | 'pond';
/** Each socket names where its overflow runs. */
export interface Link {
  down: Place;
}
export const ROUTE4: readonly Link[] = [{ down: 1 }, { down: 'pond' }];
export const ROUTE5: readonly Link[] = [{ down: 1 }, { down: 2 }, { down: 'pond' }];
/** One drop's trip: every place it visited in order; the last is where it is counted. */
export interface RouteStep {
  unit: number;
  path: Place[];
}
export interface RouteTrial {
  sockets: Surface[];
  steps: RouteStep[];
  stored: number[];
  pond: number;
}

/**
 * Rain `units` drops, one at a time, on socket 0. A drop stays in a socket with room; otherwise it follows that socket's
 * `down`, until it stays or reaches the pond. Every trial starts fresh.
 */
export function runRoute(
  sockets: readonly Surface[],
  route: readonly Link[] = ROUTE4,
  units = SHOWER,
): RouteTrial {
  const stored = sockets.map(() => 0);
  let pond = 0;
  const steps: RouteStep[] = [];
  for (let unit = 0; unit < units; unit++) {
    const path: Place[] = [];
    let at: Place = 0;
    // A chain visits each socket at most once, so this always ends in a socket or the pond.
    for (let hop = 0; hop <= sockets.length; hop++) {
      path.push(at);
      if (at === 'pond') {
        pond++;
        break;
      }
      if (stored[at] < CAPACITY[sockets[at]]) {
        stored[at]++;
        break;
      }
      at = route[at].down;
    }
    steps.push({ unit, path });
  }
  return { sockets: sockets.slice(), steps, stored, pond };
}

/** A socket she cannot change: the tree's bed is always soil, the stone path always stone. */
export type Fixed = 'tree' | 'path';
export const FIXED_SURFACE: Record<Fixed, Surface> = { tree: 'soil', path: 'stone' };
/** The picture on a marked bed and its sign: the uphill marked bed has the leaf, a second one the flower. */
export type Marker = 'leaf' | 'flower';

/** One board: its chain, which sockets are fixed, which beds are marked, and how much rain falls (drawn on the cloud). */
export interface RouteBoard {
  id: string;
  route: readonly Link[];
  /** Per socket, top first: null for a bed she can flip, or what is fixed there. */
  fixed: readonly (Fixed | null)[];
  /** The marked beds, uphill first; each must keep exactly two. */
  marked: readonly { socket: number; marker: Marker }[];
  units: number;
}

/** Level 4's board: two beds, one marked with the leaf, four drops. */
export const board4 = (bed: 0 | 1): RouteBoard => ({
  id: bed ? 'low' : 'top',
  route: ROUTE4,
  fixed: [null, null],
  marked: [{ socket: bed, marker: 'leaf' }],
  units: SHOWER,
});

const three = (
  id: string,
  marked: number[],
  fixed: (Fixed | null)[] = [null, null, null],
  units = 6,
): RouteBoard => ({
  id,
  route: ROUTE5,
  fixed,
  marked: marked.map((socket, i) => ({ socket, marker: i === 0 ? 'leaf' : 'flower' })),
  units,
});

/** Level 5's six authored boards (docs/definitions/rain-garden.md#the-six-boards); A is the authored first board. */
export const BOARDS5: readonly RouteBoard[] = [
  three('A', [1, 2]),
  three('B', [0, 2]),
  three('C', [2], [null, 'tree', null]),
  three('D', [2], [null, 'path', null]),
  three('E', [1]),
  three('F', [2], [null, null, null], 4),
];

export const runBoard = (sockets: readonly Surface[], board: RouteBoard) =>
  runRoute(sockets, board.route, board.units);

/** Each marked bed must keep exactly two (in `board.marked` order); the pond must get at least one. */
export function meets(t: RouteTrial, board: RouteBoard): { beds: boolean[]; pond: boolean } {
  return { beds: board.marked.map((m) => t.stored[m.socket] === 2), pond: t.pond >= 1 };
}
const passes = (sockets: readonly Surface[], board: RouteBoard) => {
  const m = meets(runBoard(sockets, board), board);
  return m.beds.every(Boolean) && m.pond;
};
export const arrangementKey = (sockets: readonly Surface[]) => sockets.join('/');

/** Every arrangement of a board, top socket first and stone before soil, fixed sockets on their own ground. */
export function arrangements(board: RouteBoard): Surface[][] {
  let out: Surface[][] = [[]];
  for (const f of board.fixed) {
    const options: readonly Surface[] = f ? [FIXED_SURFACE[f]] : SURFACES;
    out = out.flatMap((a) => options.map((x) => [...a, x]));
  }
  return out;
}
/** Level 4's four arrangements, top bed first. */
export const ARRANGEMENTS: readonly Surface[][] = arrangements(board4(1));

/** Every arrangement that meets every need. */
export function solutions(board: RouteBoard): Surface[][] {
  return arrangements(board).filter((a) => passes(a, board));
}

const distance = (a: readonly Surface[], b: readonly Surface[]) => a.filter((s, i) => s !== b[i]).length;

/** The solution that differs from `sockets` in the fewest beds; ties go to the first in enumeration order. */
export function nearest(sockets: readonly Surface[], board: RouteBoard): Surface[] {
  let best: Surface[] | null = null;
  for (const sol of solutions(board)) if (!best || distance(sockets, sol) < distance(sockets, best)) best = sol;
  return best!;
}

/** The bed a worked step flips and the glow marks: the first, from the top, that differs from `nearest`; null when it passes. */
export function stepBed(sockets: readonly Surface[], board: RouteBoard): number | null {
  const goal = nearest(sockets, board);
  const i = sockets.findIndex((s, k) => s !== goal[k] && !board.fixed[k]);
  return i < 0 ? null : i;
}

export interface RouteRound {
  level: 4 | 5;
  board: RouteBoard;
  start: Surface[];
  friend: Friend;
  /** Level 4: the cloud and the top bed on the right, the arrows running left. Never at level 5. */
  mirror: boolean;
}

/**
 * Level 4's authored board is soil over stone with the low bed marked; level 5's is board A from soil / soil / stone.
 * A seeded round picks its variant (level 4) or board (level 5), then one of its failing arrangements.
 */
export function makeRoute(rng: Rng, authored: boolean, level: 4 | 5 = 4): RouteRound {
  if (level === 5) {
    if (authored)
      return { level: 5, board: BOARDS5[0], start: ['soil', 'soil', 'stone'], friend: 'frog', mirror: false };
    const board = rng.pick(BOARDS5);
    const failing = arrangements(board).filter((a) => !passes(a, board));
    return { level: 5, board, start: rng.pick(failing).slice(), friend: rng.pick(FRIENDS), mirror: false };
  }
  if (authored) return { level: 4, board: board4(1), start: ['soil', 'stone'], friend: 'frog', mirror: false };
  const board = board4(rng.chance(0.5) ? 1 : 0);
  const failing = ARRANGEMENTS.filter((a) => !passes(a, board));
  return {
    level: 4,
    board,
    start: rng.pick(failing).slice(),
    friend: rng.pick(FRIENDS),
    mirror: rng.chance(0.5),
  };
}

export interface RouteState {
  sockets: Surface[];
  /** The settled run of the current arrangement, or null while the beds are fresh. */
  current: RouteTrial | null;
  /** The arrangement last judged by a failed Check. */
  checked: string | null;
  misses: number;
  hints: number;
  /** The bed the causal glow marks, or null. */
  glow: number | null;
  glowShown: boolean;
  /** A requested hint is pointing at the Check. */
  pointing: boolean;
  passed: boolean;
}

export function routeFresh(round: RouteRound): RouteState {
  return {
    sockets: round.start.slice(),
    current: null,
    checked: null,
    misses: 0,
    hints: 0,
    glow: null,
    glowShown: false,
    pointing: false,
    passed: false,
  };
}

/** The cloud: a free, unscored trial of the current arrangement. */
export function tryRoute(s: RouteState, round: RouteRound): RouteState {
  return { ...s, current: runBoard(s.sockets, round.board) };
}

/**
 * Flip one bed's ground. Every bed and the pond go back to fresh; a lit glow moves to the bed the new arrangement still
 * needs changed. A fixed socket never changes (the scene says why).
 */
export function flipBed(s: RouteState, i: number, board: RouteBoard): RouteState {
  if (board.fixed[i]) return s;
  const sockets = s.sockets.slice();
  sockets[i] = flip(sockets[i]);
  return { ...s, sockets, current: null, pointing: false, glow: s.glowShown ? stepBed(sockets, board) : null };
}

export type Cause = 'dry' | 'pond';
export interface Verdict {
  result: 'pass' | 'miss' | 'again' | 'ignored';
  cause: Cause | null;
  /** For a dry cause: the uphill-most marked bed that did not keep two (its index in `board.marked`). */
  need: number | null;
}

/**
 * The Check: runs the shower if the arrangement hasn't settled, then judges every need. A failed Check counts one miss,
 * unless it judges the same arrangement as the last failed one. From the second miss the glow marks the bed to change,
 * counting one hint the first time it lights.
 */
export function check(s: RouteState, round: RouteRound): { state: RouteState; verdict: Verdict } {
  if (s.passed) return { state: s, verdict: { result: 'ignored', cause: null, need: null } };
  const board = round.board;
  const current = s.current ?? runBoard(s.sockets, board);
  const m = meets(current, board);
  const dry = m.beds.indexOf(false);
  if (dry < 0 && m.pond)
    return {
      state: { ...s, current, passed: true, glow: null, pointing: false },
      verdict: { result: 'pass', cause: null, need: null },
    };
  const cause: Cause = dry < 0 ? 'pond' : 'dry';
  const need = dry < 0 ? null : dry;
  const k = arrangementKey(s.sockets);
  if (k === s.checked) return { state: { ...s, current }, verdict: { result: 'again', cause, need } };
  const misses = s.misses + 1;
  let { hints, glow, glowShown } = s;
  if (misses >= 2) {
    glow = stepBed(s.sockets, board);
    if (!glowShown) {
      hints++;
      glowShown = true;
    }
  }
  return {
    state: { ...s, current, checked: k, misses, hints, glow, glowShown },
    verdict: { result: 'miss', cause, need },
  };
}

export type RouteHint = { kind: 'flip'; bed: number } | { kind: 'check' };

/** Show me: the pet flips one bed toward `nearest` (one hint), or, when it already passes, points at the Check (one hint if newly pointed). */
export function routeHint(s: RouteState, round: RouteRound): { state: RouteState; hint: RouteHint } {
  if (s.passed) return { state: s, hint: { kind: 'check' } };
  const i = stepBed(s.sockets, round.board);
  if (i === null)
    return {
      state: { ...s, pointing: true, hints: s.pointing ? s.hints : s.hints + 1 },
      hint: { kind: 'check' },
    };
  return { state: flipBed({ ...s, hints: s.hints + 1 }, i, round.board), hint: { kind: 'flip', bed: i } };
}

/** Start again: the starting arrangement from fresh. Misses and hints already made keep counting; the glow follows the new arrangement. */
export function routeRestart(s: RouteState, round: RouteRound): RouteState {
  const sockets = round.start.slice();
  return {
    ...s,
    sockets,
    current: null,
    pointing: false,
    glow: s.glowShown ? stepBed(sockets, round.board) : null,
  };
}

/** The ghost finger's next tap: try the starting board, change each bed that differs from the solution, try again, then check. */
export function routeNext(
  s: RouteState,
  round: RouteRound,
): { kind: 'cloud' } | { kind: 'bed'; bed: number } | { kind: 'check' } {
  const i = stepBed(s.sockets, round.board);
  const moved = arrangementKey(s.sockets) !== arrangementKey(round.start);
  if (i !== null && (s.current || moved)) return { kind: 'bed', bed: i };
  if (!s.current) return { kind: 'cloud' };
  return { kind: 'check' };
}

const POSITION = ['top', 'middle', 'low'] as const;

/**
 * Level 5's narration of a settled run, as clip ids said in turn: one per socket from the top while water reaches it
 * (the first socket it never reached is named once and the rest skipped), then the pond.
 */
export function narration(t: RouteTrial, board: RouteBoard): string[] {
  const out: string[] = [];
  for (let i = 0; i < t.sockets.length; i++) {
    const f = board.fixed[i];
    if (!t.steps.some((st) => st.path.includes(i))) {
      out.push(f ? `rain.${f}.none` : `rain.bed.${POSITION[i]}.none`);
      break;
    }
    if (f === 'tree') out.push('rain.tree.kept');
    else if (f === 'path') out.push('rain.path.past');
    else out.push(`rain.bed.${POSITION[i]}.${t.sockets[i] === 'soil' ? 'kept' : 'stone'}`);
  }
  out.push(`rain.pond.${t.pond}`);
  return out;
}

export interface RouteLayout {
  cloud: Box;
  /** Each bed from the top, with its two pockets. */
  beds: { patch: Box; pockets: Box[] }[];
  /** Out of each bed: to the next one, and from the last to the pond. */
  arrows: { x1: number; y1: number; x2: number; y2: number }[];
  pond: Box;
  slots: Box[];
  friend: { x: number; y: number };
  /** One need sign per marked bed (in `board.marked` order) and the pond's: pictures, not targets. */
  bedSigns: Box[];
  pondSign: Box;
  check: Box;
}

export const CHECK = 120,
  BED_W = 300,
  BED_H = 150,
  BED5_H = 130,
  SIGN_W = 140,
  SIGN_H = 110;

/**
 * Level 4 upright: the cloud, the top bed, the low bed one terrace down and across, then the pond, stacked down a
 * 768-wide screen (mirroring is ignored: it would put the pond beside the guide) and hung up from the bottom edge. The beds step right, so the pond sits right of the guide corner; the
 * need signs stand beside what they name, in the free space left of the low bed, right of the top bed and left of the pond.
 */
function uprightRouteLayout(w: number, h: number, bed: number): RouteLayout | null {
  if (w < UW - 1 || h < UH - 1) return null;
  const ox = (w - UW) / 2,
    oy = h - UH;
  const low = board(ox + 548, oy + 650, BED_W, BED_H, ox + 548, oy + 840, 240, 56, 58, 1);
  const tx = ox + 220,
    ty = oy + 470;
  const top = { patch: box(tx, ty, BED_W, BED_H), pockets: pocketsOf(tx, ty, BED_W, BED_H) };
  const edge = tx + BED_W / 2;
  const arrow1 = { x1: edge - 10, y1: ty - 16, x2: edge + 30, y2: low.patch.y - BED_H / 2 - 10 };
  return {
    cloud: box(tx, oy + 300, 260, 140),
    beds: [top, { patch: low.patch, pockets: low.pockets }],
    arrows: [arrow1, low.arrow],
    pond: low.pond,
    slots: low.slots,
    friend: low.friend,
    bedSigns: [bed === 1 ? box(ox + 220, oy + 650, SIGN_W, SIGN_H) : box(ox + 500, oy + 450, SIGN_W, SIGN_H)],
    pondSign: box(ox + 290, oy + 840, SIGN_W, SIGN_H),
    check: box(w - 20 - CHECK / 2, 18 + CHECK / 2, CHECK, CHECK),
  };
}

const pocketsOf = (px: number, py: number, pw: number, ph: number) =>
  [-1, 1].map((k) => box(px + k * pw * 0.22, py + ph * 0.08, Math.min(96, pw * 0.27), 60));

/**
 * Level 5's three beds, in frame coordinates measured in the definition (centers): the cloud over the top bed, each bed
 * lower than the one before, the pond with six slots at the bottom, a sign beside each bed (used when it is marked).
 * `last` is the way the low bed's arrow runs to the pond.
 */
function threeBeds(
  ox: number,
  oy: number,
  w: number,
  cloud: [number, number],
  beds: [number, number][],
  pond: [number, number],
  signs: [number, number][],
  pondSign: [number, number],
  last: 1 | -1,
  board: RouteBoard,
): RouteLayout {
  const at = ([x, y]: [number, number], bw: number, bh: number) => box(ox + x, oy + y, bw, bh);
  const patches = beds.map((b) => at(b, BED_W, BED5_H));
  const tray = at(pond, 400, 56 + 30);
  const slots = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => box(tray.x + k * 62, tray.y, 56, 56));
  const arrows = patches.map((p, i) => {
    const next = patches[i + 1];
    const dir = next ? Math.sign(next.x - p.x) || 1 : last;
    const edge = p.x + (dir * p.w) / 2;
    if (next) return { x1: edge - dir * 10, y1: p.y - 16, x2: edge + dir * 30, y2: next.y - next.h / 2 - 10 };
    // Into the pond's near end when the pond lies beyond the bed, else straight down just inside the bed's edge.
    const near = tray.x - dir * (tray.w / 2 - 30);
    const x2 = dir * (near - edge) > 0 ? near : edge - dir * 20;
    return { x1: edge - dir * 10, y1: p.y + p.h / 2 - 16, x2, y2: tray.y - tray.h / 2 - 6 };
  });
  const a = arrows[arrows.length - 1];
  const friend = {
    x: last * (a.x2 - tray.x) > 0 ? tray.x - last * (tray.w / 2 - 40) : tray.x + last * (tray.w / 2 - 40),
    y: tray.y - tray.h / 2 - 34,
  };
  return {
    cloud: at(cloud, 260, 140),
    beds: patches.map((p) => ({ patch: p, pockets: pocketsOf(p.x, p.y, p.w, p.h) })),
    arrows,
    pond: tray,
    slots,
    friend,
    bedSigns: board.marked.map((m) => at(signs[m.socket], SIGN_W, SIGN_H)),
    pondSign: at(pondSign, SIGN_W, SIGN_H),
    check: box(w - 20 - CHECK / 2, 18 + CHECK / 2, CHECK, CHECK),
  };
}

/**
 * The board of levels 4 and 5. Level 4 sits in the 1024×768 frame: the cloud over the top bed, the low bed one terrace
 * down and across, the pond at the bottom of the downhill side; mirroring reflects it about x = 525 so the pond stays
 * clear of the pet. Level 5 (a three-socket board) is a staircase descending right, or a zig-zag upright, never mirrored.
 * Null when a view cannot hold the board without shrinking a target.
 */
export function routeLayout(
  view: { w: number; h: number; upright?: true },
  b: RouteBoard,
  mirror = false,
): RouteLayout | null {
  const { w, h } = view;
  if (b.route.length === 3) {
    if (view.upright) {
      if (w < UW - 1 || h < UH - 1) return null;
      return threeBeds(
        (w - UW) / 2,
        h - UH,
        w,
        [260, 200],
        [
          [260, 350],
          [548, 505],
          [260, 660],
        ],
        [548, 862],
        [
          [568, 350],
          [220, 505],
          [568, 660],
        ],
        [262, 862],
        1,
        b,
      );
    }
    if (w < FW - 1 || h < FH - 1) return null;
    return threeBeds(
      (w - FW) / 2,
      (h - FH) / 2,
      w,
      [270, 115],
      [
        [270, 260],
        [530, 405],
        [790, 550],
      ],
      [770, 700],
      [
        [570, 250],
        [840, 390],
        [500, 560],
      ],
      [470, 700],
      1,
      b,
    );
  }
  const bed = b.marked[0].socket;
  if (view.upright) return uprightRouteLayout(w, h, bed);
  if (w < FW - 1 || h < FH - 1) return null;
  const ox = (w - FW) / 2,
    oy = (h - FH) / 2;
  const mx = (x: number) => ox + (mirror ? 1050 - x : x);
  const dir = mirror ? -1 : 1;
  const low = board(mx(520), oy + 510, BED_W, BED_H, mx(760), oy + 680, 240, 56, 58, dir);
  const tx = mx(300),
    ty = oy + 320;
  const top = { patch: box(tx, ty, BED_W, BED_H), pockets: pocketsOf(tx, ty, BED_W, BED_H) };
  const edge = tx + (dir * BED_W) / 2;
  const arrow1 = { x1: edge - dir * 10, y1: ty - 16, x2: edge + dir * 30, y2: low.patch.y - BED_H / 2 - 10 };
  const bedSign = bed === 1 ? box(mx(200), oy + 510, SIGN_W, SIGN_H) : box(mx(570), oy + 300, SIGN_W, SIGN_H);
  return {
    cloud: box(tx, oy + 150, 260, 140),
    beds: [top, { patch: low.patch, pockets: low.pockets }],
    arrows: [arrow1, low.arrow],
    pond: low.pond,
    slots: low.slots,
    friend: low.friend,
    bedSigns: [bedSign],
    pondSign: box(mx(920), oy + 540, SIGN_W, SIGN_H),
    check: box(w - 20 - CHECK / 2, 18 + CHECK / 2, CHECK, CHECK),
  };
}
