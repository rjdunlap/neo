/**
 * Puppet Stage rules: four stick puppets with a device-speech voice each, three voice presets (sleepy, tiny, big),
 * the level plans (pop up; make the named puppet talk, then the one with the tiny or big voice; say the line the asked
 * way), the answer rule, the hint target and the stage layout; levels 4–6 act authored story cards (bob a puppet at a
 * painted place, in card order) for a front row that reacts only to what was shown. Definitions:
 * docs/definitions/puppet-stage.md and docs/definitions/puppet-stage-4-6.md.
 */
import type { Mood } from '../../art/critter';
import type { VoicePreset } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { Band } from '../../progress/bands';
import type { BandLevels } from '../../progress/difficulty';

export type Puppet = 'bunny' | 'bear' | 'duck' | 'cat';
/** Parked under the floor in this order, left to right. */
export const PUPPETS: readonly Puppet[] = ['bunny', 'bear', 'duck', 'cat'];

/** Each puppet's own voice; no two alike and none the pet's (`PET_VOICE` in `src/audio/voice.ts`). */
export const BASE_VOICE: Record<Puppet, VoicePreset> = {
  bunny: { pitch: 1.5, rate: 1.05 },
  bear: { pitch: 0.7, rate: 0.85 },
  duck: { pitch: 1.8, rate: 1.15 },
  cat: { pitch: 0.95, rate: 0.9 },
};
/** The pentatonic step each puppet sings its "la" on. */
export const NOTE: Record<Puppet, number> = { bunny: 7, bear: 1, duck: 9, cat: 4 };

export type Way = 'sleepy' | 'tiny' | 'big';
/** The bubbles' fixed order. */
export const WAYS: readonly Way[] = ['sleepy', 'tiny', 'big'];
/**
 * Absolute presets, so "sleepy" sounds the same whichever puppet holds the line. Retuned from the definition's first
 * table (tiny 1.9/1.2 and big 0.6/0.85 sat within the base margin of Duck and Bear); the margin tests guard any retune.
 */
export const WAY_VOICE: Record<Way, VoicePreset> = {
  sleepy: { pitch: 0.8, rate: 0.65, volume: 0.8 },
  tiny: { pitch: 2, rate: 1.3, volume: 0.85 },
  big: { pitch: 0.5, rate: 0.85, volume: 1 },
};
/** The face and size the puppet takes while it says the line that way. */
export const WAY_LOOK: Record<Way, { mood: Mood; scale: number }> = {
  sleepy: { mood: 'sleepy', scale: 1 },
  tiny: { mood: 'surprised', scale: 0.7 },
  big: { mood: 'sing', scale: 1.3 },
};
export const LINES = [
  'ps.line.1',
  'ps.line.2',
  'ps.line.3',
  'ps.line.4',
] as const satisfies readonly LineId[];

/** Device-speech ranges that stay intelligible. */
export const PITCH_RANGE: readonly [number, number] = [0.5, 2];
export const RATE_RANGE: readonly [number, number] = [0.6, 1.3];
/** Two presets differ by this much in pitch or rate, and in at least two of pitch, rate and volume. */
export const PRESET_MARGIN = 0.2;
/** A preset keeps this far from every base voice (pitch or rate), so "the ordinary way" is never one of the three. */
export const BASE_MARGIN = { pitch: 0.2, rate: 0.15 };
/** A voice ask (tiny or big) is drawn only from a pair whose base pitches differ by this much. */
export const VOICE_PAIR_MARGIN = 0.5;
const EPS = 1e-9;

const apart = (a: number, b: number, by: number) => Math.abs(a - b) + EPS >= by;

export function presetsDistinct(a: VoicePreset, b: VoicePreset): boolean {
  const differ = [a.pitch !== b.pitch, a.rate !== b.rate, (a.volume ?? 1) !== (b.volume ?? 1)].filter(
    Boolean,
  ).length;
  return (apart(a.pitch, b.pitch, PRESET_MARGIN) || apart(a.rate, b.rate, PRESET_MARGIN)) && differ >= 2;
}

export function clearOfBase(preset: VoicePreset, base: VoicePreset): boolean {
  return (
    apart(preset.pitch, base.pitch, BASE_MARGIN.pitch) || apart(preset.rate, base.rate, BASE_MARGIN.rate)
  );
}

export const inRange = (v: VoicePreset) =>
  v.pitch >= PITCH_RANGE[0] &&
  v.pitch <= PITCH_RANGE[1] &&
  v.rate >= RATE_RANGE[0] &&
  v.rate <= RATE_RANGE[1];

export type Pair = readonly [Puppet, Puppet];

/** Every pair of puppets, in parked order. */
export function allPairs(): Pair[] {
  const out: Pair[] = [];
  for (let i = 0; i < PUPPETS.length; i++)
    for (let j = i + 1; j < PUPPETS.length; j++) out.push([PUPPETS[i], PUPPETS[j]]);
  return out;
}

/** The pairs a voice ask may use. */
export const voicePairs = (): Pair[] =>
  allPairs().filter(([a, b]) => apart(BASE_VOICE[a].pitch, BASE_VOICE[b].pitch, VOICE_PAIR_MARGIN));

/** The higher-pitched puppet of a pair. */
export const tinyOf = (pair: Pair): Puppet =>
  BASE_VOICE[pair[0]].pitch >= BASE_VOICE[pair[1]].pitch ? pair[0] : pair[1];
/** The lower-pitched puppet of a pair. */
export const bigOf = (pair: Pair): Puppet => (tinyOf(pair) === pair[0] ? pair[1] : pair[0]);

export type Ask =
  { kind: 'name'; puppet: Puppet } | { kind: 'voice'; which: 'tiny' | 'big' } | { kind: 'way'; way: Way };

export type Place = 'door' | 'tree' | 'pond';
export const PLACES: readonly Place[] = ['door', 'tree', 'pond'];

/** One story card: this puppet bobs at this place. `voice` sets a way other than the puppet's own (only c3). */
export interface Scene {
  puppet: Puppet;
  place: Place;
  card: LineId;
  line: LineId;
  waited: LineId;
  voice?: Way;
}
/** `cast[0]` waits at the left peek and `places[0]` is painted left. */
export interface Story {
  id: 'a' | 'b' | 'c';
  cast: [Puppet, Puppet];
  places: [Place, Place];
  scenes: [Scene, Scene, Scene];
}

const scene = (id: string, i: number, puppet: Puppet, place: Place, voice?: Way): Scene => ({
  puppet,
  place,
  card: `ps.card.${id}${i}` as LineId,
  line: `ps.sc.${id}${i}` as LineId,
  waited: `ps.waited.${id}${i}` as LineId,
  ...(voice ? { voice } : {}),
});

/** The three authored cards: scene 1 always walks away from its peek, and a standing puppet's next scene moves it. */
export const STORIES: readonly Story[] = [
  {
    id: 'a',
    cast: ['bunny', 'bear'],
    places: ['tree', 'door'],
    scenes: [scene('a', 1, 'bunny', 'door'), scene('a', 2, 'bear', 'door'), scene('a', 3, 'bear', 'tree')],
  },
  {
    id: 'b',
    cast: ['bunny', 'duck'],
    places: ['pond', 'tree'],
    scenes: [scene('b', 1, 'bunny', 'tree'), scene('b', 2, 'duck', 'pond'), scene('b', 3, 'bunny', 'pond')],
  },
  {
    id: 'c',
    cast: ['duck', 'cat'],
    places: ['door', 'pond'],
    scenes: [
      scene('c', 1, 'duck', 'pond'),
      scene('c', 2, 'cat', 'door'),
      scene('c', 3, 'cat', 'pond', 'tiny'),
    ],
  },
];
/** Duck's answer after Cat's sneaky boo. */
export const SURPRISED: LineId = 'ps.sc.c3-duck';

/** Left and right swapped, for both the places and the cast. */
export const mirrored = (s: Story): Story => ({
  ...s,
  cast: [s.cast[1], s.cast[0]],
  places: [s.places[1], s.places[0]],
});

export interface Plan {
  level: number;
  name: string;
  /** On stage at the start (level 2: the pair; level 3: the one); level 1 parks all four. */
  puppets: Puppet[];
  asks: Ask[];
  /** Level 3's line. */
  line: LineId | null;
  /** Level 1: Bow appears after this many pops or seconds. */
  popsToBow: number;
  secondsToBow: number;
  /** Level 1 at lap: the show bows by itself after this many pops. */
  autoBowAfter: number | null;
  /** Levels 4–6: the drawn card (already mirrored when `mirror`), and the scenes this level acts (1, 2 or 3). */
  story: Story | null;
  mirror: boolean;
  scenes: Scene[];
}

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 6 },
};
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Pop up',
  2: 'Make Bunny talk',
  3: 'Say it like',
  4: 'One scene',
  5: 'Two scenes',
  6: 'The whole show',
};
export const ASKS_PER_ROUND = 4;

export function describeLevel(level: number): string {
  if (level <= 1)
    return 'Pop up: touch the floor and a puppet rises there, says hello and follows her finger; nothing counted';
  if (level === 2)
    return 'Make Bunny talk: tap the puppet the pet names (preschool: then the one with the tiny or big voice)';
  if (level === 3)
    return 'Say it like: tap the sleepy, tiny or big bubble to make the puppet say its line that way';
  if (level === 4) return 'One scene: bring the puppet up, walk it to the place on the card and bob it';
  if (level === 5) return 'Two scenes: act two cards in order';
  return 'The whole show: act three cards for three friends, who react only to what she showed';
}

const pick = <T>(rng: Rng, list: readonly T[]): T => list[rng.int(0, list.length - 1)];
const shuffled = <T>(rng: Rng, list: readonly T[]): T[] => {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** The puppet an ask means, on the given stage. */
export function askedPuppet(ask: Ask, puppets: readonly Puppet[]): Puppet | null {
  if (ask.kind === 'name') return ask.puppet;
  if (ask.kind === 'voice')
    return ask.which === 'tiny' ? tinyOf([puppets[0], puppets[1]]) : bigOf([puppets[0], puppets[1]]);
  return null;
}

/** Four name asks: never three in a row the same puppet. */
function nameAsks(rng: Rng, pair: Pair, count: number): Ask[] {
  const asks: Ask[] = [];
  for (let i = 0; i < count; i++) {
    const last = asks.length >= 2 ? askedPuppet(asks[asks.length - 1], pair) : null;
    const before = asks.length >= 2 ? askedPuppet(asks[asks.length - 2], pair) : null;
    const puppet = last && last === before ? (last === pair[0] ? pair[1] : pair[0]) : pick(rng, pair);
    asks.push({ kind: 'name', puppet });
  }
  return asks;
}

const NO_STORY = { story: null, mirror: false, scenes: [] as Scene[] };

export function plan(level: number, band: Band, rng: Rng): Plan {
  if (level <= 1) {
    return {
      level: 1,
      name: LEVEL_NAMES[1],
      puppets: PUPPETS.slice(),
      asks: [],
      line: null,
      popsToBow: 3,
      secondsToBow: 30,
      autoBowAfter: band === 'lap' ? 6 : null,
      ...NO_STORY,
    };
  }
  if (level >= 4) {
    const at = Math.min(6, level);
    const mirror = rng.chance(0.5);
    const base = pick(rng, STORIES);
    const story = mirror ? mirrored(base) : base;
    return {
      level: at,
      name: LEVEL_NAMES[at],
      puppets: story.cast.slice(),
      asks: [],
      line: null,
      popsToBow: 0,
      secondsToBow: 0,
      autoBowAfter: null,
      story,
      mirror,
      scenes: story.scenes.slice(0, at - 3),
    };
  }
  if (level === 2) {
    const byVoice = band !== 'toddler' && band !== 'lap';
    const pair = pick(rng, byVoice ? voicePairs() : allPairs());
    const asks = nameAsks(rng, pair, byVoice ? 2 : ASKS_PER_ROUND);
    if (byVoice) {
      let voice: Ask[] = rng.chance(0.5)
        ? [
            { kind: 'voice', which: 'tiny' },
            { kind: 'voice', which: 'big' },
          ]
        : [
            { kind: 'voice', which: 'big' },
            { kind: 'voice', which: 'tiny' },
          ];
      const named = (list: Ask[]) => [...asks, ...list].map((a) => askedPuppet(a, pair));
      const threeAlike = (list: (Puppet | null)[]) =>
        list.some((p, i) => i >= 2 && p === list[i - 1] && p === list[i - 2]);
      if (threeAlike(named(voice))) voice = [voice[1], voice[0]];
      asks.push(...voice);
    }
    return {
      level: 2,
      name: LEVEL_NAMES[2],
      puppets: [pair[0], pair[1]],
      asks,
      line: null,
      popsToBow: 0,
      secondsToBow: 0,
      autoBowAfter: null,
      ...NO_STORY,
    };
  }
  const puppet = pick(rng, PUPPETS);
  const line = pick(rng, LINES);
  const ways = shuffled(rng, WAYS);
  ways.push(
    pick(
      rng,
      WAYS.filter((w) => w !== ways[2]),
    ),
  );
  return {
    level: 3,
    name: LEVEL_NAMES[3],
    puppets: [puppet],
    asks: ways.map((way) => ({ kind: 'way', way })),
    line,
    popsToBow: 0,
    secondsToBow: 0,
    autoBowAfter: null,
    ...NO_STORY,
  };
}

export type Verdict = { right: true } | { right: false; said: LineId };

/** Was the tapped puppet or bubble the asked one? A miss names what she tapped. */
export function answer(ask: Ask, tapped: Puppet | Way, puppets: readonly Puppet[]): Verdict {
  if (ask.kind === 'way') {
    if (!(WAYS as readonly string[]).includes(tapped))
      return { right: false, said: `ps.im.${tapped as Puppet}` };
    return tapped === ask.way ? { right: true } : { right: false, said: `ps.was.${tapped as Way}` };
  }
  if ((WAYS as readonly string[]).includes(tapped)) return { right: false, said: `ps.was.${tapped as Way}` };
  return tapped === askedPuppet(ask, puppets)
    ? { right: true }
    : { right: false, said: `ps.im.${tapped as Puppet}` };
}

/** What glows after the second miss on one ask. */
export function hintTarget(ask: Ask, puppets: readonly Puppet[]): Puppet | Way {
  return ask.kind === 'way' ? ask.way : askedPuppet(ask, puppets)!;
}

/** The pet's spoken ask. */
export function askLine(ask: Ask): LineId {
  if (ask.kind === 'name') return `ps.ask.${ask.puppet}`;
  if (ask.kind === 'voice') return `ps.ask.${ask.which}-voice`;
  return `ps.ask.${ask.way}`;
}

// ---- story cards (levels 4–6) ----

/** A bob: the tapped puppet and the place it stands at (null when it stands at none). */
export interface Bob {
  puppet: Puppet;
  place: Place | null;
}
export type Judged =
  | { kind: 'scene'; index: number }
  | { kind: 'early'; index: number }
  | { kind: 'again'; index: number }
  | { kind: 'free' };

/** Scenes tick only in card order, so `done` (how many have ticked) is the whole state. */
export function judge(scenes: readonly Scene[], done: number, bob: Bob): Judged {
  if (bob.place === null) return { kind: 'free' };
  const matches = (s: Scene) => s.puppet === bob.puppet && s.place === bob.place;
  if (done < scenes.length && matches(scenes[done])) return { kind: 'scene', index: done };
  for (let i = done + 1; i < scenes.length; i++) if (matches(scenes[i])) return { kind: 'early', index: i };
  for (let i = done - 1; i >= 0; i--) if (matches(scenes[i])) return { kind: 'again', index: i };
  return { kind: 'free' };
}

export type Reaction = 'clap' | 'puzzled';
/** Friend i waits for scene i: it claps once that scene was shown and is puzzled until then. Depends on nothing but `done`. */
export function reactions(scenes: readonly Scene[], done: number): Reaction[] {
  return scenes.map((_, i) => (i < done ? 'clap' : 'puzzled'));
}

/** What glows: the first unticked scene's puppet and place. */
export function storyHint(scenes: readonly Scene[], done: number): { puppet: Puppet; place: Place } | null {
  const s = scenes[done];
  return s ? { puppet: s.puppet, place: s.place } : null;
}

/** Where a cast puppet is: under the stage at its peek, standing at one of the places, or standing elsewhere. */
export type Where = 'parked' | Place | null;
export type StoryMove =
  | { kind: 'raise'; puppet: Puppet; place: Place }
  | { kind: 'walk'; puppet: Puppet; place: Place }
  | { kind: 'bob'; puppet: Puppet }
  | { kind: 'bow' };

/** The ghost finger's next move: bring up or walk the next scene's puppet to its place, then bob it; Bow when all are acted. */
export function storyMove(scenes: readonly Scene[], done: number, where: (p: Puppet) => Where): StoryMove {
  const s = scenes[done];
  if (!s) return { kind: 'bow' };
  const w = where(s.puppet);
  if (w === 'parked') return { kind: 'raise', puppet: s.puppet, place: s.place };
  if (w !== s.place) return { kind: 'walk', puppet: s.puppet, place: s.place };
  return { kind: 'bob', puppet: s.puppet };
}

// ---- layout ----

export const PUPPET_W = 140;
export const PUPPET_H = 200;
export const BUBBLE = 130;
export const BOW_W = 130;
export const BOW_H = 110;
export const CURTAIN_W = 110;
export const TASSEL = 100;
/** Risen puppets stand at least this far apart. */
export const APART = 160;
export const CARD_W = 130;
export const CARD_H = 100;
export const PEEK_W = 140;
export const PEEK_H = 100;
/** The stage's left edge keeps clear of the home and help buttons and the guide. */
const STAGE_LEFT = 180;
const ARCH_TOP = 20;
/** The curtains and the floor's touch surface start below the arch band and the tassel. */
const CURTAIN_TOP = 110;
/** Levels 4–6: the curtains start below the marquee cards, which hang across the arch. */
const STORY_CURTAIN_TOP = 126;
const CARD_Y = 18 + CARD_H / 2;
const CARD_GAP = 12;
/** The marquee keeps right of the corner buttons' column. */
const CARD_LEFT = 130;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Layout {
  portrait: boolean;
  /** The proscenium: `floor` is the floor line with the slot; `bottom` is the apron's edge. */
  stage: { left: number; right: number; top: number; floor: number; bottom: number };
  curtains: [Box, Box];
  tassel: Box;
  /** A touch anywhere here raises a puppet at that x (level 1). */
  floorTouch: Box;
  /** Where a risen puppet may stand (its x). */
  stand: { min: number; max: number };
  /** The four parked puppets' home x, in `PUPPETS` order. */
  homes: number[];
  /** Fixed places for level 2's pair and level 3's puppet. */
  spots: number[];
  /** Level 3's bubbles in `WAYS` order; empty otherwise. */
  bubbles: Box[];
  bow: Box;
  /** The front row's seats; empty where there is no room. */
  seats: { x: number; y: number }[];
  /** Levels 4–6: the two painted places' centres (left, right), each place's two marks, and the snap half-width. */
  places: number[];
  marks: [number, number][];
  snap: number;
  /** Levels 4–6: the cast's two peeks in the apron (left, right), the marquee cards, and level 6's The end. */
  peeks: Box[];
  cards: Box[];
  end: Box | null;
}

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function layout(level: number, view: { w: number; h: number }): Layout {
  const { w, h } = view;
  const portrait = h > w;
  const tall = !portrait && h >= 660;
  const columnOfBubbles = level === 3 && tall;
  const story = level >= 4;
  const left = STAGE_LEFT;
  const right = w - 20 - (columnOfBubbles ? BUBBLE + 20 : 0);
  const floor = Math.round(h * (portrait ? 0.55 : 0.6));
  const cx = (left + right) / 2;
  const curtainTop = story ? STORY_CURTAIN_TOP : CURTAIN_TOP;
  // A story puppet stands on a mark in full view: its whole width clears the curtain.
  const keep = story ? PUPPET_W / 2 + 10 : 40;
  const stand = { min: left + CURTAIN_W + keep, max: right - CURTAIN_W - keep };
  const span = stand.max - stand.min;
  const homes = Array.from(
    { length: PUPPETS.length },
    (_, i) => stand.min + (span * i) / (PUPPETS.length - 1),
  );
  const off = Math.min(130, span / 2);
  const spots = level === 2 ? [cx - off, cx + off] : level === 3 ? [cx] : [];
  const curtainH = floor - curtainTop;
  const curtains: [Box, Box] = [
    box(left + CURTAIN_W / 2, curtainTop + curtainH / 2, CURTAIN_W, curtainH),
    box(right - CURTAIN_W / 2, curtainTop + curtainH / 2, CURTAIN_W, curtainH),
  ];
  const tassel = box(right - 75, 55, TASSEL, TASSEL);
  const floorTouch = box(cx, (CURTAIN_TOP + floor) / 2, right - left - 2 * CURTAIN_W, floor - CURTAIN_TOP);
  const bow = box(w - 20 - BOW_W / 2, h - 20 - BOW_H / 2, BOW_W, BOW_H);
  let bubbles: Box[] = [];
  let seats: { x: number; y: number }[] = [
    { x: cx - 110, y: floor + 70 },
    { x: cx, y: floor + 70 },
    { x: cx + 110, y: floor + 70 },
  ];
  if (level === 3) {
    if (columnOfBubbles) {
      const x = w - 20 - BUBBLE / 2;
      bubbles = WAYS.map((_, i) => box(x, CURTAIN_TOP + BUBBLE / 2 + i * (BUBBLE + 14), BUBBLE, BUBBLE));
    } else if (portrait) {
      const y = floor + 20 + BUBBLE / 2;
      bubbles = WAYS.map((_, i) => box(cx + (i - 1) * (BUBBLE + 15), y, BUBBLE, BUBBLE));
      seats = seats.map((_, i) => ({ x: cx + (i - 1) * 110, y: y + BUBBLE / 2 + 100 })); // the heads clear the bubbles
    } else {
      // A short landscape (a phone): the row sits between the guide and Bow, beneath the slot.
      const step = BUBBLE + 10;
      const start = bow.x - BOW_W / 2 - 10 - BUBBLE / 2 - 2 * step;
      const y = floor + 12 + BUBBLE / 2;
      bubbles = WAYS.map((_, i) => box(start + i * step, y, BUBBLE, BUBBLE));
      seats = [];
    }
  }
  let places: number[] = [],
    marks: [number, number][] = [],
    snap = 0,
    peeks: Box[] = [],
    cards: Box[] = [],
    end: Box | null = null;
  if (story) {
    places = [stand.min + APART / 2, stand.max - APART / 2];
    marks = places.map((p) => [p - APART / 2, p + APART / 2] as [number, number]);
    snap = Math.min(120, (places[1] - places[0]) / 2);
    peeks = [
      box(stand.min, floor + PEEK_H / 2, PEEK_W, PEEK_H),
      box(stand.max, floor + PEEK_H / 2, PEEK_W, PEEK_H),
    ];
    const n = Math.min(3, level - 3);
    const spanRight = tassel.x - TASSEL / 2 - 12;
    const total = n * CARD_W + (n - 1) * CARD_GAP;
    const start = (CARD_LEFT + spanRight) / 2 - total / 2 + CARD_W / 2;
    cards = Array.from({ length: n }, (_, i) => box(start + i * (CARD_W + CARD_GAP), CARD_Y, CARD_W, CARD_H));
    if (level >= 6) end = box(bow.x - BOW_W - 20, bow.y, BOW_W, BOW_H);
    // The front row sits under the floor between the peeks; upright, below them.
    if (portrait) seats = seats.map((s) => ({ x: s.x, y: floor + PEEK_H + 70 }));
  }
  const bottom = floor + (story ? PEEK_H + 10 : 50);
  return {
    portrait,
    stage: { left, right, top: ARCH_TOP, floor, bottom },
    curtains,
    tassel,
    floorTouch,
    stand,
    homes,
    spots,
    bubbles,
    bow,
    seats,
    places,
    marks,
    snap,
    peeks,
    cards,
    end,
  };
}

/** The place (0 left, 1 right) whose centre is within the snap half-width of `x`, or null. */
export function placeAt(x: number, l: Pick<Layout, 'places' | 'snap'>): 0 | 1 | null {
  for (const i of [0, 1] as const)
    if (l.places[i] !== undefined && Math.abs(x - l.places[i]) <= l.snap + EPS) return i;
  return null;
}

/** The place's mark nearest `x` that stands at least `APART` from every other standing puppet, or null if both are taken. */
export function freeMark(
  place: 0 | 1,
  x: number,
  others: readonly number[],
  l: Pick<Layout, 'marks'>,
): 0 | 1 | null {
  const order = ([0, 1] as const)
    .slice()
    .sort((a, b) => Math.abs(l.marks[place][a] - x) - Math.abs(l.marks[place][b] - x));
  for (const m of order) if (others.every((o) => apart(o, l.marks[place][m], APART))) return m;
  return null;
}

/** Where a puppet rises for a touch at `x`: inside the stand range and at least `APART` from the others standing. */
export function standAt(x: number, others: readonly number[], stand: { min: number; max: number }): number {
  let at = Math.min(stand.max, Math.max(stand.min, x));
  for (let i = 0; i < 4; i++) {
    const near = others.find((o) => Math.abs(o - at) < APART);
    if (near === undefined) break;
    const pushed = at >= near ? near + APART : near - APART;
    at = pushed > stand.max ? near - APART : pushed < stand.min ? near + APART : pushed;
  }
  return Math.min(stand.max, Math.max(stand.min, at));
}

/** The parked puppet whose home is nearest to `x`. */
export function nearestParked(x: number, parked: readonly Puppet[], homes: readonly number[]): Puppet | null {
  let best: Puppet | null = null,
    dist = Infinity;
  for (const p of parked) {
    const d = Math.abs(homes[PUPPETS.indexOf(p)] - x);
    if (d < dist) {
      dist = d;
      best = p;
    }
  }
  return best;
}

/** The sticker's puppet for a seed. */
export const stickerPuppet = (seed: number): Puppet => PUPPETS[Math.abs(Math.floor(seed)) % PUPPETS.length];
