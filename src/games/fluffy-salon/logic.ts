import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Fluffy Salon, after Toca Hair Salon: the pet sits in the chair with a head of fluffy fur.
 * Grow it, snip it, comb it straight, curl it and color it. Free play at first, then requests
 * ("long and pink") checked in the mirror.
 */
export type SalonMode = 'play' | 'tools' | 'ask' | 'two' | 'match';

export interface SalonPlan {
  mode: SalonMode;
  /** Requests in a round (free play has none). */
  requests: number;
  name: string;
}

export const PLANS: SalonPlan[] = [
  { mode: 'play', requests: 0, name: 'Grow and color the pet\'s fluffy fur' },
  { mode: 'tools', requests: 0, name: 'Free play with every tool: grow, snip, comb, curl, color' },
  { mode: 'ask', requests: 3, name: 'One request at a time: "make it long", "make it pink"' },
  { mode: 'two', requests: 3, name: 'Two-part requests checked in the mirror: "short and blue"' },
  { mode: 'match', requests: 2, name: 'Copy a pictured style: length, curls and color' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const HAIR_COLORS: ColorName[] = ['pink', 'blue', 'purple', 'yellow', 'green'];
export const MAX_LENGTH = 220;
export const MIN_LENGTH = 8;
const SHORT = 50;
const LONG = 145;
const CURLY = 0.6;
const STRAIGHT = 0.2;
const MOSTLY = 0.8;

export interface Strand {
  length: number;
  /** 0 straight .. 1 very curly. */
  curl: number;
  color: ColorName;
}

export interface Look {
  length?: 'short' | 'long';
  curl?: 'curly' | 'straight';
  color?: ColorName;
}

export interface Request {
  look: Look;
  /** How the hair starts for this request, so it never begins already done. */
  start: { length: number; curl: number; color: ColorName };
}

export function stats(strands: Strand[]) {
  const n = strands.length || 1;
  const length = strands.reduce((s, x) => s + x.length, 0) / n;
  const curl = strands.reduce((s, x) => s + x.curl, 0) / n;
  const counts = new Map<ColorName, number>();
  for (const x of strands) counts.set(x.color, (counts.get(x.color) ?? 0) + 1);
  const share = (c: ColorName) => (counts.get(c) ?? 0) / n;
  return { length, curl, share };
}

export type Fix = 'longer' | 'shorter' | 'curlier' | 'straighter' | ColorName;

/** What still needs doing for this look, first thing first; null when it's done. */
export function needs(look: Look, strands: Strand[]): Fix | null {
  const s = stats(strands);
  if (look.length === 'long' && s.length < LONG) return 'longer';
  if (look.length === 'short' && s.length > SHORT) return 'shorter';
  if (look.color && s.share(look.color) < MOSTLY) return look.color;
  if (look.curl === 'curly' && s.curl < CURLY) return 'curlier';
  if (look.curl === 'straight' && s.curl > STRAIGHT) return 'straighter';
  return null;
}

/** Which tool fixes what. */
export type Tool = 'grow' | 'cut' | 'comb' | 'curl' | ColorName;
export const toolFor = (fix: Fix): Tool => (fix === 'longer' ? 'grow' : fix === 'shorter' ? 'cut' : fix === 'curlier' ? 'curl' : fix === 'straighter' ? 'comb' : fix);

/** "long", "short and blue", "long, curly and pink". */
export function describe(look: Look): string {
  const parts = [look.length, look.curl, look.color].filter(Boolean) as string[];
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

function pickLook(mode: SalonMode, rng: Rng, avoid: string[]): Look {
  for (let tries = 0; tries < 50; tries++) {
    const length = rng.pick(['short', 'long'] as const);
    const curl = rng.pick(['curly', 'straight'] as const);
    const color = rng.pick(HAIR_COLORS);
    let look: Look;
    if (mode === 'ask') look = rng.pick<Look>([{ length }, { color }, { curl }]);
    else if (mode === 'two') look = rng.pick<Look>([{ length, color }, { length, curl }, { curl, color }]);
    else look = { length, curl, color };
    const key = describe(look);
    if (!avoid.includes(key)) return look;
  }
  return { color: 'pink' };
}

/** Requests, each starting from hair that is clearly not the asked-for style yet. */
export function makeRequests(plan: SalonPlan, rng: Rng): Request[] {
  const out: Request[] = [];
  for (let i = 0; i < plan.requests; i++) {
    const look = pickLook(plan.mode, rng, out.map((r) => describe(r.look)));
    const length = look.length === 'long' ? 70 : look.length === 'short' ? 130 : 95;
    const curl = look.curl === 'curly' ? 0.1 : look.curl === 'straight' ? 0.75 : 0.35;
    const color = rng.pick(HAIR_COLORS.filter((c) => c !== look.color));
    out.push({ look, start: { length, curl, color } });
  }
  return out;
}

// ----- the fur: where strands grow and what a touch does to them (moved here so the demonstration's strokes can be tested) -----

export const STRANDS = 26;
export const SEG = 12;
/** How close (in body units) the finger has to come to a strand to work on it. */
export const REACH = 38;

export interface Pt {
  x: number;
  y: number;
}

export interface Anchor {
  x: number;
  y: number;
  /** Which way the strand first grows, and which way it falls. */
  out: number;
  fall: number;
}

/** Where strands grow: around the top of the head, fanning out and falling to each side. */
export function anchors(): Anchor[] {
  return Array.from({ length: STRANDS }, (_, i) => {
    const t = i / (STRANDS - 1);
    const a = -Math.PI * (0.95 - 0.9 * t);
    const x = Math.cos(a) * 118;
    const y = -122 + Math.sin(a) * 122;
    const side = x < 0 || (x === 0 && i % 2) ? -1 : 1;
    // Fall down and slightly outward; on the left, turn the long way round (through "left").
    const fall = side > 0 ? Math.PI * 0.42 : Math.PI * 0.58 - Math.PI * 2;
    return { x, y, out: a, fall };
  });
}

/** The points along one strand, in body units. */
export function strandPoints(an: Anchor, s: Strand): Pt[] {
  const n = Math.max(1, Math.ceil(s.length / SEG));
  const step = s.length / n;
  const pts = [{ x: an.x, y: an.y }];
  let x = an.x;
  let y = an.y;
  for (let k = 1; k <= n; k++) {
    const along = k * step;
    // Short tufts stand up; longer hair bends over and falls. Strands on top rise higher first,
    // so they fall to the sides instead of over the eyes.
    const top = 1 - Math.abs(Math.cos(an.out));
    const bend = Math.min(1, along / (100 + 110 * top));
    const angle = an.out + (an.fall - an.out) * bend;
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    const wave = s.curl * 15 * Math.sin(k * 1.7);
    pts.push({ x: x - Math.sin(angle) * wave, y: y + Math.cos(angle) * wave });
  }
  return pts;
}

/**
 * The finger is at `p` (body units) with `tool`: every strand within `REACH` of it is worked on, at the first of its points that the
 * finger reaches. A snip cuts the strand back to that point (only when it is not the tip), and the strands it cut by more than 10 are
 * returned with their old tips, for the falling fluff.
 */
export function touchStrands(tool: Tool, strands: Strand[], an: Anchor[], p: Pt): { touched: number; snipped: { tip: Pt; color: ColorName }[] } {
  let touched = 0;
  const snipped: { tip: Pt; color: ColorName }[] = [];
  strands.forEach((s, i) => {
    const pts = strandPoints(an[i], s);
    const k = pts.findIndex((q) => Math.hypot(q.x - p.x, q.y - p.y) < REACH);
    if (k < 0) return;
    touched++;
    switch (tool) {
      case 'grow':
        s.length = Math.min(MAX_LENGTH, s.length + 9);
        break;
      case 'cut':
        if (k < pts.length - 1) {
          const before = s.length;
          s.length = Math.max(MIN_LENGTH, k * SEG);
          if (before - s.length > 10) snipped.push({ tip: pts[pts.length - 1], color: s.color });
        }
        break;
      case 'comb':
        s.curl = Math.max(0, s.curl - 0.06);
        break;
      case 'curl':
        s.curl = Math.min(1, s.curl + 0.06);
        break;
      default:
        s.color = tool;
    }
  });
  return { touched, snipped };
}

// ----- the demonstration -----

/** Free play with every tool: each is tried once, in this order, and then the mirror. */
export const TOUR: Tool[] = ['grow', 'cut', 'curl', 'comb', 'pink'];
/** The first level has one tool: it is used this many times before the mirror. */
export const PLAY_STROKES = 2;

export interface SalonState {
  mode: SalonMode;
  /** The style asked for, or null in free play. */
  look: Look | null;
  strands: Strand[];
  /** The tool picked now, and how many strokes the demonstration has made in free play. */
  tool: Tool;
  strokes: number;
  /** The mirror button is showing. */
  mirror: boolean;
}

export type SalonMove = { do: 'tool'; tool: Tool } | { do: 'stroke' } | { do: 'mirror' };

/**
 * What a capable child does next. Free play: use the tools in turn, a stroke each, then the mirror when it shows. A request: pick the
 * tool for what still needs doing and stroke until it is done; where the mirror checks (every level but one request at a time) look in it
 * only once nothing is left to do, which is the only way to a miss there.
 */
export function salonMove(s: SalonState): SalonMove | null {
  if (!s.look) {
    const want = s.mode === 'play' ? 'grow' : TOUR[Math.min(s.strokes, TOUR.length - 1)];
    const done = s.strokes >= (s.mode === 'play' ? PLAY_STROKES : TOUR.length);
    if (done) return s.mirror ? { do: 'mirror' } : { do: 'stroke' };
    return s.tool === want ? { do: 'stroke' } : { do: 'tool', tool: want };
  }
  const fix = needs(s.look, s.strands);
  if (!fix) return s.mode === 'ask' ? null : { do: 'mirror' };
  const tool = toolFor(fix);
  return s.tool === tool ? { do: 'stroke' } : { do: 'tool', tool };
}

/**
 * One sweep of the finger, in body units, along the roots of the fur from beyond one end to beyond the other (each strand is in reach
 * for about 76 units of it); `back` sweeps the other way, so the hand does not travel back between strokes. A snip goes farther out,
 * 190 units from the middle of the head (about 64 from the roots), where the first point of each strand in reach is the third or
 * fourth, so the fur is cut back to about 30 and not shaved; its path has more corners, so it keeps that distance.
 */
export function strokePath(tool: Tool, back = false): Pt[] {
  const cut = tool === 'cut';
  const r = cut ? 190 : 120;
  const n = cut ? 7 : 4;
  const turns = Array.from({ length: n }, (_, i) => -1.12 + (1.24 * i) / (n - 1));
  const path = turns.map((q) => ({ x: Math.cos(Math.PI * q) * r, y: -122 + Math.sin(Math.PI * q) * r }));
  return back ? path.reverse() : path;
}
