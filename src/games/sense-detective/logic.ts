import type { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

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
 * Levels 1-2 ask for the one toy (`one`); levels 3-4 select every toy the clues still allow (`set`), over `parcels`
 * parcels, and level 4 then listens and narrows that set; level 5's quilted parcels ask whether a look can tell (`tell`).
 */
export type Mode = 'one' | 'set' | 'tell';
export interface Plan { name: string; shelf: ToyId[]; channels: Channel[]; mode: Mode; parcels: number }

const PLANS: Record<number, Plan> = {
  1: { name: 'Peek inside', shelf: ['bell', 'rattle'], channels: ['view'], mode: 'one', parcels: 1 },
  2: { name: 'Look or listen?', shelf: ['bell', 'drum'], channels: ['view', 'sound'], mode: 'one', parcels: 1 },
  3: { name: 'Which could it be?', shelf: [...TOY_IDS], channels: ['view'], mode: 'set', parcels: 2 },
  4: { name: 'Narrow it down', shelf: [...TOY_IDS], channels: ['view', 'sound'], mode: 'set', parcels: 1 },
  5: { name: 'Can we tell?', shelf: [...TOY_IDS], channels: ['view'], mode: 'tell', parcels: 2 },
};

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 5 },
};
export const MAX_LEVEL = 5;

export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(MAX_LEVEL, level))];
}

/** `hidden` is the first parcel's toy; `parcels` holds every parcel in order (one at levels 1, 2 and 4). */
export interface Round { level: number; shelf: ToyId[]; hidden: ToyId; parcels: ToyId[]; channels: Channel[] }

/** Each set level's authored first round of a session: the shelf, then the parcels in order. */
const AUTHORED: Record<number, { shelf: ToyId[]; parcels: ToyId[] }> = {
  3: { shelf: ['rattle', 'bell', 'drum'], parcels: ['drum', 'rattle'] },
  4: { shelf: ['bell', 'rattle', 'drum'], parcels: ['bell'] },
  5: { shelf: ['drum', 'bell', 'rattle'], parcels: ['drum', 'rattle'] },
};

export function makeRound(level: number, rng: Rng, first = false): Round {
  const lv = Math.max(1, Math.min(MAX_LEVEL, level));
  const plan = planFor(lv);
  const channels = [...plan.channels];
  if (plan.mode === 'one') {
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

/** Level 4 narrows until it has really listened: the ear coming out is not the same as hearing the parcel. */
export function narrowingFor(round: Round, record: readonly Observation[]): boolean {
  return round.channels.includes('sound') && !record.some((o) => o.channel === 'sound');
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
export function setKey(parcel: number, stage: number, selected: readonly string[], record: readonly Observation[]): string {
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

/** Level 5's stage A answer: one toy, or the *Can't tell yet* card. */
export type TellAnswer = ToyId | 'cant-tell';

export type TellVerdict =
  | { kind: 'empty' }
  | { kind: 'look-first' }
  | { kind: 'miss'; card: ToyId; obs: Observation }
  | { kind: 'can-tell'; only: ToyId; obs: Observation }
  | { kind: 'both-fit'; other: ToyId }
  | { kind: 'right'; toy: ToyId }
  | { kind: 'cant-tell'; left: ToyId[] };

/**
 * Level 5, stage A: can the look tell which toy it is? A toy the look rules out, or *Can't tell yet* when one toy is left,
 * is a miss (`miss`, `can-tell`); a fitting toy while another fits too is free (`both-fit`); the one fitting toy is `right`,
 * and *Can't tell yet* while two fit is right too, opening stage B (`cant-tell`).
 */
export function checkTell(shelf: readonly ToyId[], record: readonly Observation[], answer: TellAnswer | null): TellVerdict {
  if (answer === null) return { kind: 'empty' };
  if (record.length === 0) return { kind: 'look-first' };
  const left = possible(shelf, record);
  if (answer === 'cant-tell') {
    if (left.length >= 2) return { kind: 'cant-tell', left };
    return { kind: 'can-tell', only: left[0], obs: record.find((o) => o.channel === 'view') ?? record[0] };
  }
  if (!left.includes(answer)) return { kind: 'miss', card: answer, obs: record.find((o) => TOYS[answer][o.channel] !== o.value)! };
  if (left.length > 1) return { kind: 'both-fit', other: left.find((t) => t !== answer)! };
  return { kind: 'right', toy: answer };
}

/**
 * The sense that would tell the possible toys apart: a channel not yet observed that leaves exactly one toy whichever of
 * them is inside. Null when one toy is already left or no channel would.
 */
export function distinguishing(shelf: readonly ToyId[], record: readonly Observation[]): Channel | null {
  const left = possible(shelf, record);
  if (left.length < 2) return null;
  const channels: Channel[] = ['view', 'sound'];
  return channels.find((ch) => !record.some((o) => o.channel === ch)
    && left.every((t) => possible(left, [...record, observe(t, ch)]).length === 1)) ?? null;
}

/** Level 5, stage B: the chosen sense is right when it would tell the possible toys apart. */
export function checkSense(shelf: readonly ToyId[], record: readonly Observation[], choice: Channel | null): 'empty' | 'right' | 'miss' {
  if (choice === null) return 'empty';
  return choice === distinguishing(shelf, record) ? 'right' : 'miss';
}

/** The answer a level-5 hint glows: the one fitting toy or *Can't tell yet* in stage A, the deciding sense in stage B. */
export function tellTarget(shelf: readonly ToyId[], record: readonly Observation[], stage: 'answer' | 'sense'): TellAnswer | Channel {
  if (stage === 'sense') return distinguishing(shelf, record) ?? 'sound';
  const left = possible(shelf, record);
  return left.length === 1 ? left[0] : 'cant-tell';
}

/** The bot at level 5: look first, then choose the hint's target, then Check. */
export type TellMove = { investigate: Channel } | { choose: TellAnswer | Channel } | { check: true };
export function tellTouch(round: Round, record: readonly Observation[], stage: 'answer' | 'sense', chosen: TellAnswer | Channel | null): TellMove {
  if (!record.some((o) => o.channel === 'view')) return { investigate: 'view' };
  const target = tellTarget(round.shelf, record, stage);
  if (chosen !== target) return { choose: target };
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
  /** Level 5's *Can't tell yet* card, or null. */
  cantTell: Rect | null;
}

const PET_CORNER = { w: 160, h: 170 };
export const TOY_W = 200;
export const TOY_H = 220;
export const CHECK = 170;
export const EVIDENCE = 140;
export const BUTTON = 150;
export const CANT_TELL = 170;

/**
 * Every rectangle of the museum counter. A test asserts sizes, clearances and no overlap at four views. `strip` slots
 * default to the channel buttons; level 5 has one button but two clues (the look, then the reveal's sound).
 */
export function exhibitLayout(view: View, cards: number, channels: number, cantTell = false, strip = channels): Exhibit {
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
  const stripX = spread(strip, 0, w, EVIDENCE + 24);
  const slots: Rect[] = stripX.map((cx) => ({ x: cx - EVIDENCE / 2, y: stripY, w: EVIDENCE, h: EVIDENCE }));
  const shelfY = landscape ? h - 20 - TOY_H : stripY + EVIDENCE + 40;
  const checkX = w - 20 - CHECK;
  const lo = landscape ? PET_CORNER.w + 10 : 20;
  const hi = landscape ? checkX - 20 : w - 20;
  const shelf: Rect[] = spread(cards, lo, hi, TOY_W + 30).map((cx) => ({ x: cx - TOY_W / 2, y: shelfY, w: TOY_W, h: TOY_H }));
  const check: Rect = landscape
    ? { x: checkX, y: shelfY + (TOY_H - CHECK) / 2, w: CHECK, h: CHECK }
    : { x: checkX, y: shelfY + TOY_H + 20, w: CHECK, h: CHECK };
  // The card sits above Check in landscape (the column right of the shelf), and left of Check on its row in portrait.
  const tell: Rect | null = !cantTell ? null : landscape
    ? { x: checkX, y: check.y - 20 - CANT_TELL, w: CANT_TELL, h: CANT_TELL }
    : { x: checkX - 30 - CANT_TELL, y: check.y, w: CANT_TELL, h: CANT_TELL };
  return { parcel, look, listen, strip: slots, shelf, check, cantTell: tell };
}
