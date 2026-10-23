import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/*
 * Attic Finds: an invented attic thing with a crank. She turns it over, looks at its parts up close and cranks it; at
 * level 1 she picks the picture of what it did, at level 2 she puts the part that proves "the crank makes it bob" in
 * the claim's slot and checks. Everything here is make-believe for the island: no date, culture or real object.
 */

export type ObjectId = 'bird-box' | 'fish-churn';
export type Side = 'front' | 'back';
export type Effect = 'bob' | 'roll';
export type ClaimId = 'crank-moves' | 'hand-turned' | 'opens';
export type ClueKind = 'star' | 'handle' | 'rod' | 'door';
export type ClueId = `${ObjectId}:${ClueKind}`;

export const CLAIMS: readonly ClaimId[] = ['crank-moves', 'hand-turned', 'opens'];
/** The claim this slice asks about. */
export const CLAIM: ClaimId = 'crank-moves';
export const EFFECTS: readonly Effect[] = ['bob', 'roll'];

export interface Pt { x: number; y: number }

export interface Clue {
  id: ClueId;
  kind: ClueKind;
  side: Side;
  /** Where the spot sits in its side's drawing (object units; the drawing spans about ±OBJ across). */
  at: Pt;
  line: LineId;
  /** Spoken name for "{part}". */
  part: string;
  supports: readonly ClaimId[];
}

export interface AtticObject {
  id: ObjectId;
  /** What bobs: spoken in the claim. */
  mover: 'bird' | 'fish';
  effect: Effect;
  /** The crank's hub and its handle's knob on each side (the back is the front seen from behind, so mirrored). */
  crank: Record<Side, { hub: Pt; knob: Pt }>;
  clues: readonly Clue[];
}

const mirror = (p: Pt): Pt => ({ x: -p.x, y: p.y });

const BIRD_HUB = { x: 150, y: 20 };
const BIRD_KNOB = { x: 150, y: 130 };
const FISH_HUB = { x: -40, y: -150 };
const FISH_KNOB = { x: 70, y: -150 };

export const OBJECTS: readonly AtticObject[] = [
  {
    id: 'bird-box',
    mover: 'bird',
    effect: 'bob',
    crank: { front: { hub: BIRD_HUB, knob: BIRD_KNOB }, back: { hub: mirror(BIRD_HUB), knob: mirror(BIRD_KNOB) } },
    clues: [
      { id: 'bird-box:star', kind: 'star', side: 'front', at: { x: -45, y: 40 }, line: 'attic-finds.clue-star', part: 'star', supports: [] },
      { id: 'bird-box:handle', kind: 'handle', side: 'front', at: BIRD_KNOB, line: 'attic-finds.clue-handle', part: 'handle', supports: ['hand-turned'] },
      { id: 'bird-box:rod', kind: 'rod', side: 'back', at: { x: -20, y: -20 }, line: 'attic-finds.clue-rod-bird', part: 'rod', supports: ['crank-moves'] },
    ],
  },
  {
    id: 'fish-churn',
    mover: 'fish',
    effect: 'bob',
    crank: { front: { hub: FISH_HUB, knob: FISH_KNOB }, back: { hub: mirror(FISH_HUB), knob: mirror(FISH_KNOB) } },
    clues: [
      { id: 'fish-churn:door', kind: 'door', side: 'front', at: { x: 0, y: 100 }, line: 'attic-finds.clue-door', part: 'door', supports: ['opens'] },
      { id: 'fish-churn:handle', kind: 'handle', side: 'front', at: FISH_KNOB, line: 'attic-finds.clue-handle', part: 'handle', supports: ['hand-turned'] },
      { id: 'fish-churn:rod', kind: 'rod', side: 'back', at: { x: 30, y: -45 }, line: 'attic-finds.clue-rod-fish', part: 'rod', supports: ['crank-moves'] },
    ],
  },
];

export const objectOf = (id: ObjectId): AtticObject => OBJECTS.find((o) => o.id === id)!;
export const clueOf = (id: ClueId): Clue => objectOf(id.split(':')[0] as ObjectId).clues.find((c) => c.id === id)!;

/** The evidence rule: a clue backs a claim only through a link the drawing shows. A plain lookup. */
export const supports = (clue: Clue, claim: ClaimId): boolean => clue.supports.includes(claim);

/** What happens when the crank turns: the object's own effect, whichever picture she tried. A prediction changes nothing. */
export const outcome = (obj: AtticObject, _tried: Effect): Effect => obj.effect;

/** The clue that proves a claim on this object (the glow at level 2). */
export function glowTarget(obj: AtticObject, claim: ClaimId): Clue | null {
  return obj.clues.find((c) => supports(c, claim)) ?? null;
}

/* Levels and rounds ----------------------------------------------------------------------------- */

export interface Plan { id: 1 | 2 | 3 | 4; name: string; mode: 'try' | 'prove' | 'lever' | 'peek' }
export const PLANS: readonly Plan[] = [
  { id: 1, name: 'Try it: crank it, then pick the picture of what it did', mode: 'try' },
  { id: 2, name: 'Show the clue: the part that proves the crank makes it bob', mode: 'prove' },
  { id: 3, name: 'Up and down: tap the big handle and the bird or fish goes up, then down', mode: 'lever' },
  { id: 4, name: 'Peek inside: open the little door and watch the rod lift the bird', mode: 'peek' },
];
/** The plan with this level's ID; an unknown level is level 1. */
export const planFor = (level: number): Plan => PLANS.find((p) => p.id === level) ?? PLANS[0];
export const isFree = (plan: Plan): boolean => plan.mode === 'lever' || plan.mode === 'peek';

/* Levels 3-4: a giant handle. Every touch is play, so nothing here is ever a miss or a hint. ------- */

export const TURNS_TO_FINISH = 3;

export interface LeverState {
  up: boolean;
  turns: number;
  queued: boolean;
  turning: boolean;
  doorOpen: boolean;
  peeked: boolean;
  done: boolean;
}

export const leverState = (): LeverState => ({ up: false, turns: 0, queued: false, turning: false, doorOpen: false, peeked: false, done: false });

/** A touch on the handle: starts a half turn, or queues one more if one is already turning. Returns whether a turn started. */
export function press(s: LeverState): boolean {
  if (s.done) return false;
  if (s.turning) {
    s.queued = true;
    return false;
  }
  s.turning = true;
  return true;
}

/** A half turn ended: the mover flips, the turn counts, and a queued one starts. Returns whether another began. */
export function turnEnded(s: LeverState): boolean {
  if (!s.turning) return false;
  s.up = !s.up;
  s.turns++;
  s.turning = false;
  if (s.doorOpen) s.peeked = true;
  if (s.queued && !s.done) {
    s.queued = false;
    s.turning = true;
    return true;
  }
  s.queued = false;
  return false;
}

export function toggleDoor(s: LeverState, plan: Plan): boolean {
  if (plan.mode !== 'peek' || s.done) return false;
  s.doorOpen = !s.doorOpen;
  return true;
}

export const canFinish = (s: LeverState): boolean => s.turns >= TURNS_TO_FINISH && !s.done;

export function finishLever(s: LeverState): boolean {
  if (!canFinish(s)) return false;
  s.done = true;
  s.queued = false;
  return true;
}

export interface LeverRound { object: ObjectId }
/** Level 4 and the session's authored first round are the bird box; level 3 otherwise picks either, seeded. */
export function makeLeverRound(plan: Plan, rng: Rng, first = false): LeverRound {
  const object: ObjectId = plan.mode === 'peek' || first ? 'bird-box' : rng.chance(0.5) ? 'bird-box' : 'fish-churn';
  return { object };
}

export interface Encounter {
  object: ObjectId;
  start: Side;
  /** The three clue chips (and the detail window's order), a permutation of the object's clues. */
  order: ClueId[];
  /** The two trial cards, left to right: always bob and roll. */
  cards: Effect[];
}

export interface Round { encounters: Encounter[] }

/** The definition's first rounds, played once per level per session (not by the demonstration). */
export function authored(plan: Plan): Round {
  if (plan.mode === 'try') {
    return {
      encounters: [
        { object: 'bird-box', start: 'front', order: ['bird-box:star', 'bird-box:handle', 'bird-box:rod'], cards: ['bob', 'roll'] },
        { object: 'fish-churn', start: 'back', order: ['fish-churn:door', 'fish-churn:handle', 'fish-churn:rod'], cards: ['roll', 'bob'] },
      ],
    };
  }
  return {
    encounters: [
      { object: 'fish-churn', start: 'front', order: ['fish-churn:door', 'fish-churn:handle', 'fish-churn:rod'], cards: ['bob', 'roll'] },
      { object: 'bird-box', start: 'front', order: ['bird-box:star', 'bird-box:rod', 'bird-box:handle'], cards: ['roll', 'bob'] },
    ],
  };
}

export function makeRound(plan: Plan, rng: Rng, first = false): Round {
  if (first) return authored(plan);
  const ids = rng.shuffle(OBJECTS.map((o) => o.id));
  return {
    encounters: ids.map((id) => ({
      object: id,
      start: rng.chance(0.5) ? 'front' : 'back',
      order: rng.shuffle(objectOf(id).clues.map((c) => c.id)),
      cards: rng.shuffle([...EFFECTS]),
    })),
  };
}

/* One encounter's rules ------------------------------------------------------------------------- */

/**
 * The scoring state of one object. Looking, turning, cranking, trying a card and swapping chips are never counted;
 * level 1 never records a miss; level 2 counts an unsupported Check. Help (two wrong tries, or asked for) counts once.
 */
export interface EncounterState {
  mode: Plan['mode'];
  object: AtticObject;
  looked: Set<ClueId>;
  /** Level 1: the object has been tried (a card or the crank), so the cards ask "Which one happened?". */
  tried: boolean;
  slot: ClueId | null;
  wrong: number;
  misses: number;
  hints: number;
  glow: boolean;
  done: boolean;
}

export function encounterState(mode: Plan['mode'], object: AtticObject): EncounterState {
  return { mode, object, looked: new Set(), tried: false, slot: null, wrong: 0, misses: 0, hints: 0, glow: false, done: false };
}

export const look = (s: EncounterState, clue: ClueId) => { s.looked.add(clue); };

/** The crank turned, by her or by a trial card. */
export const tryIt = (s: EncounterState) => { s.tried = true; };

/** Help shown: counts once per object. Returns whether it counted. */
export function help(s: EncounterState): boolean {
  s.glow = true;
  if (s.hints > 0 || s.done) return false;
  s.hints = 1;
  return true;
}

export type PickResult = 'ignored' | 'tried' | 'right' | 'wrong';

/** Level 1: a card tap. Before trying, it is a prediction (never wrong); after, it answers "Which one happened?". */
export function pick(s: EncounterState, card: Effect): PickResult {
  if (s.done || s.mode !== 'try') return 'ignored';
  if (!s.tried) {
    s.tried = true;
    return 'tried';
  }
  if (card === s.object.effect) {
    s.done = true;
    return 'right';
  }
  s.wrong++;
  if (s.wrong >= 2) help(s);
  return 'wrong';
}

/** Level 2: put a looked-at chip in the slot (or swap one there). Free. */
export function place(s: EncounterState, clue: ClueId | null): boolean {
  if (s.done || s.mode !== 'prove') return false;
  if (clue && !s.looked.has(clue)) return false;
  s.slot = clue;
  return true;
}

export type CheckResult = 'ignored' | 'empty' | 'proved' | 'miss';

export function check(s: EncounterState): CheckResult {
  if (s.done || s.mode !== 'prove') return 'ignored';
  if (!s.slot) return 'empty';
  if (supports(clueOf(s.slot), CLAIM)) {
    s.done = true;
    return 'proved';
  }
  s.misses++;
  s.wrong++;
  s.slot = null;
  if (s.wrong >= 2) help(s);
  return 'miss';
}

/** The card that glows at level 1 and the chip at level 2. */
export function glowing(s: EncounterState): Effect | ClueId | null {
  if (!s.glow || s.done) return null;
  return s.mode === 'try' ? s.object.effect : glowTarget(s.object, CLAIM)!.id;
}

/* Layout ---------------------------------------------------------------------------------------- */

/** Half the object's drawing, at scale 1. */
export const OBJ = 170;
export const TURN_R = 52;
export const CRANK_HIT = 55;
export const SPOT_R = 50;
export const CARD = 130;
export const CHIP_R = 50;
export const SLOT = 110;
export const CHECK_R = 52;
export const WINDOW_R = 150;
export const CLAIM_W = 300;
export const CLAIM_H = 130;

export interface Rect { x: number; y: number; w: number; h: number }

export interface AtticLayout {
  /** Levels 3-4: the handle's hit circle, the peek door, the Finish button. */
  handle: Pt;
  handleR: number;
  door: Rect;
  finish: Pt;
  portrait: boolean;
  object: Pt;
  scale: number;
  turn: Pt;
  window: Pt;
  shelf: Pt[];
  shelfY: number;
  cards: Pt[];
  claim: Pt;
  slot: Pt;
  check: Pt;
  chips: Pt[];
}

export const petCorner = (v: View): Rect => ({ x: 0, y: v.h - 205, w: 200, h: 205 });
export const shellButtons = (v: View): Rect[] => [{ x: 0, y: 0, w: 130, h: 130 }, { x: v.w - 130, y: 0, w: 130, h: 130 }];

/** Every rectangle of the screen. The level is accepted so a later level can rearrange; levels 1 and 2 share one plan. */
export const FREE_SCALE = 1.45;
export const FREE_SCALE_PORTRAIT = 1.3;
export const HANDLE_R = 110;
export const FINISH_R = 70;
/** The peek door's centre on the box front, in object units. */
export const DOOR_AT = { x: -40, y: 30 };
export const DOOR_W = 220;
export const DOOR_H = 200;

export function atticLayout(v: View, level: number): AtticLayout {
  const base = classicLayout(v);
  if (level < 3) return base;
  const portrait = v.h > v.w;
  const fs = portrait ? FREE_SCALE_PORTRAIT : FREE_SCALE;
  const object = portrait ? { x: v.w / 2 - 60, y: 470 } : { x: Math.max(420, v.w * 0.42), y: 430 };
  const knob = objectOf('bird-box').crank.front.knob;
  const dc = { x: object.x + DOOR_AT.x * fs, y: object.y + DOOR_AT.y * fs };
  return {
    ...base, object, scale: fs,
    handle: { x: object.x + knob.x * fs, y: object.y + knob.y * fs },
    door: { x: dc.x - DOOR_W / 2, y: dc.y - DOOR_H / 2, w: DOOR_W, h: DOOR_H },
    finish: portrait ? { x: v.w / 2 + 150, y: object.y + OBJ * fs + 150 } : { x: v.w - 100, y: v.h - 100 },
  };
}

function classicLayout(v: View): AtticLayout {
  const portrait = v.h > v.w;
  const free = { handle: { x: 0, y: 0 }, handleR: HANDLE_R, door: { x: 0, y: 0, w: DOOR_W, h: DOOR_H }, finish: { x: 0, y: 0 } };
  const shelfY = 150;
  const shelf = [{ x: v.w / 2 - 90, y: shelfY }, { x: v.w / 2 + 90, y: shelfY }];
  if (portrait) {
    const object = { x: v.w / 2 + 40, y: 480 };
    const below = object.y + OBJ + 150;
    return {
      ...free, portrait, object, scale: 1, shelf, shelfY,
      turn: { x: object.x + OBJ + 120, y: object.y + 60 },
      window: { x: object.x - OBJ - 175, y: object.y - 40 },
      cards: [{ x: v.w / 2 - 85, y: below }, { x: v.w / 2 + 85, y: below }],
      claim: { x: v.w / 2 - 125, y: below },
      slot: { x: v.w / 2 + 100, y: below },
      check: { x: v.w / 2 + 230, y: below },
      chips: [-120, 0, 120].map((dx) => ({ x: v.w / 2 + dx, y: below + 170 })),
    };
  }
  const scale = 0.92;
  const object = { x: Math.max(470, v.w * 0.45), y: 430 };
  const right = v.w - 30;
  return {
    ...free, portrait, object, scale, shelf, shelfY,
    turn: { x: object.x + 70, y: v.h - 75 },
    window: { x: object.x - OBJ * scale - 160, y: 345 },
    cards: [{ x: right - CARD * 1.5 - 20, y: v.h - 100 }, { x: right - CARD / 2, y: v.h - 100 }],
    claim: { x: right - CLAIM_W / 2 - 10, y: 255 },
    slot: { x: right - 250, y: 410 },
    check: { x: right - 90, y: 410 },
    chips: [-230, -120, -10].map((dx) => ({ x: right - 50 + dx, y: 560 })),
  };
}
