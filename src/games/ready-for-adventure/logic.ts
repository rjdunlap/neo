import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Ready for Adventure's rules: pretend parade props. A prop with a missing part (a bare flagpole, a drum with no beater) is
 * not ready, and only a ready, requested prop can go in the bag. Each requested prop is one job (attach, then pack); jobs
 * are independent, so level 3 accepts every interleaving. Nothing here is real self-care.
 */
export type PropId = 'flag' | 'drum' | 'bell' | 'ball';
export type PartId = 'ribbon' | 'beater';
export type PropState = 'bare' | 'ready' | 'packed';

/** The part each preparable prop needs. */
export const PART_OF: Readonly<Partial<Record<PropId, PartId>>> = { flag: 'ribbon', drum: 'beater' };
export const PROP_OF: Readonly<Record<PartId, PropId>> = { ribbon: 'flag', beater: 'drum' };
export const PROP_NAMES: Readonly<Record<PropId, string>> = { flag: 'flag', drum: 'drum', bell: 'bell', ball: 'ball' };

export interface Round {
  /** The props the card shows, in card order. */
  request: PropId[];
  /** Every prop on the bench (level 1 adds a second, unrequested choice). */
  props: PropId[];
  /** Whether each preparable requested prop starts bare (levels 2 and 3). */
  bare: boolean;
  /** Bench order of objects, as `prop:<id>` / `part:<id>` keys. */
  order: string[];
  flagShape: number;
  ribbonPattern: number;
  drumPattern: number;
}

export const FLAG_SHAPES = 3;
export const RIBBON_PATTERNS = 3;

export interface Plan {
  level: number;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Pack the flag' },
  { level: 2, name: 'Make it ready' },
  { level: 3, name: 'Two useful jobs' },
];

export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(PLANS.length, level)) - 1];
}

export const key = {
  prop: (p: PropId) => `prop:${p}`,
  part: (p: PartId) => `part:${p}`,
};

/** A seeded round. Every generated round is finishable from its start. */
export function makeRound(level: number, rng: Rng): Round {
  const flagShape = rng.int(0, FLAG_SHAPES - 1);
  const ribbonPattern = rng.int(0, RIBBON_PATTERNS - 1);
  const drumPattern = rng.int(0, RIBBON_PATTERNS - 1);
  if (level <= 1) {
    const all: PropId[] = ['flag', 'drum', 'bell', 'ball'];
    const want = rng.pick(['flag', 'drum', 'bell'] as PropId[]);
    const other = rng.pick(all.filter((p) => p !== want));
    const order = rng.chance(0.5) ? [key.prop(want), key.prop(other)] : [key.prop(other), key.prop(want)];
    return { request: [want], props: [want, other], bare: false, order, flagShape, ribbonPattern, drumPattern };
  }
  if (level === 2) {
    const want: PropId = rng.pick(['flag', 'drum'] as PropId[]);
    const part = PART_OF[want]!;
    const order = rng.chance(0.5) ? [key.prop(want), key.part(part)] : [key.part(part), key.prop(want)];
    return { request: [want], props: [want], bare: true, order, flagShape, ribbonPattern, drumPattern };
  }
  const pairs = [[key.prop('flag'), key.part('ribbon')], [key.prop('drum'), key.part('beater')]];
  if (rng.chance(0.5)) pairs.reverse();
  const order = pairs.flatMap((p) => (rng.chance(0.5) ? p : [p[1], p[0]]));
  return { request: ['flag', 'drum'], props: ['flag', 'drum'], bare: true, order, flagShape, ribbonPattern, drumPattern };
}

// ---- State ------------------------------------------------------------------------------------------------------------

export interface ReadyState {
  round: Round;
  level: number;
  props: Partial<Record<PropId, PropState>>;
  /** Parts still loose on the bench. */
  loose: Set<PartId>;
  misses: number;
  hints: number;
  /** Misses on each job since it last advanced or glowed. */
  jobMisses: Partial<Record<PropId, number>>;
  /** The job whose next action is glowing, if any. */
  glow: PropId | null;
}

export function startState(level: number, rng: Rng): ReadyState {
  return stateFor(level, makeRound(level, rng));
}

export function stateFor(level: number, round: Round): ReadyState {
  const props: Partial<Record<PropId, PropState>> = {};
  const loose = new Set<PartId>();
  for (const p of round.props) {
    const needs = PART_OF[p];
    const bare = round.bare && !!needs && round.request.includes(p);
    props[p] = bare ? 'bare' : 'ready';
    if (bare) loose.add(needs!);
  }
  return { round, level, props, loose, misses: 0, hints: 0, jobMisses: {}, glow: null };
}

export const done = (s: ReadyState) => s.round.request.every((p) => s.props[p] === 'packed');
export const jobDone = (s: ReadyState, job: PropId) => s.props[job] === 'packed';

// ---- Actions ----------------------------------------------------------------------------------------------------------

export type Action = { attach: PartId; to: PropId } | { pack: PropId };

/** The single next action of one job, or null once it is finished. */
export function hintFor(s: ReadyState, job: PropId): Action | null {
  const st = s.props[job];
  if (st === 'bare') return { attach: PART_OF[job]!, to: job };
  if (st === 'ready') return { pack: job };
  return null;
}

/** Every legal action that advances an unfinished job. */
export function nextActions(s: ReadyState): Action[] {
  return s.round.request.map((j) => hintFor(s, j)).filter((a): a is Action => a !== null);
}

export type Dragged = { prop: PropId } | { part: PartId };
export type Target = { bag: true } | { prop: PropId } | { part: PartId };
export type Refusal = 'notReady' | 'wrongPart' | 'notRequested' | 'looseToBag';

export type Verdict =
  | { kind: 'attach'; part: PartId; prop: PropId }
  | { kind: 'pack'; prop: PropId }
  | { kind: 'refuse'; reason: Refusal; job: PropId; prop?: PropId; part?: PartId }
  | { kind: 'free' };

const isProp = (d: Dragged | Target): d is { prop: PropId } => 'prop' in d;
const isPart = (d: Dragged | Target): d is { part: PartId } => 'part' in d;

/**
 * What a deliberate gesture means. A release on empty bench, a prop on a prop, a part on a part and the like are `free` and
 * never reach the accounting. Pure: it changes nothing.
 */
export function judge(s: ReadyState, drag: Dragged, target: Target): Verdict {
  const firstJob = s.round.request[0];
  if ('bag' in target) {
    if (isPart(drag)) return { kind: 'refuse', reason: 'looseToBag', job: PROP_OF[drag.part], part: drag.part };
    const st = s.props[drag.prop];
    if (!s.round.request.includes(drag.prop)) return { kind: 'refuse', reason: 'notRequested', job: firstJob, prop: drag.prop };
    if (st === 'bare') return { kind: 'refuse', reason: 'notReady', job: drag.prop, prop: drag.prop };
    if (st === 'packed') return { kind: 'free' };
    return { kind: 'pack', prop: drag.prop };
  }
  // A part and a prop meet (either one dragged onto the other).
  let part: PartId | null = null;
  let prop: PropId | null = null;
  if (isPart(drag) && isProp(target)) { part = drag.part; prop = target.prop; }
  else if (isProp(drag) && isPart(target)) { part = target.part; prop = drag.prop; }
  if (!part || !prop) return { kind: 'free' };
  if (PROP_OF[part] !== prop) return { kind: 'refuse', reason: 'wrongPart', job: PROP_OF[part], part };
  if (s.props[prop] !== 'bare' || !s.loose.has(part)) return { kind: 'free' };
  return { kind: 'attach', part, prop };
}

export interface Outcome {
  verdict: Verdict;
  /** A second miss on one job lit its next action (counts 1 hint). */
  glowed: PropId | null;
}

/** Apply a judged gesture: advance a job, or charge a miss (two on one job glow it and count a hint). */
export function apply(s: ReadyState, verdict: Verdict): Outcome {
  let glowed: PropId | null = null;
  if (verdict.kind === 'attach') {
    s.props[verdict.prop] = 'ready';
    s.loose.delete(verdict.part);
    advanced(s, verdict.prop);
  } else if (verdict.kind === 'pack') {
    s.props[verdict.prop] = 'packed';
    advanced(s, verdict.prop);
  } else if (verdict.kind === 'refuse') {
    s.misses++;
    const n = (s.jobMisses[verdict.job] ?? 0) + 1;
    s.jobMisses[verdict.job] = n;
    if (n >= 2) {
      s.jobMisses[verdict.job] = 0;
      s.hints++;
      s.glow = verdict.job;
      glowed = verdict.job;
    }
  }
  return { verdict, glowed };
}

function advanced(s: ReadyState, job: PropId) {
  s.jobMisses[job] = 0;
  if (s.glow === job) s.glow = null;
}

/** The pause sheet's Show a hint: glow the job with most misses (else the first unfinished). Asked while lit, it counts nothing. */
export function askHint(s: ReadyState): 'glow' | 'repeat' | null {
  if (done(s)) return null;
  if (s.glow && !jobDone(s, s.glow)) return 'repeat';
  const open = s.round.request.filter((j) => !jobDone(s, j));
  let job = open[0];
  for (const j of open) if ((s.jobMisses[j] ?? 0) > (s.jobMisses[job] ?? 0)) job = j;
  s.hints++;
  s.glow = job;
  return 'glow';
}

/** Start again: every prop and part back to the round's start, keeping misses and hints. */
export function restart(s: ReadyState) {
  const fresh = stateFor(s.level, s.round);
  s.props = fresh.props;
  s.loose = fresh.loose;
  s.jobMisses = {};
  s.glow = null;
}

/** The bot's move: the first open job's next action. */
export function botAction(s: ReadyState): Action | null {
  return nextActions(s)[0] ?? null;
}

export function describeReady(level: number): string {
  return level <= 1 ? 'Pack the prop the card shows' : level === 2 ? 'Get one prop ready, then pack it' : 'Get two props ready and packed, in any order';
}

// ---- Layout -----------------------------------------------------------------------------------------------------------

export interface Rect { x: number; y: number; w: number; h: number }

export interface ReadyLayout {
  card: Rect;
  rail: Rect;
  bench: Rect;
  /** One rectangle per object in `round.order`. */
  slots: Rect[];
  bag: Rect;
  companion: { x: number; y: number };
  lane: Rect;
}

export const PROP_SIZE = 150;
export const PART_SIZE = 120;
export const BAG_W = 230;
export const BAG_H = 210;
const GAP = 40;

/** Every rectangle for a round's objects; null (never shrunk) if they cannot fit at the sizes above. */
export function readyLayout(view: View, level: number, order: readonly string[]): ReadyLayout | null {
  const sizes = order.map((k) => (k.startsWith('prop:') ? PROP_SIZE : PART_SIZE));
  const sum = sizes.reduce((a, b) => a + b, 0) + GAP * (sizes.length - 1);
  const margin = 40;
  const card: Rect = { x: view.w / 2 - 150, y: 20, w: 300, h: 160 };
  const rail: Rect = { x: view.w / 2 - 150, y: card.y + card.h + 8, w: 300, h: 60 };
  const oneRow = sum + GAP + BAG_W + margin * 2 <= view.w && sizes.length <= 4;
  const rows = oneRow ? 1 : Math.ceil(sizes.length / 2);
  const rowH = PROP_SIZE + 30;
  const benchH = rows * rowH + (oneRow ? 60 : BAG_H + 20);
  const benchY = Math.max(rail.y + rail.h + 70, view.h * 0.38);
  const bench: Rect = { x: margin - 10, y: benchY, w: view.w - margin * 2 + 20, h: Math.min(benchH, view.h - benchY - 10) };
  const slots: Rect[] = [];
  if (oneRow) {
    const startX = (view.w - (sum + GAP + BAG_W)) / 2;
    let x = startX;
    const cy = benchY + 30 + rowH / 2;
    sizes.forEach((sz) => { slots.push({ x, y: cy - sz / 2, w: sz, h: sz }); x += sz + GAP; });
    const bag: Rect = { x: view.w - margin - BAG_W, y: cy - BAG_H / 2, w: BAG_W, h: BAG_H };
    const lane: Rect = { x: 0, y: benchY, w: view.w, h: 260 };
    return fits({ card, rail, bench, slots, bag, companion: { x: view.w * 0.2, y: benchY - 10 }, lane }, view, level);
  }
  for (let r = 0; r < rows; r++) {
    const pair = sizes.slice(r * 2, r * 2 + 2);
    const total = pair.reduce((a, b) => a + b, 0) + GAP * (pair.length - 1);
    let x = Math.max(margin, (view.w - total) / 2 - 90);
    const cy = benchY + 30 + r * rowH + rowH / 2;
    pair.forEach((sz) => { slots.push({ x, y: cy - sz / 2, w: sz, h: sz }); x += sz + GAP; });
  }
  const bag: Rect = { x: view.w - margin - BAG_W, y: benchY + 30 + rows * rowH + 10, w: BAG_W, h: BAG_H };
  const lane: Rect = { x: 0, y: benchY, w: view.w, h: 260 };
  return fits({ card, rail, bench, slots, bag, companion: { x: view.w * 0.2, y: benchY - 10 }, lane }, view, level);
}

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function fits(l: ReadyLayout, view: View, _level: number): ReadyLayout | null {
  const targets = [...l.slots, l.bag];
  for (const t of targets) {
    if (t.x < 0 || t.y < 0 || t.x + t.w > view.w || t.y + t.h > view.h) return null;
  }
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) if (overlap(targets[i], targets[j])) return null;
  }
  // The card and rail stay clear of the targets, the home button (top-left) and the guide's bottom-left corner.
  for (const t of targets) if (overlap(t, l.card) || overlap(t, l.rail)) return null;
  for (const t of targets) if (t.x < 150 && t.y + t.h > view.h - 170) return null;
  return l;
}
