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
  level: 1 | 2 | 3 | 4;
  name: string;
}
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Rain on the garden: tap the cloud and watch where four drops go' },
  { level: 2, name: 'Two gardens, same rain: pick stone or soil for each, then rain on both' },
  { level: 3, name: 'Change it and try again: the first rain is kept on a card to compare' },
  { level: 4, name: 'Two beds downhill: change the ground so the leaf bed gets two drops and the pond some' },
];
export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 4 },
};
export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(4, Math.round(level))) - 1];
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
export function rainLayout(view: { w: number; h: number }, level: number, mirror = false): Layout | null {
  const { w, h } = view;
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

/** The sticker's pond friend and drop count, seeded. */
export function stickerPick(seed: number): { friend: Friend; drops: number } {
  const n = Math.abs(Math.floor(seed));
  return { friend: FRIENDS[n % 3], drops: 1 + (Math.floor(n / 3) % 2) };
}

// ---- level 4: two beds downhill ----
//
// Two sockets in a fixed chain, the top bed (0) and the low bed (1). The shower falls on the top bed; what a bed can't
// hold runs down its fixed arrow, the top bed's into the low bed and the low bed's into the pond. One bed is marked and
// must keep exactly two drops; the pond must get at least one. She sets each bed's ground, tries it, then checks.

/** Where a drop can be: a socket's index, or the pond. */
export type Place = number | 'pond';
/** Each socket names where its overflow runs. Written for any chain so a longer board can reuse it. */
export interface Link {
  down: Place;
}
export const ROUTE4: readonly Link[] = [{ down: 1 }, { down: 'pond' }];
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

/** The marked bed must keep exactly two; the pond must get at least one. */
export function meets(t: RouteTrial, bed: 0 | 1): { bed: boolean; pond: boolean } {
  return { bed: t.stored[bed] === 2, pond: t.pond >= 1 };
}
const passes = (sockets: readonly Surface[], bed: 0 | 1) => {
  const m = meets(runRoute(sockets), bed);
  return m.bed && m.pond;
};
export const arrangementKey = (sockets: readonly Surface[]) => sockets.join('/');
/** All four arrangements, top bed first. */
export const ARRANGEMENTS: readonly Surface[][] = SURFACES.flatMap((a) => SURFACES.map((b) => [a, b]));

/** Every arrangement that meets both needs. */
export function solutions(bed: 0 | 1): Surface[][] {
  return ARRANGEMENTS.filter((a) => passes(a, bed)).map((a) => a.slice());
}

const distance = (a: readonly Surface[], b: readonly Surface[]) => a.filter((s, i) => s !== b[i]).length;

/** The solution that differs from `sockets` in the fewest beds. */
export function nearest(sockets: readonly Surface[], bed: 0 | 1): Surface[] {
  let best: Surface[] | null = null;
  for (const sol of solutions(bed)) if (!best || distance(sockets, sol) < distance(sockets, best)) best = sol;
  return best!;
}

/** The bed a worked step flips and the glow marks: the first, from the top, that differs from `nearest`; null when it passes. */
export function stepBed(sockets: readonly Surface[], bed: 0 | 1): number | null {
  const goal = nearest(sockets, bed);
  const i = sockets.findIndex((s, k) => s !== goal[k]);
  return i < 0 ? null : i;
}

export interface RouteRound {
  level: 4;
  /** The marked bed: 0 the top bed, 1 the low bed. */
  bed: 0 | 1;
  start: Surface[];
  friend: Friend;
  /** The cloud and the top bed on the right, the arrows running left. */
  mirror: boolean;
}

/** The authored board is soil over stone with the low bed marked; a seeded board starts on one of its variant's failing arrangements. */
export function makeRoute(rng: Rng, authored: boolean): RouteRound {
  if (authored) return { level: 4, bed: 1, start: ['soil', 'stone'], friend: 'frog', mirror: false };
  const bed: 0 | 1 = rng.chance(0.5) ? 1 : 0;
  const failing = ARRANGEMENTS.filter((a) => !passes(a, bed));
  return {
    level: 4,
    bed,
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
export function tryRoute(s: RouteState): RouteState {
  return { ...s, current: runRoute(s.sockets) };
}

/** Flip one bed's ground. Both beds and the pond go back to fresh; a lit glow moves to the bed the new arrangement still needs changed. */
export function flipBed(s: RouteState, i: number, bed: 0 | 1): RouteState {
  const sockets = s.sockets.slice();
  sockets[i] = flip(sockets[i]);
  return { ...s, sockets, current: null, pointing: false, glow: s.glowShown ? stepBed(sockets, bed) : null };
}

export type Cause = 'dry' | 'pond';
export interface Verdict {
  result: 'pass' | 'miss' | 'again' | 'ignored';
  cause: Cause | null;
}

/**
 * The Check: runs the shower if the arrangement hasn't settled, then judges both needs. A failed Check counts one miss,
 * unless it judges the same arrangement as the last failed one. From the second miss the glow marks the bed to change,
 * counting one hint the first time it lights.
 */
export function check(s: RouteState, round: RouteRound): { state: RouteState; verdict: Verdict } {
  if (s.passed) return { state: s, verdict: { result: 'ignored', cause: null } };
  const current = s.current ?? runRoute(s.sockets);
  const m = meets(current, round.bed);
  if (m.bed && m.pond)
    return {
      state: { ...s, current, passed: true, glow: null, pointing: false },
      verdict: { result: 'pass', cause: null },
    };
  const cause: Cause = m.bed ? 'pond' : 'dry';
  const k = arrangementKey(s.sockets);
  if (k === s.checked) return { state: { ...s, current }, verdict: { result: 'again', cause } };
  const misses = s.misses + 1;
  let { hints, glow, glowShown } = s;
  if (misses >= 2) {
    glow = stepBed(s.sockets, round.bed);
    if (!glowShown) {
      hints++;
      glowShown = true;
    }
  }
  return {
    state: { ...s, current, checked: k, misses, hints, glow, glowShown },
    verdict: { result: 'miss', cause },
  };
}

export type RouteHint = { kind: 'flip'; bed: number } | { kind: 'check' };

/** Show me: the pet flips one bed toward `nearest` (one hint), or, when it already passes, points at the Check (one hint if newly pointed). */
export function routeHint(s: RouteState, round: RouteRound): { state: RouteState; hint: RouteHint } {
  if (s.passed) return { state: s, hint: { kind: 'check' } };
  const i = stepBed(s.sockets, round.bed);
  if (i === null)
    return {
      state: { ...s, pointing: true, hints: s.pointing ? s.hints : s.hints + 1 },
      hint: { kind: 'check' },
    };
  return { state: flipBed({ ...s, hints: s.hints + 1 }, i, round.bed), hint: { kind: 'flip', bed: i } };
}

/** Start again: the starting arrangement from fresh. Misses and hints already made keep counting; the glow follows the new arrangement. */
export function routeRestart(s: RouteState, round: RouteRound): RouteState {
  const sockets = round.start.slice();
  return {
    ...s,
    sockets,
    current: null,
    pointing: false,
    glow: s.glowShown ? stepBed(sockets, round.bed) : null,
  };
}

/** The ghost finger's next tap: try the starting board, change each bed that differs from the solution, try again, then check. */
export function routeNext(
  s: RouteState,
  round: RouteRound,
): { kind: 'cloud' } | { kind: 'bed'; bed: number } | { kind: 'check' } {
  const i = stepBed(s.sockets, round.bed);
  const moved = arrangementKey(s.sockets) !== arrangementKey(round.start);
  if (i !== null && (s.current || moved)) return { kind: 'bed', bed: i };
  if (!s.current) return { kind: 'cloud' };
  return { kind: 'check' };
}

export interface RouteLayout {
  cloud: Box;
  /** The top bed, then the low bed, each with its two pockets. */
  beds: { patch: Box; pockets: Box[] }[];
  /** Top bed to low bed, then low bed to the pond. */
  arrows: { x1: number; y1: number; x2: number; y2: number }[];
  pond: Box;
  slots: Box[];
  friend: { x: number; y: number };
  /** The marked bed's need sign and the pond's: pictures, not targets. */
  bedSign: Box;
  pondSign: Box;
  check: Box;
}

export const CHECK = 120,
  BED_W = 300,
  BED_H = 150,
  SIGN_W = 140,
  SIGN_H = 110;

/**
 * Level 4's board in the 1024×768 frame: the cloud over the top bed, the low bed one terrace down and across, the pond
 * at the bottom of the downhill side. Mirroring reflects it about x = 525 so the pond stays clear of the pet.
 */
export function routeLayout(view: { w: number; h: number }, bed: 0 | 1, mirror = false): RouteLayout | null {
  const { w, h } = view;
  if (w < FW - 1 || h < FH - 1) return null;
  const ox = (w - FW) / 2,
    oy = (h - FH) / 2;
  const mx = (x: number) => ox + (mirror ? 1050 - x : x);
  const dir = mirror ? -1 : 1;
  const low = board(mx(520), oy + 510, BED_W, BED_H, mx(760), oy + 680, 240, 56, 58, dir);
  const tx = mx(300),
    ty = oy + 320;
  const top = {
    patch: box(tx, ty, BED_W, BED_H),
    pockets: [-1, 1].map((k) =>
      box(tx + k * BED_W * 0.22, ty + BED_H * 0.08, Math.min(96, BED_W * 0.27), 60),
    ),
  };
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
    bedSign,
    pondSign: box(mx(920), oy + 540, SIGN_W, SIGN_H),
    check: box(w - 20 - CHECK / 2, 18 + CHECK / 2, CHECK, CHECK),
  };
}
