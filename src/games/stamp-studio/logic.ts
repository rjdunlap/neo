import type { ColorName } from '../../art/palette';
import { STAMP_KINDS, type StampKindId } from '../../content/creations';
import { Rng } from '../../engine/random';
import { stepFromUnit } from '../../audio/notes';
import type { AnimalSound } from '../../audio/sfx';
import { leafOutline } from '../fossil-dig/logic';
export { STAMP_KINDS };
export type StampKind = StampKindId;
export const STAMP_NAMES: Record<StampKind, string> = { star: 'A star', flower: 'A flower', fish: 'A fish', cat: 'A cat' };

/** Saved sticker seeds always use these original four kinds and colors, in their historical order. */
const STICKER_KINDS = STAMP_KINDS.slice(0, 4);
const STICKER_COLORS = ['purple', 'pink', 'blue', 'green'] as const;
export function stickerStamp(seed: number) {
  return { kind: new Rng(seed).pick(STICKER_KINDS), color: new Rng(seed + 3).pick(STICKER_COLORS) };
}
export interface Stamp { kind: StampKind; color: ColorName; x: number; y: number; size: number; turns: number }
export const LIMIT = 24;
export interface StampPlan {
  kinds: readonly StampKind[];
  color: boolean;
  move: boolean;
  transform: boolean;
  prompt: 'pats' | 'stars' | 'friends' | 'picture' | 'sizes' | 'garden' | 'story' | 'leaf' | 'feet';
  name: string;
  /** Every stamp is pressed at this size, and this many of them finish the picture (the lap level). */
  pat?: { size: number; count: number };
  /** A music-note button plays the picture back, left to right. */
  play?: boolean;
  /** Trace Prints (levels 8–9): the paper is mud, and each maker presses its own shape; `count` prints finish the round. */
  trace?: { makers: readonly TraceMakerId[]; count: number; tilt: boolean };
}
/** Each pat is a stamp of 170 units across (the art's radius is 48 at size 1); the eighth finishes the picture. */
export const PAT = { size: 85 / 48, count: 8 } as const;
export const PLANS = [
  { kinds: ['star'], color: false, move: false, transform: false, prompt: 'stars', name: 'Press one kind of stamp onto a picture' },
  { kinds: ['cat', 'fish'], color: false, move: false, transform: false, prompt: 'friends', name: 'Make a picture with two kinds of stamps' },
  { kinds: ['star', 'flower', 'fish'], color: true, move: true, transform: false, prompt: 'picture', play: true, name: 'Choose colors, stamp, and rearrange a picture' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'sizes', play: true, name: 'Turn stamps and make them big or small' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'garden', play: true, name: 'Make an imaginary garden, then tell its story' },
  { kinds: ['star', 'flower', 'fish', 'cat'], color: true, move: true, transform: true, prompt: 'story', play: true, name: 'Make two friends on an adventure; every story is welcome' },
  // Easiest of all: placed first for lap by `order`, so it has the highest ID.
  { kinds: ['star'], color: false, move: false, transform: false, prompt: 'pats', name: 'Pat the paper: eight big soft stamps make a picture', pat: PAT },
  // Trace Prints: fresh prints in mud, appended so levels 1–7 keep their IDs (lap and toddler reach them through `order`).
  { kinds: [], color: false, move: false, transform: false, prompt: 'leaf', name: 'Leaf prints: pat the mud and the leaf leaves its shape', trace: { makers: ['leaf'], count: 8, tilt: true } },
  { kinds: [], color: false, move: false, transform: false, prompt: 'feet', name: 'Two feet: a duck foot and a cat paw each leave their own print', trace: { makers: ['duck', 'paw'], count: 10, tilt: false } },
] as const satisfies readonly StampPlan[];
export const planFor = (level: number): StampPlan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];
/** Normalized coordinates leave room for the largest stamp (or, with its margin, a whole print), including after resizing. */
export function place(x: number, y: number, width: number, height: number, margin = 70) {
  return { x: Math.max(0, Math.min(1, (x - margin) / (width - 2 * margin))), y: Math.max(0, Math.min(1, (y - margin) / (height - 2 * margin))) };
}
export const pixel = (s: Pick<Stamp, 'x' | 'y'>, width: number, height: number, margin = 70) =>
  ({ x: margin + s.x * (width - 2 * margin), y: margin + s.y * (height - 2 * margin) });

/** Playing the picture: the lowest and highest scale steps (C4 to E5), and the longest gap between two notes. */
export const PLAY = { from: 0, count: 8, gap: 0.4, longest: 5.5 } as const;
export interface PlayNote { index: number; step: number; at: number }
/**
 * Play the picture: a scan from left to right, so stamps sound in x-order (ties, top first), each pitched by its height on the
 * pentatonic scale (higher on the paper sounds higher). Notes are evenly spaced, at most 0.4 s apart and never longer than 5.5 s
 * in all, so a full paper of 24 still plays in under 6 s. Nothing here is scored.
 */
export function playOrder(stamps: readonly Pick<Stamp, 'x' | 'y'>[]): PlayNote[] {
  const order = stamps.map((s, index) => ({ s, index })).sort((a, b) => a.s.x - b.s.x || a.s.y - b.s.y);
  const gap = order.length > 1 ? Math.min(PLAY.gap, PLAY.longest / (order.length - 1)) : 0;
  return order.map(({ s, index }, i) => ({ index, step: stepFromUnit(1 - s.y, PLAY.from, PLAY.count), at: i * gap }));
}

/** The colors on the color buttons, in order. */
export const STAMP_COLORS: ColorName[] = ['purple', 'blue', 'green', 'pink'];

/** Early rounds vary their existing tools without adding simultaneous choices. */
export function roundPlan(level: number, rng: Rng): { plan: StampPlan; color: ColorName } {
  const base = planFor(level);
  if (level > 3) return { plan: base, color: 'purple' };
  return {
    plan: { ...base, kinds: rng.shuffle([...STAMP_KINDS]).slice(0, base.kinds.length) },
    color: rng.pick(STAMP_COLORS),
  };
}

/** What the demonstration needs to see of the sheet to know its next move. */
export interface StampState {
  stamps: Pick<Stamp, 'x' | 'y' | 'size' | 'turns'>[];
  /** The stamp and color picked now. */
  kind: StampKind;
  color: ColorName;
}

export type StampMove =
  | { do: 'kind'; kind: StampKind }
  | { do: 'color'; color: ColorName }
  | { do: 'stamp'; x: number; y: number }
  | { do: 'turn' }
  | { do: 'grow' }
  | { do: 'move'; stamp: number; x: number; y: number }
  | { do: 'finish' };

/**
 * Where the demonstration presses its five stamps, in the sheet's own 0 to 1 coordinates. At the smallest sheet they are at least
 * 190 units apart, so no stamp lands on another (a stamp's touch circle is 55 units wide).
 */
/** Where the demonstration pats the paper at the lap level: two rows of four. */
export const PAT_SPOTS = [0.12, 0.37, 0.63, 0.88].flatMap(x => [{ x, y: 0.25 }, { x, y: 0.8 }]);
export const DEMO_SPOTS = [{ x: 0.15, y: 0.25 }, { x: 0.5, y: 0.2 }, { x: 0.85, y: 0.25 }, { x: 0.3, y: 0.8 }, { x: 0.7, y: 0.8 }] as const;
const DEMO_COLORS: ColorName[] = ['purple', 'blue', 'green', 'pink', 'purple'];
/** On a level where stamps move, the first stamp is carried to the middle. */
const DEMO_MOVE = { stamp: 0, x: 0.5, y: 0.55 } as const;

/**
 * The next thing a capable child does to make a small picture at this level, from the sheet as it is: choose a stamp (and color,
 * where the level has colors) for each of five presses, turn the third and make the fourth big where a level has those buttons,
 * carry the first to the middle where stamps move, then press the green arrow. Nothing here is a right or wrong answer.
 */
export function stampDemo(plan: StampPlan, st: StampState): StampMove {
  const n = st.stamps.length;
  if (plan.pat) return n < plan.pat.count ? { do: 'stamp', ...PAT_SPOTS[n] } : { do: 'finish' };
  const last = st.stamps[n - 1];
  if (plan.transform && n === 3 && last.turns === 0) return { do: 'turn' };
  if (plan.transform && n === 4 && last.size === 1) return { do: 'grow' };
  if (n < DEMO_SPOTS.length) {
    const kind = plan.kinds[n % plan.kinds.length];
    if (st.kind !== kind) return { do: 'kind', kind };
    if (plan.color && st.color !== DEMO_COLORS[n]) return { do: 'color', color: DEMO_COLORS[n] };
    return { do: 'stamp', ...DEMO_SPOTS[n] };
  }
  if (plan.move && Math.abs(st.stamps[DEMO_MOVE.stamp].x - DEMO_MOVE.x) > 0.02) return { do: 'move', ...DEMO_MOVE };
  return { do: 'finish' };
}

// ---- Trace Prints (levels 8–9): fresh prints in mud. Every touch is creative play: 0 misses, 0 hints, nothing kept. ----

export type TraceMakerId = 'leaf' | 'duck' | 'paw';
export const TRACE_MAKERS: Record<TraceMakerId, { name: string; across: number; toes: number; sound?: AnimalSound }> = {
  leaf: { name: 'A leaf', across: 170, toes: 0 },
  duck: { name: 'Duck foot', across: 150, toes: 3, sound: 'quack' },
  paw: { name: 'Cat paw', across: 150, toes: 4, sound: 'meow' },
};
export interface Pt { x: number; y: number }
/** A maker's shape, centred on its bounds: filled outlines and circles (the print's dent) and inner lines (veins, toe and pad gaps). */
export interface TraceShape { polys: Pt[][]; circles: (Pt & { r: number })[]; lines: Pt[][] }

function centred(shape: TraceShape, across: number): TraceShape {
  const xs: number[] = [], ys: number[] = [];
  for (const p of shape.polys.flat()) { xs.push(p.x); ys.push(p.y); }
  for (const c of shape.circles) { xs.push(c.x - c.r, c.x + c.r); ys.push(c.y - c.r, c.y + c.r); }
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const k = across / (Math.max(...xs) - Math.min(...xs));
  const at = (p: Pt) => ({ x: (p.x - cx) * k, y: (p.y - cy) * k });
  return { polys: shape.polys.map(ps => ps.map(at)), circles: shape.circles.map(c => ({ ...at(c), r: c.r * k })), lines: shape.lines.map(ps => ps.map(at)) };
}
const SHAPES: Record<TraceMakerId, TraceShape> = {
  // Fossil Dig's invented five-lobed leaf: a midrib to the top lobe and a vein to each of the other four.
  leaf: centred({
    polys: [leafOutline('star')],
    circles: [],
    lines: [-90, -18, 54, 126, 198].map(deg => { const a = deg * Math.PI / 180; return [{ x: 0, y: 15 }, { x: Math.cos(a) * 128 * 0.85, y: 15 + Math.sin(a) * 128 * 0.85 }]; }),
  }, TRACE_MAKERS.leaf.across),
  // Three long webbed toes, taller than wide.
  duck: centred({
    polys: [[{ x: -14, y: 75 }, { x: -75, y: -52 }, { x: -62, y: -64 }, { x: -32, y: -40 }, { x: -11, y: -85 }, { x: 11, y: -85 },
      { x: 32, y: -40 }, { x: 62, y: -64 }, { x: 75, y: -52 }, { x: 14, y: 75 }]],
    circles: [],
    lines: [[{ x: 0, y: 58 }, { x: -64, y: -50 }], [{ x: 0, y: 58 }, { x: 0, y: -74 }], [{ x: 0, y: 58 }, { x: 64, y: -50 }]],
  }, TRACE_MAKERS.duck.across),
  // One round pad and four round toes, wider than tall.
  paw: centred({
    polys: [],
    circles: [{ x: 0, y: 25, r: 38 }, { x: -58, y: -22, r: 17 }, { x: -22, y: -50, r: 17 }, { x: 22, y: -50, r: 17 }, { x: 58, y: -22, r: 17 }],
    lines: [],
  }, TRACE_MAKERS.paw.across),
};
export const traceShape = (id: TraceMakerId) => SHAPES[id];
/** The shape's width and height (before any tilt). */
export function traceBounds(id: TraceMakerId) {
  const s = SHAPES[id], xs: number[] = [], ys: number[] = [];
  for (const p of s.polys.flat()) { xs.push(p.x); ys.push(p.y); }
  for (const c of s.circles) { xs.push(c.x - c.r, c.x + c.r); ys.push(c.y - c.r, c.y + c.r); }
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
/** The farthest any part of the shape reaches from its centre, so a print at any tilt stays inside this radius. */
export function traceReach(id: TraceMakerId) {
  const s = SHAPES[id];
  return Math.max(...s.polys.flat().map(p => Math.hypot(p.x, p.y)), ...s.circles.map(c => Math.hypot(c.x, c.y) + c.r));
}
/** How far a print's centre keeps from the mud's edge: at least half its width and 5 more, and never less than its reach, so the whole print stays on the mud. */
export const traceMargin = (id: TraceMakerId) => Math.ceil(Math.max(TRACE_MAKERS[id].across / 2, traceReach(id))) + 5;
/** The seeded tilt of one leaf press, in degrees (the leaf and its print share it). */
export const TILTS = [-20, -10, 0, 10, 20] as const;
export const traceTilt = (rng: Rng) => rng.pick(TILTS);

/** One round's prints, in order, and whether the pair moment has been said. */
export interface TraceRound { prints: TraceMakerId[]; paired: boolean; done: boolean }
export const traceRound = (): TraceRound => ({ prints: [], paired: false, done: false });
/**
 * Press one print. `pair` is true on the one press of a round that first makes every one of the plan's makers present (never at
 * level 8, which has one); undoing a print never makes it fire again. `finish` is true on the press that reaches the plan's count.
 */
export function tracePress(plan: NonNullable<StampPlan['trace']>, round: TraceRound, maker: TraceMakerId) {
  if (round.done) return { pair: false, finish: false };
  round.prints.push(maker);
  const pair = plan.makers.length > 1 && !round.paired && plan.makers.every(m => round.prints.includes(m));
  if (pair) round.paired = true;
  const finish = round.prints.length >= plan.count;
  if (finish) round.done = true;
  return { pair, finish };
}
/** The back arrow smooths away the latest print. */
export const traceUndo = (round: TraceRound) => { if (!round.done) round.prints.pop(); };

export type TraceMove = { do: 'choose'; maker: TraceMakerId } | { do: 'press'; x: number; y: number } | { do: 'finish' };
/**
 * The ghost finger: level 8 pats `PAT_SPOTS` in order until the round ends itself; level 9 presses three duck prints, chooses the
 * paw, presses two paw prints, then taps the green arrow, so it shows choosing, both marks and the optional finish.
 */
export function traceDemo(plan: NonNullable<StampPlan['trace']>, st: { prints: readonly TraceMakerId[]; chosen: TraceMakerId }): TraceMove {
  const n = st.prints.length;
  if (plan.makers.length === 1) return n < plan.count ? { do: 'press', ...PAT_SPOTS[n % PAT_SPOTS.length] } : { do: 'finish' };
  if (n >= 5) return { do: 'finish' };
  const want = n < 3 ? plan.makers[0] : plan.makers[1];
  return st.chosen !== want ? { do: 'choose', maker: want } : { do: 'press', ...DEMO_SPOTS[n] };
}
