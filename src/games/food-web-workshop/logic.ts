import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Food Web Workshop's rules (docs/definitions/food-web-workshop.md): picture cards record who was seen eating what, and
 * she draws arrows from each food to its eater. An arrow means "a card showed this"; a pair with no card is only not on
 * our cards. Only Show our web can count a miss.
 */

export type Organism = 'clover' | 'dandelion' | 'caterpillar' | 'snail' | 'bunny' | 'bird';
export const ORGANISMS: readonly Organism[] = ['clover', 'dandelion', 'caterpillar', 'snail', 'bunny', 'bird'];

export type RecordId = 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6';
export interface FeedingRecord {
  id: RecordId;
  /** The food. */
  from: Organism;
  /** The one seen eating it. */
  to: Organism;
}

/** The six reviewed records (decided 2026-10-23, source-checked by the build session). */
export const RECORDS: readonly FeedingRecord[] = [
  { id: 'r1', from: 'clover', to: 'caterpillar' },
  { id: 'r2', from: 'caterpillar', to: 'bird' },
  { id: 'r3', from: 'dandelion', to: 'snail' },
  { id: 'r4', from: 'snail', to: 'bird' },
  { id: 'r5', from: 'clover', to: 'bunny' },
  { id: 'r6', from: 'dandelion', to: 'bunny' },
];
export const recordById = (id: RecordId) => RECORDS.find((r) => r.id === id)!;

export interface WebCase {
  organisms: readonly [Organism, Organism, Organism];
  records: readonly [RecordId, RecordId];
}

export type Start = 'empty' | 'one-reversed';
export interface WebPlan {
  level: number;
  name: string;
  cases: readonly WebCase[];
  start: Start;
}

const CHAIN: readonly WebCase[] = [
  { organisms: ['clover', 'caterpillar', 'bird'], records: ['r1', 'r2'] },
  { organisms: ['dandelion', 'snail', 'bird'], records: ['r3', 'r4'] },
];
const BRANCH: readonly WebCase[] = [
  { organisms: ['clover', 'caterpillar', 'bunny'], records: ['r1', 'r5'] },
  { organisms: ['dandelion', 'snail', 'bunny'], records: ['r3', 'r6'] },
];

export const PLANS: readonly WebPlan[] = [
  { level: 1, name: 'Make the picture: two cards, a food chain of three', cases: CHAIN, start: 'empty' },
  { level: 2, name: 'Turn the arrow: one arrow arrives pointing the wrong way', cases: CHAIN, start: 'one-reversed' },
  { level: 3, name: 'One food, two eaters: the arrows branch', cases: BRANCH, start: 'empty' },
];
export const planFor = (level: number): WebPlan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/** A directed arrow from a food to an eater. */
export interface Arrow {
  from: Organism;
  to: Organism;
}

type Change = { kind: 'add'; arrow: Arrow } | { kind: 'turn'; arrow: Arrow } | { kind: 'remove'; arrow: Arrow };

export interface WebRound {
  plan: WebPlan;
  webCase: WebCase;
  /** The stations' seeded order: index 0 sits at the top, 1 lower left, 2 lower right. */
  stations: Organism[];
  /** Level 2's record whose arrow arrives backwards. */
  reversed: RecordId | null;
}

export interface WebState {
  round: WebRound;
  arrows: Arrow[];
  /** Her own changes (and hints'), newest last; undo never reaches past the round's start. */
  undo: Change[];
  checks: number;
  misses: number;
  hints: number;
  done: boolean;
}

export const same = (a: Arrow, b: Arrow) => a.from === b.from && a.to === b.to;
const reverse = (a: Arrow): Arrow => ({ from: a.to, to: a.from });
export const caseRecords = (c: WebCase): FeedingRecord[] => c.records.map(recordById);

export function makeRound(level: number, rng: Rng): WebRound {
  const plan = planFor(level);
  const webCase = rng.pick(plan.cases);
  const stations = rng.shuffle([...webCase.organisms]);
  const reversed = plan.start === 'one-reversed' ? rng.pick(webCase.records) : null;
  return { plan, webCase, stations, reversed };
}

export function startArrows(round: WebRound): Arrow[] {
  if (round.plan.start === 'empty') return [];
  return caseRecords(round.webCase).map((r) => (r.id === round.reversed ? { from: r.to, to: r.from } : { from: r.from, to: r.to }));
}

export function newState(round: WebRound): WebState {
  return { round, arrows: startArrows(round), undo: [], checks: 0, misses: 0, hints: 0, done: false };
}

/** Back to the level's start; misses and hints already counted stay. */
export function restartState(s: WebState) {
  s.arrows = startArrows(s.round);
  s.undo = [];
}

export type ConnectResult = 'added' | 'turned' | 'same' | 'none';

/** Dragging `from`'s badge onto `to`: add the arrow, or turn the reverse one round, or (already there) nothing. */
export function connect(s: WebState, from: Organism, to: Organism): ConnectResult {
  if (s.done || from === to) return 'none';
  const arrow = { from, to };
  if (s.arrows.some((a) => same(a, arrow))) return 'same';
  const back = s.arrows.findIndex((a) => same(a, reverse(arrow)));
  if (back >= 0) {
    s.arrows[back] = arrow;
    s.undo.push({ kind: 'turn', arrow });
    return 'turned';
  }
  s.arrows.push(arrow);
  s.undo.push({ kind: 'add', arrow });
  return 'added';
}

/** Takes back the newest change. Level 2's pre-drawn arrow can be turned back, never removed: nothing ever added it. */
export function undo(s: WebState): Change | null {
  if (s.done) return null;
  const c = s.undo.pop();
  if (!c) return null;
  if (c.kind === 'add') s.arrows = s.arrows.filter((a) => !same(a, c.arrow));
  else if (c.kind === 'turn') s.arrows = s.arrows.map((a) => (same(a, c.arrow) ? reverse(a) : a));
  else s.arrows.push(c.arrow);
  return c;
}

export type Fault =
  | { kind: 'reversed'; arrow: Arrow; record: FeedingRecord }
  | { kind: 'missing'; record: FeedingRecord }
  | { kind: 'extra'; arrow: Arrow };

/** The first thing between her arrows and the cards: a backwards arrow, then a card with no arrow, then an arrow on no card. */
export function firstFault(arrows: readonly Arrow[], c: WebCase): Fault | null {
  return faults(arrows, c)[0] ?? null;
}

export function faults(arrows: readonly Arrow[], c: WebCase): Fault[] {
  const records = caseRecords(c);
  const out: Fault[] = [];
  for (const record of records) {
    const arrow = arrows.find((a) => a.from === record.to && a.to === record.from);
    if (arrow) out.push({ kind: 'reversed', arrow, record });
  }
  for (const record of records) {
    if (!arrows.some((a) => (a.from === record.from && a.to === record.to) || (a.from === record.to && a.to === record.from))) out.push({ kind: 'missing', record });
  }
  for (const arrow of arrows) {
    if (!records.some((r) => (r.from === arrow.from && r.to === arrow.to) || (r.from === arrow.to && r.to === arrow.from))) out.push({ kind: 'extra', arrow });
  }
  return out;
}

export type CheckResult = { ok: true } | { ok: false; fault: Fault };

/** Show our web: a match finishes (once); anything else is one miss, however many faults. */
export function check(s: WebState): CheckResult | null {
  if (s.done) return null;
  s.checks++;
  const fault = firstFault(s.arrows, s.round.webCase);
  if (!fault) {
    s.done = true;
    return { ok: true };
  }
  s.misses++;
  return { ok: false, fault };
}

export type HintAction = { kind: 'turn' | 'add' | 'remove'; arrow: Arrow; record?: FeedingRecord } | { kind: 'check' };

/** What help does next: mend the first fault, or point at Show our web when nothing is wrong. */
export function hintAction(s: Pick<WebState, 'arrows' | 'round'>): HintAction {
  const fault = firstFault(s.arrows, s.round.webCase);
  if (!fault) return { kind: 'check' };
  if (fault.kind === 'reversed') return { kind: 'turn', arrow: { from: fault.record.from, to: fault.record.to }, record: fault.record };
  if (fault.kind === 'missing') return { kind: 'add', arrow: { from: fault.record.from, to: fault.record.to }, record: fault.record };
  return { kind: 'remove', arrow: fault.arrow };
}

/** Show a hint: applies the next fix and counts one hint; with nothing left to fix it counts nothing. */
export function applyHint(s: WebState): HintAction | null {
  if (s.done) return null;
  const h = hintAction(s);
  if (h.kind === 'check') return h;
  s.hints++;
  if (h.kind === 'add') {
    s.arrows.push(h.arrow);
    s.undo.push({ kind: 'add', arrow: h.arrow });
  } else if (h.kind === 'turn') {
    s.arrows = s.arrows.map((a) => (same(a, reverse(h.arrow)) ? h.arrow : a));
    s.undo.push({ kind: 'turn', arrow: h.arrow });
  } else {
    s.arrows = s.arrows.filter((a) => !same(a, h.arrow));
    s.undo.push({ kind: 'remove', arrow: h.arrow });
  }
  return h;
}

/** The card a fault is about: the one to replay with the boing, or the first card with nothing to fix. */
export function faultRecord(f: Fault): FeedingRecord | null {
  return f.kind === 'extra' ? null : f.record;
}

/* Layout ---------------------------------------------------------------------------------------- */

export interface Pt {
  x: number;
  y: number;
}
export const STATION_R = 95;
export const BADGE = 110;
/** A badge let go this close to a station's centre lands there (the nearest wins). */
export const DROP_R = 170;
export const CARD = { w: 210, h: 150 };
export const SHOW = { w: 200, h: 120 };
export const UNDO_R = 54;

export interface WebLayout {
  cards: Pt[];
  stations: Pt[];
  badges: Pt[];
  show: Pt;
  undo: Pt;
}

/** Where everything sits: the cards along the top, the stations in a triangle clear of the pet's corner, the buttons on the right. */
export function layout(v: View, cards: number): WebLayout {
  const cx = v.w / 2;
  const top = v.h * 0.4;
  const low = v.h * 0.62;
  const cardY = Math.max(100, v.h * 0.12);
  const stations = [{ x: cx, y: top }, { x: cx - 240, y: low }, { x: cx + 240, y: low }];
  return {
    cards: Array.from({ length: cards }, (_, i) => ({ x: cx + (i - (cards - 1) / 2) * 250, y: cardY })),
    stations,
    badges: stations.map((s) => ({ x: s.x, y: s.y + 58 })),
    show: { x: v.w - 140, y: v.h - 100 },
    undo: { x: v.w - 80, y: 80 },
  };
}

/** The station a badge let go at (x, y) lands on: the nearest within reach other than its own, or none. */
export function dropTarget(stations: readonly Pt[], own: number, x: number, y: number): number | null {
  let best: number | null = null;
  let bestD = DROP_R;
  stations.forEach((s, i) => {
    if (i === own) return;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/* The ghost finger ------------------------------------------------------------------------------- */

export type WebTouch = { card: RecordId } | { drag: Arrow } | 'show';

/**
 * What a capable player does next: replay each card before drawing its arrow, draw (or turn) the arrows in card order,
 * then press Show our web. `replayed` is the cards already watched.
 */
export function demoNext(s: WebState, replayed: ReadonlySet<RecordId>): WebTouch | null {
  if (s.done) return null;
  for (const record of caseRecords(s.round.webCase)) {
    const ok = s.arrows.some((a) => a.from === record.from && a.to === record.to);
    if (ok) continue;
    if (!replayed.has(record.id)) return { card: record.id };
    return { drag: { from: record.from, to: record.to } };
  }
  return 'show';
}
