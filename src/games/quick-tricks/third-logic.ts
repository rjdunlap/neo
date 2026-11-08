import type { Rng } from '../../engine/random';
import type { Band } from '../../progress/bands';
import { demoLoop, inside, type Point } from '../lasso-loops/logic';
import { POUR_TARGETS, POUR_TOLERANCE } from '../fill-dump/logic';

/** Which show a level plays: 1–3, 7 and 8 are show one, 4–6 show two, 9 the third show. */
export type Show = 'first' | 'second' | 'third';
export const showFor = (level: number): Show =>
  level >= 4 && level <= 6 ? 'second' : level === 9 ? 'third' : 'first';

export const THIRD_NAME =
  'A third show: wind a music box, fill three cups to the line, loop the fireflies asked for';

/** The bands the third show plays at; its amounts depend on the band, not on a level number. */
export type ThirdBand = 'toddler' | 'preschool' | 'prek' | 'school';
export const thirdBand = (band: Band): ThirdBand =>
  band === 'toddler' || band === 'preschool' || band === 'prek'
    ? band
    : band === 'lap'
      ? 'toddler'
      : 'school';

export interface ThirdAmounts {
  /** Half turns of the crank until the friend pops (toddler: one whole turn of any turning). */
  halves: number;
  /** The cups show a line at their target (preschool, pre-K); school shows quarter ticks and a spoken amount instead. */
  line: boolean;
  ticks: boolean;
  /** Fireflies in the meadow and how many one loop must hold (toddler: any loop around at least one catches them all). */
  flies: number;
  want: number;
  /** Preschool's fireflies sit in two loose clusters of three and two. */
  clusters: boolean;
  /** Nothing is counted at toddler. */
  counted: boolean;
}

export const AMOUNTS: Record<ThirdBand, ThirdAmounts> = {
  toddler: { halves: 2, line: false, ticks: false, flies: 3, want: 1, clusters: false, counted: false },
  preschool: { halves: 4, line: true, ticks: false, flies: 5, want: 3, clusters: true, counted: true },
  prek: { halves: 6, line: true, ticks: false, flies: 6, want: 3, clusters: false, counted: true },
  school: { halves: 5, line: false, ticks: true, flies: 8, want: 4, clusters: false, counted: true },
};
export const thirdAmounts = (band: Band): ThirdAmounts => AMOUNTS[thirdBand(band)];

// ----- the music box crank -----

export const CRANK_DEAD = 40;
export const CRANK_RING = 230;
export const CRANK_ARM = 130;
const SET_DIRECTION = Math.PI / 6;
const JUMP = Math.PI / 2;

export interface CrankState {
  /** The last angle read, or null after a lift, a jump or the dead zone (the next angle anchors with no progress). */
  anchor: number | null;
  /** 0 until the first 30° of movement sets it, either way. */
  dir: -1 | 0 | 1;
  /** Movement before the direction is set. */
  pending: number;
  /** Accumulated forward angle in radians. Never time held or event count, and never unwound. */
  total: number;
}
export const startCrank = (): CrankState => ({ anchor: null, dir: 0, pending: 0, total: 0 });

/** Wrap an angle difference to (−π, π]. */
export const wrap = (a: number) => {
  let d = a % (2 * Math.PI);
  if (d <= -Math.PI) d += 2 * Math.PI;
  if (d > Math.PI) d -= 2 * Math.PI;
  return d;
};

/** One pointer move on the crank: `angle` is the finger's angle around the axle, or null inside the dead zone. */
export function crankStep(s: CrankState, angle: number | null): CrankState {
  if (angle === null || !Number.isFinite(angle)) return { ...s, anchor: null };
  if (s.anchor === null) return { ...s, anchor: angle };
  const d = wrap(angle - s.anchor);
  if (Math.abs(d) > JUMP) return { ...s, anchor: angle };
  if (s.dir === 0) {
    const pending = s.pending + d;
    if (Math.abs(pending) < SET_DIRECTION) return { ...s, anchor: angle, pending };
    return { anchor: angle, dir: pending > 0 ? 1 : -1, pending: 0, total: s.total + Math.abs(pending) };
  }
  return { ...s, anchor: angle, total: s.total + Math.max(0, d * s.dir) };
}
/** Letting go keeps the progress; the next grasp may turn either way. */
export const crankLift = (s: CrankState): CrankState => ({
  anchor: null,
  dir: 0,
  pending: 0,
  total: s.total,
});
export const halfTurns = (s: CrankState) => Math.floor(s.total / Math.PI + 1e-9);
export const wholeTurns = (s: CrankState) => Math.floor(s.total / (2 * Math.PI) + 1e-9);

// ----- the cups -----

export interface CupsState {
  jug: number;
  cup: number;
  tray: number;
  done: boolean;
  targets: number[];
  round: number;
  /** Overfilled releases on this cup; the second brings the glowing line and the slow pour. */
  overfills: number;
  helped: boolean;
  /** The trick's one hint has been counted (the help itself still comes on any cup). */
  hinted: boolean;
  /** Releases under the target on this cup (the first brings "a little more"). */
  unders: number;
}
export function startCups(band: Band, rng: Rng): CupsState {
  const b = thirdBand(band);
  const targets =
    b === 'prek' || b === 'school'
      ? [POUR_TARGETS[0], ...rng.shuffle([POUR_TARGETS[1], POUR_TARGETS[2]])]
      : [0.5, 0.5, 0.5];
  return {
    jug: 3,
    cup: 0,
    tray: 0,
    done: false,
    targets,
    round: 0,
    overfills: 0,
    helped: false,
    hinted: false,
    unders: 0,
  };
}
export const cupTarget = (s: CupsState) => s.targets[Math.min(s.round, s.targets.length - 1)];
export const atLine = (s: CupsState) => Math.abs(s.cup - cupTarget(s)) <= POUR_TOLERANCE + 1e-9;

export type CupRelease = 'none' | 'more' | 'over' | 'help' | 'served' | 'done';

/**
 * She lets go of the jug. A cup at its line (at toddler, anything in it) is served; under it she simply pours again; over it is
 * never a miss: the second overfill on one cup brings the help (the glowing line and the slow pour), which is the trick's one hint.
 */
export function releaseCup(s: CupsState, band: Band, poured: boolean, score: { hints: number }): CupRelease {
  if (s.done || !poured) return 'none';
  const counted = thirdAmounts(band).counted;
  if (counted ? atLine(s) : s.cup > 1e-9) {
    s.round++;
    if (s.round >= s.targets.length) {
      s.done = true;
      return 'done';
    }
    // The served cup's water and the tray's go back to the jug for the next cup.
    s.jug += s.cup + s.tray;
    s.cup = s.tray = s.overfills = s.unders = 0;
    s.helped = false;
    return 'served';
  }
  if (!counted || s.cup < cupTarget(s)) {
    s.unders++;
    return 'more';
  }
  s.overfills++;
  if (s.overfills >= 2 && !s.helped) {
    s.helped = true;
    // At most one hint per trick, as in the earlier shows.
    if (!s.hinted) score.hints++;
    s.hinted = true;
    return 'help';
  }
  return 'over';
}

/** The jug's movement needed for the rest of this cup, at the help's half speed if it is on. */
export const pourNeeded = (s: CupsState) => Math.max(0, cupTarget(s) - s.cup) * (s.helped ? 2 : 1);

// ----- the fireflies -----

/** The meadow box the fireflies sit in: it fits a 768-wide portrait and a 768-tall landscape. */
export const MEADOW = { w: 480, h: 400 };
export const FLY_GAP = 110;
const EDGE = 40;

function far(points: readonly Point[], p: Point) {
  return points.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= FLY_GAP);
}

function spaced(n: number, rng: Rng): Point[] | null {
  const points: Point[] = [];
  for (let tries = 0; points.length < n && tries < 400; tries++) {
    const p = { x: rng.range(EDGE, MEADOW.w - EDGE), y: rng.range(EDGE, MEADOW.h - EDGE) };
    if (far(points, p)) points.push(p);
  }
  return points.length === n ? points : null;
}

/** Preschool's two loose clusters of three and two, their centres far apart on a diagonal. */
export function clusters(rng: Rng): Point[] {
  const flip = rng.chance(0.5);
  const a = { x: MEADOW.w * 0.27, y: MEADOW.h * (flip ? 0.7 : 0.3) };
  const b = { x: MEADOW.w * 0.73, y: MEADOW.h * (flip ? 0.3 : 0.7) };
  const [three, two] = rng.chance(0.5) ? [a, b] : [b, a];
  const turn = rng.range(0, (2 * Math.PI) / 3);
  const out: Point[] = [];
  for (let i = 0; i < 3; i++)
    out.push({
      x: three.x + 80 * Math.cos(turn + (i * 2 * Math.PI) / 3),
      y: three.y + 80 * Math.sin(turn + (i * 2 * Math.PI) / 3),
    });
  const tilt = rng.range(-0.6, 0.6);
  for (const side of [-1, 1])
    out.push({ x: two.x + side * 65 * Math.cos(tilt), y: two.y + side * 65 * Math.sin(tilt) });
  return out;
}

/** Fireflies in the meadow box's units, at least FLY_GAP apart, re-rolled until a loop around exactly `want` exists. */
export function meadow(band: Band, rng: Rng): Point[] {
  const a = thirdAmounts(band);
  for (let tries = 0; tries < 50; tries++) {
    const points = a.clusters ? clusters(rng) : spaced(a.flies, rng);
    if (points && demoLoop(points, a.want, 34)) return points;
  }
  // A plain row always has a loop around any number of its fireflies.
  return Array.from({ length: a.flies }, (_, i) => ({
    x: EDGE + ((MEADOW.w - 2 * EDGE) * (i + 0.5)) / a.flies,
    y: MEADOW.h / 2,
  }));
}

export type LoopVerdict = 'small' | 'free' | 'catch' | 'miss';

/** A trail shorter than this is ignored, free (Lasso Loops' rule). */
export const LOOP_MIN = 120;
export const trailLength = (points: readonly Point[]) =>
  points.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : 0), 0);

/**
 * Judge one loop (it always closes back to its start). Around none: free. At toddler, around any: every firefly follows. From
 * preschool, exactly `want` catches them; any other count is a miss, and the second miss in the trick brings the glow (one hint).
 */
export function judgeLoop(
  band: Band,
  loop: readonly Point[],
  flies: readonly Point[],
  score: { misses: number; hints: number },
  trick: { wrong: number },
): { verdict: LoopVerdict; got: number[] } {
  if (trailLength(loop) < LOOP_MIN) return { verdict: 'small', got: [] };
  const got = flies.flatMap((f, i) => (inside(loop, f) ? [i] : []));
  if (!got.length) return { verdict: 'free', got };
  const a = thirdAmounts(band);
  if (!a.counted || got.length === a.want) return { verdict: 'catch', got };
  score.misses++;
  trick.wrong++;
  if (trick.wrong === 2) score.hints++;
  return { verdict: 'miss', got };
}

/** The bot's crank trace: one whole turn of 24 points on the knob's circle, starting from the arm's angle. */
export function crankCircle(from: number, dir: 1 | -1 = 1): Point[] {
  return Array.from({ length: 24 }, (_, i) => {
    const a = from + (dir * (i + 1) * 2 * Math.PI) / 24;
    return { x: CRANK_ARM * Math.cos(a), y: CRANK_ARM * Math.sin(a) };
  });
}
