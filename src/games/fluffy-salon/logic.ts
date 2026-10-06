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
