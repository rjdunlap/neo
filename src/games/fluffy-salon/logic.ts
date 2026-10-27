import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';

/**
 * Fluffy Salon, after Toca Hair Salon: the pet sits in the chair with a head of fluffy fur.
 * Grow it, snip it, comb it straight, curl it and color it. Free play at first, then requests
 * ("long and pink") checked in the mirror.
 */
export type SalonMode = 'play' | 'tools' | 'ask' | 'two' | 'match' | 'pat' | 'snip' | 'color' | 'customers' | 'compare';

/** Modes with no request: she styles freely and the mirror ends the round. */
export const isFree = (mode: SalonMode) => mode === 'play' || mode === 'tools' || mode === 'pat' || mode === 'snip';
/** Request modes with no mirror: each request finishes by itself as soon as the fur is right. */
export const selfChecks = (mode: SalonMode) => mode === 'ask' || mode === 'color';
/** Request modes where a seeded friend may sit in the chair instead of her pet (levels 3–5). */
export const hasCustomers = (mode: SalonMode) => mode === 'ask' || mode === 'two' || mode === 'match';

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
  { mode: 'pat', requests: 0, name: 'Pat the fluff: no buttons, any touch grows the fur' },
  { mode: 'snip', requests: 0, name: 'Snip snip: grow the fur, then snip it' },
  { mode: 'color', requests: 2, name: 'Pink, please: the five bottles and one color at a time' },
  { mode: 'customers', requests: 2, name: 'Two customers: match each visible two-part request, in either order' },
  { mode: 'compare', requests: 1, name: "Longer than Pip’s: grow or snip fur to compare two lengths" },
];

/** The buttons a mode shows: tools along the bottom, then the colour bottles. */
export function toolsFor(mode: SalonMode): Tool[] {
  const tools: Tool[] = mode === 'pat' || mode === 'color' ? [] : mode === 'play' ? ['grow'] : mode === 'snip' ? ['grow', 'cut'] : ['grow', 'cut', 'comb', 'curl'];
  return mode === 'pat' || mode === 'snip' ? tools : [...tools, ...HAIR_COLORS];
}

/** Pink, please: the bottles are the only buttons, drawn big along the bottom. */
export const BOTTLE_RADIUS = 54;

/**
 * Pink, please: a bottle that is not the asked colour still paints, and the first stroke with it names what it is ("That's blue! I want
 * pink"): no miss. Null for the asked colour or a tool that is not a bottle.
 */
export const wrongBottle = (look: Look, tool: Tool): ColorName | null => (look.color && HAIR_COLORS.includes(tool as ColorName) && tool !== look.color ? (tool as ColorName) : null);
/** Wrong bottles named before the asked one glows (one hint). */
export const WRONG_BOTTLES = 2;

// ----- who sits in the chair, and the room -----

/** The friends who may take the chair at levels 3–5; her pet sits there most often. */
export const CUSTOMERS: CritterName[] = ['cat', 'bunny', 'bear', 'dog', 'pig'];
/** How often a friend, rather than her pet, is in the chair at a level with customers. */
export const FRIEND_CHANCE = 0.45;
/** Spoken names, said as the request line's `{who}`. */
export const CUSTOMER_NAMES: Record<CritterName, string> = { pip: 'Pip', cow: 'Cow', duck: 'Duck', pig: 'Pig', cat: 'Cat', bear: 'Bear', dog: 'Dog', bunny: 'Bunny' };

/** Who is in the chair this round: null is her own pet. */
export function pickCustomer(mode: SalonMode, rng: Rng): CritterName | null {
  if (!hasCustomers(mode)) return null;
  return rng.next() < FRIEND_CHANCE ? rng.pick(CUSTOMERS) : null;
}

export interface Room {
  /** The wall's gradient, top and bottom. */
  wall: [ColorName, ColorName];
  /** The cape's stripes: never the customer's own colour, so the cape shows. */
  stripe: ColorName;
  /** The floor's check. */
  floor: ColorName;
}

const WALLS: ColorName[] = ['pink', 'purple', 'blue', 'teal', 'yellow', 'green'];
const STRIPES: ColorName[] = ['purple', 'teal', 'blue', 'pink', 'green', 'orange'];
const FLOORS: ColorName[] = ['brown', 'orange', 'yellow', 'teal', 'purple'];

/** A seeded salon: wall pair, cape stripe and floor check (art only). */
export function makeRoom(rng: Rng, customer: ColorName): Room {
  const top = rng.pick(WALLS);
  const bottom = rng.pick(WALLS.filter((c) => c !== top));
  const stripe = rng.pick(STRIPES.filter((c) => c !== customer));
  return { wall: [top, bottom], stripe, floor: rng.pick(FLOORS) };
}

/** Pat the fluff: the fur starts as short fuzz; at this average length the pet does the floof shake and the big mirror appears. */
export const PAT_START = { length: 20, curl: 0.3 };
export const FLOOF = 120;
/** Seconds after the floof with no mirror tap before the pet looks in the mirror by itself (no miss, no hint). */
export const PAT_QUIET = 20;
export const PAT_MIRROR = 70;
/** Snip snip: the fur starts long and curly, so the first snip sends fluff tumbling. */
export const SNIP_START = { length: 150, curl: 0.8 };
export const SNIP_TOOL_RADIUS = 54;
/** Snip snip's tools, each used once by the demonstration. */
export const SNIP_TOUR: Tool[] = ['grow', 'cut'];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const HAIR_COLORS: ColorName[] = ['pink', 'blue', 'purple', 'yellow', 'green'];
export const MAX_LENGTH = 220;
export const MIN_LENGTH = 8;
const SHORT = 50;
const LONG = 145;
const CURLY = 0.6;
const STRAIGHT = 0.2;
const MOSTLY = 0.8;
export const COMPARE_MARGIN = 25;

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
  /** Level 10: compare average strand length against a fixed friend's, with a clear margin. */
  comparison?: { direction: 'longer' | 'shorter'; length: number };
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
  if (look.comparison) {
    const { direction, length } = look.comparison;
    if (direction === 'longer' ? s.length < length + COMPARE_MARGIN : s.length > length - COMPARE_MARGIN) return direction;
  }
  if (look.length === 'long' && s.length < LONG) return 'longer';
  if (look.length === 'short' && s.length > SHORT) return 'shorter';
  if (look.color && s.share(look.color) < MOSTLY) return look.color;
  if (look.curl === 'curly' && s.curl < CURLY) return 'curlier';
  if (look.curl === 'straight' && s.curl > STRAIGHT) return 'straighter';
  return null;
}

/** Seconds without progress (no stroke with the tool that helps) before a one-at-a-time request lights the tool that would help. */
export const QUIET_HINT = 15;

/** Whether this tool works on what the look still needs, so a touch with it counts as progress for the quiet-time hint. */
export function helps(look: Look, strands: Strand[], tool: Tool): boolean {
  const fix = needs(look, strands);
  return fix !== null && toolFor(fix) === tool;
}

/**
 * The line for a mirror check that is not done yet: when the asked colour is already on at least half the strands, "a little more pink"
 * (with the strands still the old colour glowing) rather than a line that sounds as if the colour were wrong.
 */
export function moreLine(look: Look, strands: Strand[]): 'salon.more' | 'salon.more-color' {
  const fix = needs(look, strands);
  return fix && look.color === fix && stats(strands).share(fix) >= 0.5 ? 'salon.more-color' : 'salon.more';
}

/** The strands not yet the asked colour, which glow once she has been told about them. */
export const oldStrands = (strands: Strand[], color: ColorName): number[] => strands.flatMap((s, i) => (s.color === color ? [] : [i]));

/** Which tool fixes what. */
export type Tool = 'grow' | 'cut' | 'comb' | 'curl' | ColorName;
export const toolFor = (fix: Fix): Tool => (fix === 'longer' ? 'grow' : fix === 'shorter' ? 'cut' : fix === 'curlier' ? 'curl' : fix === 'straighter' ? 'comb' : fix);

/** "long", "short and blue", "long, curly and pink". */
export function describe(look: Look): string {
  if (look.comparison) return `${look.comparison.direction} than Pip’s`;
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
    else if (mode === 'color') look = { color };
    else if (mode === 'two' || mode === 'customers') look = rng.pick<Look>([{ length, color }, { length, curl }, { curl, color }]);
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
    const look: Look = plan.mode === 'compare' ? { comparison: { direction: rng.pick(['longer', 'shorter'] as const), length: rng.int(60, 150) } } : pickLook(plan.mode, rng, out.map((r) => describe(r.look)));
    const length = look.comparison ? look.comparison.length : look.length === 'long' ? 70 : look.length === 'short' ? 130 : 95;
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

/** Free play's start looks, one seeded per round, so it starts somewhere new. */
export const START_LOOKS = ['fuzz', 'mop', 'sleek', 'two-tone', 'mohawk'] as const;
export type StartLook = (typeof START_LOOKS)[number];

/** The strands a start look begins with: short fuzz, a wild curly mop, long straight hair, two colours already on, or a mohawk of long middle strands. */
export function startStrands(look: StartLook, color: ColorName, other: ColorName): Strand[] {
  return Array.from({ length: STRANDS }, (_, i) => {
    switch (look) {
      case 'fuzz':
        return { length: 25, curl: 0.3, color };
      case 'mop':
        return { length: 110, curl: 0.9, color };
      case 'sleek':
        return { length: 160, curl: 0, color };
      case 'two-tone':
        return { length: 80, curl: 0.3, color: i < STRANDS / 2 ? color : other };
      default:
        return { length: i >= 9 && i <= 16 ? 150 : 25, curl: 0.2, color };
    }
  });
}

/** A seeded start for free play at levels 1–2. */
export function startLook(rng: Rng): { look: StartLook; strands: Strand[] } {
  const look = rng.pick(START_LOOKS);
  const color = rng.pick(HAIR_COLORS);
  const other = rng.pick(HAIR_COLORS.filter((c) => c !== color));
  return { look, strands: startStrands(look, color, other) };
}

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

/**
 * The head the fur grows on, in the companion's units: a circle whose top is the top of the pinned head and body, as wide as it is
 * (never taller than it), centred over it. The strands, strokes and reach stay in the old pip's units, where the scalp is `PIP_SCALP`,
 * and `furFit` maps them onto this one, so a small side-on head gets a smaller wig and the bot's sweeps still cross every root.
 */
export interface Scalp {
  x: number;
  y: number;
  r: number;
}

export const PIP_SCALP: Scalp = { x: 0, y: -122, r: 120 };

export function scalpFor(box: { x: number; y: number; width: number; height: number }): Scalp {
  const r = Math.min(box.width / 2, box.height * 0.9);
  return { x: box.x + box.width / 2, y: box.y + r, r };
}

/** Where the fur's pip-unit drawing sits on the companion, and its scale. */
export function furFit(scalp: Scalp): { x: number; y: number; scale: number } {
  const scale = scalp.r / PIP_SCALP.r;
  return { x: scalp.x - PIP_SCALP.x * scale, y: scalp.y - PIP_SCALP.y * scale, scale };
}

/** How much larger than the pip the salon draws a companion with a small head, so its fur is big enough to style (at most double). */
export const growFor = (scalp: Scalp) => Math.min(2, Math.max(1, PIP_SCALP.r / scalp.r));

/** The radius of free play's tap-the-face spot, in screen units. */
export const FACE_TAP = 68;

/**
 * Where free play's tap-the-face spot goes, in the companion's units, when it is drawn `scale` times: toward the eyes from the scalp's
 * centre, but never so far that its circle reaches the roots, so brushing the top of the head always styles.
 */
export function faceSpot(scalp: Scalp, eyes: Pt | undefined, scale: number): Pt {
  if (!eyes) return { x: scalp.x, y: scalp.y };
  const dx = eyes.x - scalp.x;
  const dy = eyes.y - scalp.y;
  const d = Math.hypot(dx, dy);
  const room = Math.max(0, scalp.r * 0.97 - (FACE_TAP + 12) / scale);
  const t = d > 0 ? Math.min(1, room / d) : 0;
  return { x: scalp.x + dx * t, y: scalp.y + dy * t };
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
  if (s.mode === 'pat') return s.mirror ? { do: 'mirror' } : { do: 'stroke' };
  if (!s.look) {
    const tour = s.mode === 'snip' ? SNIP_TOUR : TOUR;
    const want = s.mode === 'play' ? 'grow' : tour[Math.min(s.strokes, tour.length - 1)];
    const done = s.strokes >= (s.mode === 'play' ? PLAY_STROKES : tour.length);
    if (done) return s.mirror ? { do: 'mirror' } : { do: 'stroke' };
    return s.tool === want ? { do: 'stroke' } : { do: 'tool', tool: want };
  }
  const fix = needs(s.look, s.strands);
  if (!fix) return selfChecks(s.mode) ? null : { do: 'mirror' };
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
