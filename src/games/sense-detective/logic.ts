import type { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';

/**
 * Sense Detective: a parcel arrives at the toy museum and she chooses how to find out what is inside. A look shows the
 * toy's outline from above, a listen plays its sound with a matching picture. Check only finishes when the clues she has
 * gathered leave exactly one toy, so a lucky guess never ends a round. The three toys are invented island instruments,
 * not a claim about bells or drums in general.
 */
export type ToyId = 'bell' | 'rattle' | 'drum';
export type Channel = 'view' | 'sound';
export type ViewValue = 'round' | 'handled';
export type SoundValue = 'ring' | 'shake' | 'beat';

export interface Toy { id: ToyId; view: ViewValue; sound: SoundValue }

export const TOYS: Record<ToyId, Toy> = {
  bell: { id: 'bell', view: 'round', sound: 'ring' },
  rattle: { id: 'rattle', view: 'handled', sound: 'shake' },
  drum: { id: 'drum', view: 'round', sound: 'beat' },
};
export const TOY_IDS: ToyId[] = ['bell', 'rattle', 'drum'];

/** What a toy is called aloud. */
export const TOY_NAMES: Record<ToyId, string> = { bell: 'bell', rattle: 'rattle', drum: 'drum' };

export interface Observation { channel: Channel; value: ViewValue | SoundValue }

export function observe(toy: ToyId, channel: Channel): Observation {
  return { channel, value: TOYS[toy][channel] };
}

/** The toys that agree with everything revealed so far. */
export function possible(cards: readonly ToyId[], record: readonly Observation[]): ToyId[] {
  return cards.filter((c) => record.every((o) => TOYS[c][o.channel] === o.value));
}

/**
 * Levels 1-2 ask for the one toy; from level 3 she selects every toy the clues still allow (`set`), over `parcels`
 * parcels, and level 4 then listens and narrows that set.
 */
export interface Plan { name: string; shelf: ToyId[]; channels: Channel[]; set: boolean; parcels: number }

const PLANS: Record<number, Plan> = {
  1: { name: 'Peek inside', shelf: ['bell', 'rattle'], channels: ['view'], set: false, parcels: 1 },
  2: { name: 'Look or listen?', shelf: ['bell', 'drum'], channels: ['view', 'sound'], set: false, parcels: 1 },
  3: { name: 'Which could it be?', shelf: [...TOY_IDS], channels: ['view'], set: true, parcels: 2 },
  4: { name: 'Narrow it down', shelf: [...TOY_IDS], channels: ['view', 'sound'], set: true, parcels: 1 },
};
export const MAX_LEVEL = 4;

export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(MAX_LEVEL, level))];
}

/** `hidden` is the first parcel's toy; `parcels` holds every parcel in order (one at levels 1, 2 and 4). */
export interface Round { level: number; shelf: ToyId[]; hidden: ToyId; parcels: ToyId[]; channels: Channel[] }

/** Each set level's authored first round of a session: the shelf, then the parcels in order. */
const AUTHORED: Record<number, { shelf: ToyId[]; parcels: ToyId[] }> = {
  3: { shelf: ['rattle', 'bell', 'drum'], parcels: ['drum', 'rattle'] },
  4: { shelf: ['bell', 'rattle', 'drum'], parcels: ['bell'] },
};

export function makeRound(level: number, rng: Rng, first = false): Round {
  const lv = Math.max(1, Math.min(MAX_LEVEL, level));
  const plan = planFor(lv);
  const channels = [...plan.channels];
  if (!plan.set) {
    const shelf = rng.shuffle([...plan.shelf]);
    const hidden = plan.shelf[rng.int(0, plan.shelf.length - 1)];
    return { level: lv, shelf, hidden, parcels: [hidden], channels };
  }
  if (first && AUTHORED[lv]) {
    const a = AUTHORED[lv];
    return { level: lv, shelf: [...a.shelf], hidden: a.parcels[0], parcels: [...a.parcels], channels };
  }
  const shelf = rng.shuffle([...TOY_IDS]);
  // Two different toys hold at least one round toy, so a parcel is always ambiguous; a look always leaves two at level 4.
  const parcels = plan.parcels === 2 ? rng.shuffle([...TOY_IDS]).slice(0, 2) : [rng.pick<ToyId>(['bell', 'drum'])];
  return { level: lv, shelf, hidden: parcels[0], parcels, channels };
}

export type Verdict =
  | { kind: 'found' }
  | { kind: 'miss'; ruledOut: Observation }
  | { kind: 'notyet'; other: ToyId | null };

/** Judge one selected card against what has been revealed (never against the hidden toy itself). */
export function check(shelf: readonly ToyId[], record: readonly Observation[], card: ToyId): Verdict {
  const left = possible(shelf, record);
  if (!left.includes(card)) {
    const ruledOut = record.find((o) => TOYS[card][o.channel] !== o.value)!;
    return { kind: 'miss', ruledOut };
  }
  if (left.length === 1 && record.length > 0) return { kind: 'found' };
  return { kind: 'notyet', other: left.find((c) => c !== card) ?? null };
}

export type SetVerdict =
  | { kind: 'empty' }
  | { kind: 'look-first' }
  | { kind: 'miss'; ruledOut: ToyId[]; first: ToyId; obs: Observation }
  | { kind: 'one-more'; missing: ToyId }
  | { kind: 'so-far'; left: ToyId[] }
  | { kind: 'right'; left: ToyId[] };

/**
 * Levels 3-4: judge the selected set against what the clues allow (never against the parcel). `narrowing` is true while a
 * listen is still to come (level 4 before its listen), so the look's exact set is only "so far".
 */
export function checkSet(shelf: readonly ToyId[], record: readonly Observation[], selected: readonly ToyId[], narrowing: boolean): SetVerdict {
  if (selected.length === 0) return { kind: 'empty' };
  if (record.length === 0) return { kind: 'look-first' };
  const left = possible(shelf, record);
  const ruledOut = shelf.filter((t) => selected.includes(t) && !left.includes(t));
  if (ruledOut.length > 0) {
    const first = ruledOut[0];
    return { kind: 'miss', ruledOut, first, obs: record.find((o) => TOYS[first][o.channel] !== o.value)! };
  }
  const missing = left.find((t) => !selected.includes(t));
  if (missing) return { kind: 'one-more', missing };
  return narrowing ? { kind: 'so-far', left } : { kind: 'right', left };
}

/** The useful edit a hint glows: take out a ruled-out toy, else put in a missing one, else press Check. */
export type Edit = { remove: ToyId } | { add: ToyId } | { check: true };
export function hintEdit(shelf: readonly ToyId[], record: readonly Observation[], selected: readonly ToyId[]): Edit {
  const left = possible(shelf, record);
  const out = shelf.find((t) => selected.includes(t) && !left.includes(t));
  if (out) return { remove: out };
  const missing = left.find((t) => !selected.includes(t));
  if (missing) return { add: missing };
  return { check: true };
}

/** The key an unchanged resubmit repeats: the parcel, the stage, the sorted selection and how much has been revealed. */
export function setKey(parcel: number, stage: number, selected: readonly ToyId[], record: readonly Observation[]): string {
  return `${parcel}|${stage}|${[...selected].sort().join(',')}|${record.length}`;
}

/**
 * Misses and hints for a round of parcels. Help counts per parcel: two misses on one parcel glow the useful edit and
 * count one hint for that parcel, and Show a hint on the same parcel adds nothing more.
 */
export class Tally {
  misses = 0;
  hints = 0;
  parcelMisses = 0;
  hinted = false;
  private lastKey: string | null = null;
  /** A wrong Check; returns true when the glow should come on. An unchanged resubmit counts nothing. */
  miss(key: string): boolean {
    if (countsAsMiss(this.lastKey, key)) { this.misses++; this.parcelMisses++; }
    this.lastKey = key;
    if (this.parcelMisses >= GLOW_AFTER) { this.hint(); return true; }
    return false;
  }
  hint() {
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }
  nextParcel() {
    this.parcelMisses = 0;
    this.hinted = false;
    this.lastKey = null;
  }
}

/** The bot at levels 3-4: look first, listen once level 4 opens it, then make the useful edit until Check. */
export type SetMove = { investigate: Channel } | { toggle: ToyId } | { check: true };
export function setTouch(round: Round, record: readonly Observation[], selected: readonly ToyId[], listenOpen: boolean): SetMove {
  if (!record.some((o) => o.channel === 'view')) return { investigate: 'view' };
  if (listenOpen && !record.some((o) => o.channel === 'sound')) return { investigate: 'sound' };
  const e = hintEdit(round.shelf, record, selected);
  if ('remove' in e) return { toggle: e.remove };
  if ('add' in e) return { toggle: e.add };
  return { check: true };
}

/** A check with nothing changed since the last one repeats its reason and counts nothing more. */
export function countsAsMiss(lastKey: string | null, key: string): boolean {
  return lastKey !== key;
}

/** The investigation that settles it: a channel (not yet run) that leaves one toy, or null when one is already enough. */
export function deciding(round: Round, record: readonly Observation[]): Channel | null {
  if (possible(round.shelf, record).length === 1 && record.length > 0) return null;
  for (const channel of round.channels) {
    if (possible(round.shelf, [...record, observe(round.hidden, channel)]).length === 1) return channel;
  }
  return null;
}

/** What the bot does next (and the hint's route): look, then listen if the look is not enough, then pick, then check. */
export type Move = { investigate: Channel } | { select: ToyId } | { check: true };
export function senseTouch(round: Round, record: readonly Observation[], selected: ToyId | null): Move {
  const left = possible(round.shelf, record);
  const next = deciding(round, record);
  if (next && !record.some((o) => o.channel === next)) {
    // A look always comes first, as a child would, even when it cannot decide.
    if (round.channels.includes('view') && !record.some((o) => o.channel === 'view')) return { investigate: 'view' };
    return { investigate: next };
  }
  if (left.length > 1 && round.channels.some((c) => !record.some((o) => o.channel === c))) {
    return { investigate: round.channels.find((c) => !record.some((o) => o.channel === c))! };
  }
  if (selected !== left[0]) return { select: left[0] };
  return { check: true };
}

/** The words for one observation, spoken and used in a reason. */
export const SEEN: Record<ViewValue, string> = { round: 'a plain circle', handled: 'a handle' };
export const HEARD: Record<SoundValue, string> = { ring: 'a ring', shake: 'a rattly shake', beat: 'a boom' };
export const ITS: Record<SoundValue, string> = { ring: 'rings', shake: 'shakes', beat: 'goes boom' };

export const GLOW_AFTER = 2;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Exhibit {
  parcel: Rect;
  look: Rect;
  listen: Rect | null;
  strip: Rect[];
  shelf: Rect[];
  check: Rect;
}

const PET_CORNER = { w: 160, h: 170 };
export const TOY_W = 200;
export const TOY_H = 220;
export const CHECK = 170;
export const EVIDENCE = 140;
export const BUTTON = 150;

/** Every rectangle of the museum counter. A test asserts sizes, clearances and no overlap at four views. */
export function exhibitLayout(view: View, cards: number, channels: number): Exhibit {
  const { w, h } = view;
  const landscape = w >= h;
  const top = 120;
  const parcelW = 240;
  const gap = 30;
  const rowW = BUTTON + gap + parcelW + (channels > 1 ? gap + BUTTON : 0);
  const left = (w - rowW) / 2;
  const look: Rect = { x: left, y: top + 25, w: BUTTON, h: BUTTON };
  const parcel: Rect = { x: left + BUTTON + gap, y: top, w: parcelW, h: 200 };
  const listen: Rect | null = channels > 1 ? { x: parcel.x + parcelW + gap, y: top + 25, w: BUTTON, h: BUTTON } : null;
  const stripY = top + 200 + 30;
  const stripX = spread(channels, 0, w, EVIDENCE + 24);
  const strip: Rect[] = stripX.map((cx) => ({ x: cx - EVIDENCE / 2, y: stripY, w: EVIDENCE, h: EVIDENCE }));
  const shelfY = landscape ? h - 20 - TOY_H : stripY + EVIDENCE + 40;
  const checkX = w - 20 - CHECK;
  const lo = landscape ? PET_CORNER.w + 10 : 20;
  const hi = landscape ? checkX - 20 : w - 20;
  const shelf: Rect[] = spread(cards, lo, hi, TOY_W + 30).map((cx) => ({ x: cx - TOY_W / 2, y: shelfY, w: TOY_W, h: TOY_H }));
  const check: Rect = landscape
    ? { x: checkX, y: shelfY + (TOY_H - CHECK) / 2, w: CHECK, h: CHECK }
    : { x: checkX, y: shelfY + TOY_H + 20, w: CHECK, h: CHECK };
  return { parcel, look, listen, strip, shelf, check };
}
