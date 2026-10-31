/**
 * Forecast Detective: a harbour town between Hill Isle (west) and Lighthouse Isle (east). Four covered clues (the wind
 * vane, a postcard from each island, the thermometer) and a disclosed pretend rule: tomorrow's sky comes on the wind
 * from the island it blows from, and freezing turns rain to snow. Clues only rule weathers out; nothing here is a
 * likelihood. The model, the checks, the hints, the seeded rounds and the layout are here; drawing and timing are in index.ts.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Sky = 'sun' | 'cloud' | 'rain';
export const SKIES: readonly Sky[] = ['sun', 'cloud', 'rain'];
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy';
export const WEATHERS: readonly Weather[] = ['sunny', 'cloudy', 'rainy', 'snowy'];
export type Side = 'west' | 'east';
export type Temp = 'freezing' | 'warm';
export type ClueId = 'wind' | 'west' | 'east' | 'temp';
/** The noticeboard's order, left to right. */
export const CLUES: readonly ClueId[] = ['wind', 'west', 'east', 'temp'];
export type Answer = Weather | 'cant-tell';

export interface World { wind: Side; west: Sky; east: Sky; temp: Temp }
/** A round's truth; `missing` (level 2 only) is the one clue that never arrived. */
export interface Case extends World { missing?: ClueId }

/** All 36 worlds: wind × west sky × east sky × temperature. */
export const WORLDS: readonly World[] = (['west', 'east'] as const).flatMap((wind) =>
  SKIES.flatMap((west) => SKIES.flatMap((east) => (['freezing', 'warm'] as const).map((temp): World => ({ wind, west, east, temp })))));

const other = (s: Side): Side => (s === 'west' ? 'east' : 'west');

/** The valley's two rules: the upwind island's sky arrives, and freezing turns rain to snow. */
export function tomorrow(w: World): Weather {
  const sky = w[w.wind];
  if (sky === 'rain') return w.temp === 'freezing' ? 'snowy' : 'rainy';
  return sky === 'sun' ? 'sunny' : 'cloudy';
}

function agrees(w: World, c: World, open: readonly ClueId[]): boolean {
  return open.every((k) => w[k] === c[k]);
}

/** Every weather some world agreeing with the open clues would bring. A set only: never a count or a chance. */
export function possible(c: World, open: readonly ClueId[]): Set<Weather> {
  const out = new Set<Weather>();
  for (const w of WORLDS) if (agrees(w, c, open)) out.add(tomorrow(w));
  return out;
}

export function decided(c: World, open: readonly ClueId[]): boolean { return possible(c, open).size === 1; }
export function available(c: Case): ClueId[] { return CLUES.filter((k) => k !== c.missing); }
export function canTell(c: Case): boolean { return decided(c, available(c)); }
/** What a right Check names for this case once every available clue is open. */
export function answerOf(c: Case): Answer { return canTell(c) ? tomorrow(c) : 'cant-tell'; }

/** The teaching order: the wind, the island it blows from, the thermometer, the other island. */
export function clueOrder(c: World): ClueId[] { return ['wind', c.wind, 'temp', other(c.wind)]; }

export type Verdict =
  | { kind: 'right' }
  | { kind: 'not-yet' }
  | { kind: 'ruled-out'; by: ClueId }
  | { kind: 'overclaim' };

/** The first open clue, in teaching order, whose addition removed the weather. */
export function ruledOutBy(c: World, open: readonly ClueId[], weather: Weather): ClueId | null {
  const seen: ClueId[] = [];
  for (const k of clueOrder(c)) {
    if (!open.includes(k)) continue;
    seen.push(k);
    if (!possible(c, seen).has(weather)) return k;
  }
  return null;
}

export function check(c: Case, open: readonly ClueId[], answer: Answer): Verdict {
  const left = possible(c, open);
  const allOpen = available(c).every((k) => open.includes(k));
  if (answer === 'cant-tell') {
    if (left.size === 1) return { kind: 'overclaim' };
    return allOpen ? { kind: 'right' } : { kind: 'not-yet' };
  }
  if (!left.has(answer)) return { kind: 'ruled-out', by: ruledOutBy(c, open, answer)! };
  if (left.size === 1) return { kind: 'right' };
  return allOpen ? { kind: 'overclaim' } : { kind: 'not-yet' };
}

/** A miss is what the shell counts: claiming what the open clues rule out, or more than they hold. */
export function isMiss(v: Verdict): boolean { return v.kind === 'ruled-out' || v.kind === 'overclaim'; }

/**
 * The hint: the closed available clue that leaves the fewest weathers, ties (including "none shrinks it yet") in
 * teaching order, so the wind is offered before its postcard makes it count. Null once decided or nothing is closed.
 */
export function usefulClue(c: Case, open: readonly ClueId[]): ClueId | null {
  if (decided(c, open)) return null;
  let best: ClueId | null = null, bestSize = Infinity;
  for (const k of clueOrder(c)) {
    if (k === c.missing || open.includes(k)) continue;
    const size = possible(c, [...open, k]).size;
    if (size < bestSize) { best = k; bestSize = size; }
  }
  return best;
}

// ---- levels and rounds ----

export interface Plan { level: 1 | 2; name: string }
export const PLANS: readonly Plan[] = [
  { level: 1, name: 'Which way is the wind? Open clues, pick the one weather they leave' },
  { level: 2, name: "A postcard didn't come: one weather, or Can't tell yet" },
];
export const LEVELS: BandLevels = { school: { min: 1, max: 2 } };
export function planFor(level: number): Plan { return PLANS[Math.max(1, Math.min(2, Math.round(level))) - 1]; }

export const AUTHORED: Record<1 | 2, Case> = {
  1: { wind: 'west', west: 'rain', east: 'sun', temp: 'warm' },
  2: { wind: 'east', west: 'sun', east: 'cloud', temp: 'warm', missing: 'east' },
};

/** Rain upwind: the thermometer matters. */
export const rainUpwind = (w: World): boolean => w[w.wind] === 'rain';
/** Level 1 draws from worlds whose postcards differ, so the wind always matters. */
export const LEVEL1_WORLDS: readonly World[] = WORLDS.filter((w) => w.west !== w.east);

/** What the next round needs to know about the ones before it (kept by index.ts across rounds). */
export interface History { sinceRain: number; lastCanTell: boolean | null }
export const freshHistory = (): History => ({ sinceRain: 0, lastCanTell: null });

/** One round's case, and the history after it. The authored case leads; a demo always gets it. */
export function makeCase(level: number, rng: Rng, authored: boolean, h: History): { c: Case; next: History } {
  const lv = planFor(level).level;
  let c: Case;
  if (authored) c = { ...AUTHORED[lv] };
  else if (lv === 1) {
    // At least one round in three has rain upwind: after two without, the third must.
    const pool = h.sinceRain >= 2 ? LEVEL1_WORLDS.filter(rainUpwind) : LEVEL1_WORLDS;
    c = { ...rng.pick(pool) };
  } else {
    // Alternate between rounds the clues can decide and rounds they cannot.
    const want = h.lastCanTell === null ? null : !h.lastCanTell;
    for (;;) {
      const t: Case = { ...rng.pick(WORLDS), missing: rng.pick(CLUES) };
      if (want === null || canTell(t) === want) { c = t; break; }
    }
  }
  const next: History = lv === 1
    ? { sinceRain: rainUpwind(c) ? 0 : h.sinceRain + 1, lastCanTell: h.lastCanTell }
    : { sinceRain: h.sinceRain, lastCanTell: canTell(c) };
  return { c, next };
}

/** The answer cards on the board: Can't tell yet only at level 2. */
export function answersFor(level: number): Answer[] {
  return planFor(level).level === 2 ? [...WEATHERS, 'cant-tell'] : [...WEATHERS];
}

// ---- layout ----

export interface Box { x: number; y: number; w: number; h: number }
export interface Layout {
  portrait: boolean;
  rule: Box;
  flaps: Record<ClueId, Box>;
  cards: Box[];
  checkBtn: Box;
  /** The scene between the noticeboard and the cards. */
  scene: Box;
  hill: { x: number; y: number };
  lighthouse: { x: number; y: number };
  town: { x: number; y: number };
}

export const FLAP = 150, RULE = 110, CARD_W = 150, CARD_H = 170, CHECK = 130;
/** The shell's corners: Home and help down the top-left, the pet bottom-left. */
const LEFT_COLUMN = 125, PET_CORNER = 175;
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function forecastLayout(view: { w: number; h: number }, level: number): Layout | null {
  const { w, h } = view;
  const portrait = h > w;
  const top = 18, gap = 16;
  // The noticeboard: the rule card, then the four flaps, centred in the room right of the Home column.
  const boardW = RULE + gap + 4 * FLAP + 3 * gap;
  const boardLeft = Math.max(LEFT_COLUMN + 10, (LEFT_COLUMN + 10 + w - 20) / 2 - boardW / 2);
  if (boardLeft + boardW > w - 20) return null;
  const rule = box(boardLeft + RULE / 2, top + FLAP / 2, RULE, RULE);
  const flaps = {} as Record<ClueId, Box>;
  CLUES.forEach((k, i) => { flaps[k] = box(boardLeft + RULE + gap + FLAP / 2 + i * (FLAP + gap), top + FLAP / 2, FLAP, FLAP); });
  // The cards and Check along the bottom, right of the pet's corner; two rows when one cannot hold them.
  const n = answersFor(level).length;
  const rowLeft = PET_CORNER + 10, rowRight = w - 20, cg = 14;
  const oneRow = n * CARD_W + (n - 1) * cg + gap + CHECK;
  const rows = oneRow <= rowRight - rowLeft ? 1 : 2;
  const perRow = rows === 1 ? n : Math.ceil(n / 2);
  const cards: Box[] = [];
  let checkBtn = box(0, 0, CHECK, CHECK);
  for (let r = 0; r < rows; r++) {
    const count = r === 0 ? Math.min(perRow, n) : n - perRow;
    const last = r === rows - 1;
    const rowW = count * CARD_W + (count - 1) * cg + (last ? gap + CHECK : 0);
    if (rowW > rowRight - rowLeft) return null;
    const x0 = (rowLeft + rowRight) / 2 - rowW / 2;
    const y = h - 20 - CARD_H / 2 - (rows - 1 - r) * (CARD_H + 12);
    for (let i = 0; i < count; i++) cards.push(box(x0 + CARD_W / 2 + i * (CARD_W + cg), y, CARD_W, CARD_H));
    if (last) checkBtn = box(x0 + rowW - CHECK / 2, y, CHECK, CHECK);
  }
  const boardBottom = top + FLAP;
  const cardsTop = Math.min(...cards.map((c) => c.y - c.h / 2));
  if (cardsTop - boardBottom < 160) return null;
  const scene = box(w / 2, (boardBottom + 10 + cardsTop - 10) / 2, w, cardsTop - boardBottom - 20);
  const sy = scene.y + scene.h * 0.08;
  return {
    portrait, rule, flaps, cards, checkBtn, scene,
    hill: { x: 120, y: sy },
    lighthouse: { x: w - 120, y: sy },
    town: { x: w / 2, y: scene.y + scene.h * 0.18 },
  };
}

/** The sticker's weather, seeded. */
export function stickerWeather(seed: number): Weather { return WEATHERS[Math.abs(seed) % 4]; }
