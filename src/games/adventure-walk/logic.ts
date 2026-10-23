import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Adventure Walk's rules: the companion walks to a friend's picnic past three landmarks, and at each one she decides which
 * of two ways it goes past (over, under, through, across, around). Screen-only: the companion does all the walking.
 */
export type PathWord = 'over' | 'under' | 'through' | 'across' | 'around';
export type LandmarkId = 'brook' | 'reeds' | 'log' | 'boulder' | 'puddle';
export type FriendId = 'duck' | 'cow' | 'pig';
export type StepSound = 'knock' | 'splash' | 'brush' | 'whoosh' | 'squish' | 'pop';

export const PATH_WORDS: readonly PathWord[] = ['over', 'under', 'through', 'across', 'around'];
export const FRIENDS: readonly FriendId[] = ['duck', 'cow', 'pig'];
export const FRIEND_NAMES: Record<FriendId, string> = { duck: 'Duck', cow: 'Cow', pig: 'Pig' };
export const STOPS = 3;

export interface Way {
  word: PathWord;
  /** `${landmark}.${word}`: the key of its voice lines (`walk.way.*` as a phrase, `walk.went.*` as the result). */
  key: string;
  /** What the walker says it is doing, for the grown-ups' card and tests. */
  phrase: string;
  sound: StepSound;
}

export interface Landmark {
  id: LandmarkId;
  ways: readonly [Way, Way];
}

const way = (landmark: LandmarkId, word: PathWord, phrase: string, sound: StepSound): Way => ({ word, key: `${landmark}.${word}`, phrase, sound });

export const LANDMARKS: readonly Landmark[] = [
  { id: 'brook', ways: [way('brook', 'over', 'over the bridge', 'knock'), way('brook', 'across', 'across the stones', 'splash')] },
  { id: 'reeds', ways: [way('reeds', 'through', 'through the reeds', 'brush'), way('reeds', 'around', 'around the reeds', 'whoosh')] },
  { id: 'log', ways: [way('log', 'under', 'under the log', 'squish'), way('log', 'over', 'over the log', 'knock')] },
  { id: 'boulder', ways: [way('boulder', 'around', 'around the boulder', 'whoosh'), way('boulder', 'over', 'over the boulder', 'pop')] },
  { id: 'puddle', ways: [way('puddle', 'across', 'across the puddle', 'splash'), way('puddle', 'around', 'around the puddle', 'whoosh')] },
];

export const landmarkOf = (id: LandmarkId): Landmark => LANDMARKS.find((l) => l.id === id)!;

export interface Plan {
  level: number;
  name: string;
  /** The friend calls the way (levels 2-3). */
  calls: boolean;
  /** Stops asked for together before walking, in order (level 3: the first two, then the third). */
  groups: readonly (readonly number[])[];
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Pick a way', calls: false, groups: [] },
  { level: 2, name: 'Come this way', calls: true, groups: [[0], [1], [2]] },
  { level: 3, name: 'Two at once', calls: true, groups: [[0, 1], [2]] },
];

export const planFor = (level: number): Plan => PLANS[Math.max(1, Math.min(PLANS.length, level)) - 1];

export interface Stop {
  landmark: LandmarkId;
  /** Which of the landmark's two ways is drawn on the left (or top). */
  first: 0 | 1;
  /** The way the friend asks for (index into the landmark's ways), or null at level 1. */
  asked: 0 | 1 | null;
}

export interface Route {
  level: number;
  friend: FriendId;
  stops: readonly Stop[];
}

const shuffle = <T>(rng: Rng, items: readonly T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sideOf = (s: Stop): 0 | 1 => (s.asked === s.first ? 0 : 1);

/** Three different landmarks; at levels 2-3 the asked ways differ in word and sit on both sides over the round. */
export function makeRoute(level: number, rng: Rng): Route {
  const plan = planFor(level);
  const lands = shuffle(rng, LANDMARKS).slice(0, STOPS);
  const friend = FRIENDS[Math.floor(rng.next() * FRIENDS.length)];
  for (let tries = 0; tries < 50; tries++) {
    const stops: Stop[] = lands.map((l) => ({
      landmark: l.id,
      first: rng.next() < 0.5 ? 0 : 1,
      asked: plan.calls ? (rng.next() < 0.5 ? 0 : 1) : null,
    }));
    if (plan.calls) {
      const words = new Set(stops.map((s) => landmarkOf(s.landmark).ways[s.asked!].word));
      const sides = new Set(stops.map(sideOf));
      if (words.size < 2 || sides.size < 2) continue;
    }
    return { level, friend, stops };
  }
  // Practically unreachable; a fixed fair route keeps the round playable.
  return { level, friend, stops: lands.map((l, i) => ({ landmark: l.id, first: (i % 2) as 0 | 1, asked: plan.calls ? 0 : null })) };
}

export const waysAt = (stop: Stop): readonly [Way, Way] => landmarkOf(stop.landmark).ways;
/** The way in drawn position `slot` (0 = left or top). */
export const wayInSlot = (stop: Stop, slot: 0 | 1): 0 | 1 => (slot === 0 ? stop.first : ((1 - stop.first) as 0 | 1));
export const askedWay = (stop: Stop): Way | null => (stop.asked === null ? null : waysAt(stop)[stop.asked]);
/** The drawn slot of the asked way. */
export const askedSlot = (stop: Stop): 0 | 1 | null => (stop.asked === null ? null : stop.asked === stop.first ? 0 : 1);

/** The group of stops the friend is calling at `stop`, if a call starts there. */
export function callAt(route: Route, stop: number): readonly number[] | null {
  const g = planFor(route.level).groups.find((grp) => grp[0] === stop);
  return g ?? null;
}

/** The call to repeat while standing at `stop`: the group it belongs to. */
export function groupOf(route: Route, stop: number): readonly number[] {
  return planFor(route.level).groups.find((g) => g.includes(stop)) ?? [stop];
}

export type Choice = { kind: 'go' } | { kind: 'other'; took: Way; asked: Way };

export function choose(route: Route, stop: number, which: 0 | 1): Choice {
  const s = route.stops[stop];
  if (s.asked === null || which === s.asked) return { kind: 'go' };
  const ways = waysAt(s);
  return { kind: 'other', took: ways[which], asked: ways[s.asked] };
}

// ---- State ------------------------------------------------------------------------------------------------------------

export interface WalkState {
  route: Route;
  /** The stop in front of her; STOPS once the picnic is reached. */
  stop: number;
  misses: number;
  hints: number;
  stopMisses: number;
  hinted: boolean;
  /** The asked way glows at this stop. */
  glow: boolean;
}

export const startWalk = (level: number, rng: Rng): WalkState => ({ route: makeRoute(level, rng), stop: 0, misses: 0, hints: 0, stopMisses: 0, hinted: false, glow: false });

export type Step = { kind: 'go'; way: Way; arrived: boolean } | { kind: 'other'; took: Way; asked: Way; glow: boolean } | { kind: 'ignored' };

/** She taps the way in drawn `slot`. A wrong way is a miss; two misses at one stop light the asked way, once (a hint). */
export function step(s: WalkState, slot: 0 | 1): Step {
  if (s.stop >= STOPS) return { kind: 'ignored' };
  const stop = s.route.stops[s.stop];
  const which = wayInSlot(stop, slot);
  const r = choose(s.route, s.stop, which);
  if (r.kind === 'other') {
    s.misses++;
    s.stopMisses++;
    let glow = false;
    if (s.stopMisses >= 2 && !s.hinted) { s.hinted = true; s.hints++; s.glow = true; glow = true; }
    return { kind: 'other', took: r.took, asked: r.asked, glow };
  }
  s.stop++;
  s.stopMisses = 0;
  s.hinted = false;
  s.glow = false;
  return { kind: 'go', way: waysAt(stop)[which], arrived: s.stop >= STOPS };
}

/** Show a hint: light the asked way (a hint, once per stop); asked again at that stop, say the request again. */
export function askHint(s: WalkState): 'glow' | 'repeat' | 'none' {
  if (s.stop >= STOPS || s.route.stops[s.stop].asked === null) return 'none';
  if (s.hinted) return 'repeat';
  s.hinted = true;
  s.hints++;
  s.glow = true;
  return 'glow';
}

/** Start again: the first stop of the same seeded route, keeping misses and hints. */
export function restart(s: WalkState) {
  s.stop = 0;
  s.stopMisses = 0;
  s.hinted = false;
  s.glow = false;
}

/** What a capable walker taps: the asked slot, else alternating sides so the demonstration shows both are fine. */
export function botSlot(s: WalkState): 0 | 1 {
  const stop = s.route.stops[s.stop];
  return askedSlot(stop) ?? ((s.stop % 2) as 0 | 1);
}

// ---- Layout -----------------------------------------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StopLayout {
  zones: readonly [Rect, Rect];
  /** The friend's picture at levels 2-3, else null. */
  badge: Rect | null;
  /** Where the companion stands at the start of a stop (its feet). */
  stand: { x: number; y: number };
  trail: Rect;
}

const BADGE = 140;

/** Every rectangle for one stop. Nothing is under 100; the guide's corner (bottom-left) and the home button stay clear. */
export function stopLayout(view: View, level: number): StopLayout {
  const landscape = view.w >= view.h;
  const trail: Rect = { x: 170, y: 22, w: Math.max(200, view.w - 340 - (level > 1 ? BADGE : 0)), h: 40 };
  const badge: Rect | null = level > 1 ? { x: view.w - 20 - BADGE, y: 80, w: BADGE, h: BADGE } : null;
  let zones: readonly [Rect, Rect];
  let stand: { x: number; y: number };
  if (landscape) {
    const w = 320;
    const h = 300;
    const gap = 60;
    const x0 = (view.w - 2 * w - gap) / 2;
    const y = 130;
    zones = [{ x: x0, y, w, h }, { x: x0 + w + gap, y, w, h }];
    stand = { x: view.w / 2, y: view.h - 50 };
  } else {
    const w = 340;
    const h = 250;
    const gap = 50;
    const x = (view.w - w) / 2;
    zones = [{ x, y: 150, w, h }, { x, y: 150 + h + gap, w, h }];
    stand = { x: view.w / 2, y: view.h - 80 };
  }
  return { zones, badge, stand, trail };
}

// ---- Words for grown-ups ----------------------------------------------------------------------------------------------

export function describeWalk(level: number): string {
  return level <= 1 ? 'Pick either way past each landmark' : level === 2 ? 'Take the way the friend calls at each landmark' : 'Follow two of the friend’s calls in order, then a third';
}
