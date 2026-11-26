/**
 * Rain Garden level 8, the mystery patch: a covered patch follows one of two pretend rules, "empties between rains"
 * (`reset`) or "stays full" (`keep`). She builds a test of one or two rains, taps the cloud, watches only the pond, then
 * lights every idea card that still fits the water she saw. One rain looks the same either way, so "both still fit" is
 * the right answer to it; only a second rain in a row can tell the ideas apart. The rules are here; drawing and timing
 * are in mystery-scene.ts. Capacity two is the toy's invented number, as at every level.
 */
import type { Rng } from '../../engine/random';
import { FRIENDS, runShower, type Box, type Friend, type Step } from './logic';

export type Rule = 'reset' | 'keep';
export const RULES: readonly Rule[] = ['reset', 'keep'];
/** A rain's size in drops: small or big. */
export type Size = 2 | 4;
export const SIZES: readonly Size[] = [2, 4];
/** The one soil bed's capacity (the toy's invented number). */
export const PATCH_CAPACITY = 2;
export const MAX_RAINS = 2;

export interface MysteryRain {
  units: Size;
  steps: Step[];
  /** What the patch holds when this rain has settled. */
  kept: number;
  /** What ran down to the pond in this rain. */
  pond: number;
}
export interface MysteryRun {
  rule: Rule;
  plan: Size[];
  rains: MysteryRain[];
}

/** Run a plan on a fresh patch: `keep` carries the stored water into the next rain, `reset` empties it first. */
export function runPlan(rule: Rule, plan: readonly Size[]): MysteryRun {
  const rains: MysteryRain[] = [];
  let stored = 0;
  for (const units of plan) {
    if (rule === 'reset') stored = 0;
    const r = runShower({ surface: 'soil', stored }, { water: 0 }, units);
    stored = r.patch.stored;
    rains.push({ units, steps: r.steps, kept: stored, pond: r.pond.water });
  }
  return { rule, plan: [...plan], rains };
}

/** What she sees: the pond rows of the latest run. */
export interface Evidence {
  plan: Size[];
  ponds: number[];
}
export const evidenceOf = (run: MysteryRun): Evidence => ({
  plan: run.plan,
  ponds: run.rains.map((r) => r.pond),
});

/** The rules whose run of this plan leaves exactly this water in the pond. */
export function fits(e: Evidence): Rule[] {
  return RULES.filter((rule) => {
    const ponds = runPlan(rule, e.plan).rains.map((r) => r.pond);
    return ponds.length === e.ponds.length && ponds.every((p, i) => p === e.ponds[i]);
  });
}

export type Judgement = 'ok' | 'over' | 'wrong' | 'under';

/** `marks` must equal what fits; otherwise one cause. Marks are never empty here (no mark, no Check). */
export function judge(marks: readonly Rule[], e: Evidence): Judgement {
  const f = fits(e);
  const same = marks.length === f.length && marks.every((m) => f.includes(m));
  if (same) return 'ok';
  if (marks.length === 2) return 'under';
  return f.includes(marks[0]) ? 'over' : 'wrong';
}

// ---- round ----

export interface MysteryRound {
  truth: Rule;
  friend: Friend;
  start: Size[];
}

export function makeMystery(rng: Rng, authored: boolean): MysteryRound {
  if (authored) return { truth: 'keep', friend: 'frog', start: [4] };
  return {
    truth: rng.pick(RULES),
    friend: rng.pick(FRIENDS),
    start: [rng.pick(SIZES)],
  };
}

export interface MysteryState {
  truth: Rule;
  plan: Size[];
  evidence: Evidence | null;
  runs: number;
  marks: Rule[];
  /** Keys (`run:marks`) of the failed Checks already counted as a miss. */
  failed: string[];
  misses: number;
  hints: number;
  /** The cards' predicted rows are showing. */
  ghosts: boolean;
  ghostsShown: boolean;
  /** The run a supported "both still fit" Check was made on. */
  supportedRun: number | null;
  revealed: boolean;
  pointing: 'check' | 'leaf' | null;
  finished: boolean;
}

export function mysteryFresh(round: MysteryRound): MysteryState {
  return {
    truth: round.truth,
    plan: [...round.start],
    evidence: null,
    runs: 0,
    marks: [],
    failed: [],
    misses: 0,
    hints: 0,
    ghosts: false,
    ghostsShown: false,
    supportedRun: null,
    revealed: false,
    pointing: null,
    finished: false,
  };
}

/** Start again: the round's starting plan and no evidence; the truth, misses, hints and run count stay. */
export const mysteryRestart = (s: MysteryState, round: MysteryRound): MysteryState => ({
  ...mysteryFresh(round),
  truth: s.truth,
  runs: s.runs,
  misses: s.misses,
  hints: s.hints,
  ghostsShown: s.ghostsShown,
});

const NEXT_SIZE: Record<number, 0 | Size> = { 0: 2, 2: 4, 4: 0 };

/** Cycle slot `i` empty → small → big → empty; slots compact so the first is never empty before a filled second. */
export function setSlot(s: MysteryState, i: 0 | 1): MysteryState {
  const slots: (0 | Size)[] = [s.plan[0] ?? 0, s.plan[1] ?? 0];
  slots[i] = NEXT_SIZE[slots[i]];
  return { ...s, plan: slots.filter((x): x is Size => x !== 0), pointing: null };
}

/** A rain is allowed once the plan has a rain in it. */
export const canRun = (s: MysteryState) => s.plan.length > 0;

/** Run the plan on a fresh patch: the latest run becomes the evidence, and the ghost rows go away. */
export function mysteryRun(s: MysteryState): MysteryState {
  if (!canRun(s)) return s;
  return {
    ...s,
    evidence: evidenceOf(runPlan(s.truth, s.plan)),
    runs: s.runs + 1,
    ghosts: false,
    pointing: null,
  };
}

/** Lighting or unlighting a card is free at any time. */
export function toggleMark(s: MysteryState, rule: Rule): MysteryState {
  const marks = s.marks.includes(rule)
    ? s.marks.filter((r) => r !== rule)
    : RULES.filter((r) => r === rule || s.marks.includes(r));
  return { ...s, marks, pointing: null };
}

export const canCheck = (s: MysteryState) => s.evidence !== null && s.marks.length > 0;
export const mysteryCanFinish = (s: MysteryState) => s.revealed;

export const checkKey = (s: MysteryState) => `${s.runs}:${s.marks.join('+')}`;

export interface MysteryVerdict {
  judgement: Judgement | 'none';
  /** An `ok` Check that named one rule, so the cover lifts. */
  reveal: boolean;
}

/** Check the marks against the evidence on screen. */
export function mysteryCheck(s: MysteryState): { state: MysteryState; verdict: MysteryVerdict } {
  if (!canCheck(s)) return { state: s, verdict: { judgement: 'none', reveal: false } };
  const judgement = judge(s.marks, s.evidence!);
  if (judgement === 'ok') {
    const reveal = fits(s.evidence!).length === 1;
    return {
      state: reveal
        ? { ...s, revealed: true, ghosts: false, pointing: null }
        : { ...s, supportedRun: s.runs, pointing: null },
      verdict: { judgement, reveal },
    };
  }
  const key = checkKey(s);
  const fresh = !s.failed.includes(key);
  const misses = s.misses + (fresh ? 1 : 0);
  const showGhosts = misses >= 2;
  return {
    state: {
      ...s,
      failed: fresh ? [...s.failed, key] : s.failed,
      misses,
      ghosts: showGhosts,
      ghostsShown: s.ghostsShown || showGhosts,
      hints: s.hints + (showGhosts && !s.ghostsShown ? 1 : 0),
      pointing: null,
    },
    verdict: { judgement, reveal: false },
  };
}

/** The pond rows a rule would have left for this plan: what a card's ghost rows draw. */
export const ghostRows = (rule: Rule, plan: readonly Size[]): number[] =>
  runPlan(rule, plan).rains.map((r) => r.pond);

/** Show me: the next useful step, at most four from anywhere. */
export type MysteryHint = 'test' | 'mark' | 'check' | 'leaf';

export function mysteryHint(s: MysteryState): { state: MysteryState; hint: MysteryHint } {
  if (s.revealed) {
    return {
      state: { ...s, pointing: 'leaf', hints: s.hints + (s.pointing === 'leaf' ? 0 : 1) },
      hint: 'leaf',
    };
  }
  if (!s.evidence || s.evidence.plan.length < MAX_RAINS) {
    // The whole worked test is one hint: two big rains in a row, then run them.
    return { state: { ...s, plan: [4, 4], pointing: null, hints: s.hints + 1 }, hint: 'test' };
  }
  const f = fits(s.evidence);
  const same = s.marks.length === f.length && f.every((r) => s.marks.includes(r));
  if (!same) return { state: { ...s, marks: [...f], pointing: null, hints: s.hints + 1 }, hint: 'mark' };
  return {
    state: { ...s, pointing: 'check', hints: s.hints + (s.pointing === 'check' ? 0 : 1) },
    hint: 'check',
  };
}

/** What the scripted bot taps next. It never misses: it answers a one-rain test with both cards, then tests twice. */
export type MysteryTap =
  | { kind: 'slot'; i: 0 | 1 }
  | { kind: 'cloud' }
  | { kind: 'card'; rule: Rule }
  | { kind: 'check' }
  | { kind: 'leaf' };

export function mysteryNext(s: MysteryState): MysteryTap {
  if (s.revealed) return { kind: 'leaf' };
  const e = s.evidence;
  if (!e) return { kind: 'cloud' };
  if (e.plan.length < MAX_RAINS) {
    const missing = RULES.find((r) => !s.marks.includes(r));
    if (s.supportedRun !== s.runs) {
      if (missing) return { kind: 'card', rule: missing };
      return { kind: 'check' };
    }
    return s.plan.length < MAX_RAINS ? { kind: 'slot', i: 1 } : { kind: 'cloud' };
  }
  const f = fits(e);
  const wrong = RULES.find((r) => s.marks.includes(r) !== f.includes(r));
  if (wrong) return { kind: 'card', rule: wrong };
  return { kind: 'check' };
}

// ---- layout ----

export interface MysteryLayout {
  cloud: Box;
  patch: Box;
  /** The two plan slots, then the two idea cards. */
  slots: [Box, Box];
  cards: [Box, Box];
  pond: Box;
  /** Two rows of four slots in the pond tray, and a badge at each row's left end. */
  rows: [Box[], Box[]];
  badges: [Box, Box];
  arrow: { x1: number; y1: number; x2: number; y2: number };
  friend: { x: number; y: number };
  /** The Check, and the leaf that takes its place. */
  check: Box;
}

const FW = 1024,
  FH = 768,
  UW = 768,
  UH = 1024;
export const MYST_TARGET = 120;
const bx = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** Level 6's measured footprints: the cloud and patch where its top bed stood, the cards where its low bed stood. */
export function mysteryLayout(view: { w: number; h: number; upright?: true }): MysteryLayout | null {
  const { w, h, upright } = view;
  const fw = upright ? UW : FW;
  const fh = upright ? UH : FH;
  if (w < fw - 1 || h < fh - 1) return null;
  const ox = (w - fw) / 2;
  const oy = upright ? h - fh : (h - fh) / 2;
  const at = (x: number, y: number, bw: number, bh: number) => bx(ox + x, oy + y, bw, bh);
  const patch = at(upright ? 220 : 300, upright ? 470 : 260, 300, 150);
  const pond = at(upright ? 548 : 823, upright ? 918 : 662, 320, 148);
  const rows = (dy: number) =>
    [-1.5, -0.5, 0.5, 1.5].map((k) => bx(pond.x + 30 + k * 58, pond.y + dy, 56, 56));
  const slot = (x: number) => at(x, upright ? 300 : 230, MYST_TARGET, MYST_TARGET);
  const card = (x: number) => at(x, upright ? 510 : 465, MYST_TARGET, MYST_TARGET);
  return {
    cloud: at(upright ? 220 : 300, upright ? 300 : 110, 260, 140),
    patch,
    slots: upright ? [slot(470), slot(610)] : [slot(660), slot(800)],
    cards: upright ? [card(470), card(610)] : [card(740), card(880)],
    pond,
    rows: [rows(-31), rows(31)],
    badges: [bx(pond.x - 130, pond.y - 31, 56, 56), bx(pond.x - 130, pond.y + 31, 56, 56)],
    arrow: upright
      ? { x1: patch.x + 100, y1: patch.y + 85, x2: pond.x - 90, y2: pond.y - 90 }
      : { x1: patch.x + 110, y1: patch.y + 85, x2: pond.x - 120, y2: pond.y - 90 },
    friend: { x: pond.x + (upright ? 160 : -115), y: pond.y - (upright ? 106 : 85) },
    check: bx(w - 20 - MYST_TARGET / 2, 18 + MYST_TARGET / 2, MYST_TARGET, MYST_TARGET),
  };
}
